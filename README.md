# Read-a-Brief

AI-powered news briefing platform.

## Architecture

- Next.js + React + TypeScript for the web application
- Supabase for accounts, PostgreSQL data, storage and backend services
- A provider-neutral AI layer for briefing generation and classification — **OpenAI is not used**
- Vercel for deployment
- GitHub as the source of truth

## Planned operations pipeline

1. Monitor permitted RSS feeds and news APIs.
2. Detect new stories and normalize metadata.
3. Deduplicate related stories.
4. Send only the permitted source material needed for analysis to the configured non-OpenAI AI provider.
5. Generate an original, concise briefing.
6. Store source attribution and processing metadata.
7. Run validation checks.
8. Publish approved briefs automatically.

The automation layer is intentionally provider-neutral so the AI provider can be changed without rebuilding the news pipeline. No OpenAI API key or OpenAI-specific dependency should be required by the automation system.

The platform will not republish protected articles verbatim. Source attribution and links will be retained where appropriate.
