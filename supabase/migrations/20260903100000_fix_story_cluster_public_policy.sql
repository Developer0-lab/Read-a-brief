drop policy if exists public_read_published_clusters on public.story_clusters;

create policy public_read_published_clusters
on public.story_clusters
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.briefs b
    where b.cluster_id = story_clusters.id
      and b.status = 'published'::content_status
      and b.published_at is not null
  )
);
