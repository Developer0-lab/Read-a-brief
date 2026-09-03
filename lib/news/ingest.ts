import { createHash } from "node:crypto";
import dns from "node:dns/promises";
import type { DiscoveredStory, FeedSource } from "./types";

function text(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function tag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return text(match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"));
}

function items(xml: string): string[] {
  const rss = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);
  const atom = [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)].map((m) => m[1]);
  return [...rss, ...atom];
}

function link(item: string): string | null {
  const direct = tag(item, "link");
  if (direct) return direct;
  const href = item.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1];
  return href ? text(href) : null;
}

function publicUrl(value: string, label: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`${label} must use HTTP or HTTPS`);
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === 'localhost.localdomain' || host === 'ip6-localhost' || host === '0.0.0.0' || host === '::1' || host === '169.254.169.254' || /^10\./.test(host) || /^127\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) || /^fc[0-9a-f]{2}:/i.test(host) || /^fd[0-9a-f]{2}:/i.test(host) || /^fe[89ab][0-9a-f]:/i.test(host)) throw new Error(`${label} points to a private network`);
  return url.toString();
}

async function safeFeedUrl(value: string): Promise<string> {
  const normalized = publicUrl(value, 'Feed URL');
  const hostname = new URL(normalized).hostname;
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error('Feed hostname could not be resolved');
  for (const address of addresses) publicUrl(`http://${address.address}`, 'Feed URL');
  return normalized;
}

export function normalizeFeed(xml: string, source: FeedSource): DiscoveredStory[] {
  return items(xml).map((item, index) => {
    const rawUrl = link(item) ?? `${source.feedUrl}#item-${index}`;
    let canonicalUrl = rawUrl;
    try { canonicalUrl = publicUrl(rawUrl, 'Story URL'); } catch { canonicalUrl = source.feedUrl; }
    const title = tag(item, "title") ?? "Untitled story";
    const publishedAt = tag(item, "pubDate") ?? tag(item, "published") ?? tag(item, "updated");
    const description = tag(item, "description") ?? tag(item, "summary") ?? tag(item, "content");
    const externalId = tag(item, "guid") ?? tag(item, "id") ?? canonicalUrl;
    const contentHash = createHash("sha256").update(`${title}\n${description ?? ""}\n${canonicalUrl}`).digest("hex");
    return { sourceId: source.id, externalId, canonicalUrl, title, description, publishedAt, contentHash, category: source.category, country: source.country, metadata: { sourceType: source.sourceType } };
  }).filter((story) => story.title !== "Untitled story" || story.canonicalUrl);
}

export async function fetchFeed(source: FeedSource): Promise<DiscoveredStory[]> {
  let url = await safeFeedUrl(source.feedUrl);
  for (let redirects = 0; redirects < 4; redirects++) {
    const response = await fetch(url, { headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9" }, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(20_000) });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`Feed returned HTTP ${response.status}`);
      url = await safeFeedUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Feed returned HTTP ${response.status}`);
    const length = Number(response.headers.get('content-length') || 0);
    if (length > 2_000_000) throw new Error('Feed response is too large');
    const xml = await response.text();
    return normalizeFeed(xml, { ...source, feedUrl: url });
  }
  throw new Error('Too many feed redirects');
}
