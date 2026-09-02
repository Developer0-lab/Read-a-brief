import { createHash } from "node:crypto";
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
  const rss = [...xml.matchAll(/<item(?:\\s[^>]*)?>([\\s\\S]*?)<\\/item>/gi)].map((m) => m[1]);
  const atom = [...xml.matchAll(/<entry(?:\\s[^>]*)?>([\\s\\S]*?)<\\/entry>/gi)].map((m) => m[1]);
  return [...rss, ...atom];
}

function link(item: string): string | null {
  const direct = tag(item, "link");
  if (direct) return direct;
  const href = item.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1];
  return href ? text(href) : null;
}

export function normalizeFeed(xml: string, source: FeedSource): DiscoveredStory[] {
  return items(xml).map((item, index) => {
    const canonicalUrl = link(item) ?? `${source.feedUrl}#item-${index}`;
    const title = tag(item, "title") ?? "Untitled story";
    const publishedAt = tag(item, "pubDate") ?? tag(item, "published") ?? tag(item, "updated");
    const description = tag(item, "description") ?? tag(item, "summary") ?? tag(item, "content");
    const externalId = tag(item, "guid") ?? tag(item, "id") ?? canonicalUrl;
    const contentHash = createHash("sha256").update(`${title}\n${description ?? ""}\n${canonicalUrl}`).digest("hex");
    return {
      sourceId: source.id,
      externalId,
      canonicalUrl,
      title,
      description,
      publishedAt,
      contentHash,
      category: source.category,
      country: source.country,
      metadata: { sourceType: source.sourceType },
    };
  }).filter((story) => story.title !== "Untitled story" || story.canonicalUrl);
}

export async function fetchFeed(source: FeedSource): Promise<DiscoveredStory[]> {
  const response = await fetch(source.feedUrl, {
    headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Feed returned HTTP ${response.status}`);
  const xml = await response.text();
  return normalizeFeed(xml, source);
}
