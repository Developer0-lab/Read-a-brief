import { createHash } from "node:crypto";
import dns from "node:dns/promises";
import { isIP } from "node:net";
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

function isPrivateAddress(address: string): boolean {
  const lower = address.toLowerCase();
  if (isIP(lower) === 4) return lower === '0.0.0.0' || lower === '127.0.0.1' || lower === '169.254.169.254' || /^10\./.test(lower) || /^192\.168\./.test(lower) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(lower);
  if (isIP(lower) === 6) return lower === '::' || lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || /^(fe[89ab])/i.test(lower) || lower.startsWith('::ffff:127.') || lower.startsWith('::ffff:10.') || lower.startsWith('::ffff:192.168.') || lower.startsWith('::ffff:172.');
  return false;
}

function publicUrl(value: string, label: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`${label} must use HTTP or HTTPS`);
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === 'localhost.localdomain' || host === 'ip6-localhost' || isPrivateAddress(host)) throw new Error(`${label} points to a private network`);
  return url.toString();
}

async function safeFeedUrl(value: string): Promise<string> {
  const normalized = publicUrl(value, 'Feed URL');
  const hostname = new URL(normalized).hostname;
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) throw new Error('Feed hostname resolves to a private network');
  return normalized;
}

function apiItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  if (!payload || typeof payload !== 'object') return [];
  const object = payload as Record<string, unknown>;
  for (const key of ['items', 'articles', 'stories', 'results', 'data']) if (Array.isArray(object[key])) return object[key].filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
  return [];
}

function normalizeApi(payload: unknown, source: FeedSource): DiscoveredStory[] {
  return apiItems(payload).map((item, index) => {
    const title = text(String(item.title ?? item.headline ?? '')) ?? 'Untitled story';
    const rawUrl = String(item.url ?? item.link ?? item.canonical_url ?? `${source.feedUrl}#item-${index}`);
    let canonicalUrl = source.feedUrl;
    try { canonicalUrl = publicUrl(rawUrl, 'Story URL'); } catch {}
    const description = text(String(item.description ?? item.summary ?? item.dek ?? ''));
    const publishedAt = item.published_at ?? item.publishedAt ?? item.published ?? item.pubDate ?? item.updated;
    const author = text(String(item.author ?? item.byline ?? ''));
    const externalId = text(String(item.id ?? item.guid ?? item.external_id ?? canonicalUrl)) ?? canonicalUrl;
    const contentHash = createHash("sha256").update(`${title}\n${description ?? ""}\n${canonicalUrl}`).digest("hex");
    return { sourceId: source.id, externalId, canonicalUrl, title, description, author, publishedAt: publishedAt ? String(publishedAt) : null, contentHash, category: source.category, country: source.country, metadata: { sourceType: source.sourceType } };
  }).filter((story) => story.title !== "Untitled story" || story.canonicalUrl);
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
    const response = await fetch(url, { headers: { accept: source.sourceType === 'api' ? 'application/json, text/json;q=0.9' : 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9' }, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(20_000) });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`Feed returned HTTP ${response.status}`);
      url = await safeFeedUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Feed returned HTTP ${response.status}`);
    const length = Number(response.headers.get('content-length') || 0);
    if (length > 2_000_000) throw new Error('Feed response is too large');
    if (source.sourceType === 'api') {
      let payload: unknown;
      try { payload = await response.json(); } catch { throw new Error('API source did not return valid JSON'); }
      return normalizeApi(payload, { ...source, feedUrl: url });
    }
    const xml = await response.text();
    return normalizeFeed(xml, { ...source, feedUrl: url });
  }
  throw new Error('Too many feed redirects');
}
