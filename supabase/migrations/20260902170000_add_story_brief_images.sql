-- Preserve source-provided story images for visual news cards and briefing pages.
-- Images are URLs supplied by the source feed/API; Read-a-Brief does not copy protected article media.

alter table public.stories add column if not exists image_url text;
alter table public.briefs add column if not exists image_url text;
