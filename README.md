# Read-a-Brief

AI-powered news briefing platform.

## Architecture

- Next.js + React + TypeScript for the web application
- Supabase for accounts, PostgreSQL data, storage and backend services
- OpenAI API for briefing generation and classification
- Vercel for deployment
- GitHub as the source of truth

## Planned operations pipeline

1. Monitor permitted RSS feeds and news APIs.
2. Detect new stories and normalize metadata.
3. Deduplicate related stories.
4. Generate an original, concise briefing from permitted source material.
5. Store source attribution and processing metadata.
6. Run validation checks.
7. Publish approved briefs automatically.

The platform will not republish protected articles verbatim. Source attribution and links will be retained where appropriate.
