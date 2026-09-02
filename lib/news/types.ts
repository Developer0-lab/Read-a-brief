export type FeedSource = {
  id: string
  name: string
  feedUrl: string
  homepageUrl?: string | null
  category?: string | null
  country?: string | null
  sourceType: 'rss' | 'atom' | 'api' | 'website'
}

export type DiscoveredStory = {
  sourceId: string
  externalId?: string | null
  canonicalUrl: string
  title: string
  description?: string | null
  author?: string | null
  publishedAt?: string | null
  contentHash?: string | null
  language?: string | null
  category?: string | null
  country?: string | null
  metadata?: Record<string, unknown>
}

export type BriefDraft = {
  headline: string
  dek?: string
  summary: string
  whyItMatters?: string
  whatHappensNext?: string
  body?: string
  category?: string
  country?: string
  language: string
  confidence?: number
  provider?: string
  model?: string
  metadata?: Record<string, unknown>
}
