import type { BriefDraft, DiscoveredStory } from './types'

/**
 * Provider-neutral briefing boundary.
 *
 * The automation pipeline deliberately does not import or call OpenAI.
 * A future provider can implement this contract without changing ingestion,
 * storage, publishing, attribution, or the admin system.
 */
export interface BriefingProvider {
  readonly name: string
  readonly model?: string
  createBrief(stories: DiscoveredStory[]): Promise<BriefDraft>
}

export function getBriefingProvider(): BriefingProvider {
  throw new Error(
    'No briefing provider is configured. Set up an approved non-OpenAI provider before enabling AI generation.',
  )
}
