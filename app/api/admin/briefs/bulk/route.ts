import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function manager() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null }
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle()
  if (!profile || !profile.is_active || (profile.role !== 'admin' && profile.role !== 'editor')) return { supabase, user, role: null }
  return { supabase, user, role: profile.role }
}

export async function POST(request: Request) {
  const { supabase, user, role } = await manager()
  if (!user || !role) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const storyIds = Array.isArray(body.storyIds) ? [...new Set(body.storyIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0).map((id: string) => id.trim()))] : []
    if (!storyIds.length || storyIds.length > 100) return Response.json({ error: 'Select between 1 and 100 stories.' }, { status: 400 })

    const { data: stories, error } = await supabase.from('stories')
      .select('id,source_id,title,description,category,country,language,canonical_url,status,image_url')
      .in('id', storyIds)
    if (error) return Response.json({ error: 'Could not load selected stories.' }, { status: 500 })

    let created = 0
    let existing = 0
    const errors: string[] = []

    for (const story of stories ?? []) {
      if (story.status === 'rejected') { errors.push(story.title); continue }
      if (story.status !== 'approved') {
        const { error: approveError } = await supabase.from('stories').update({ status: 'approved' }).eq('id', story.id)
        if (approveError) { errors.push(story.title); continue }
      }

      const { data: existingSource } = await supabase.from('brief_sources').select('brief_id').eq('story_id', story.id).maybeSingle()
      if (existingSource?.brief_id) { existing++; continue }

      const { data: source } = await supabase.from('sources').select('name').eq('id', story.source_id).maybeSingle()
      const description = story.description?.trim() || null
      const { data: brief, error: briefError } = await supabase.from('briefs').insert({
        headline: story.title,
        dek: description,
        summary: description || story.title,
        body: description,
        category: story.category,
        country: story.country,
        language: story.language || 'en',
        image_url: story.image_url,
        source_count: 1,
        status: 'review',
        created_by: user.id,
      }).select('id').single()
      if (briefError || !brief) { errors.push(story.title); continue }

      const { error: sourceError } = await supabase.from('brief_sources').insert({
        brief_id: brief.id,
        story_id: story.id,
        source_name: source?.name || 'Source',
        source_url: story.canonical_url,
        attribution: `Source: ${source?.name || 'Original report'}`,
      })
      if (sourceError) {
        await supabase.from('briefs').delete().eq('id', brief.id)
        errors.push(story.title)
        continue
      }
      created++
    }

    const processed = created + existing + errors.length
    const skipped = Math.max(0, storyIds.length - processed)
    return Response.json({ ok: true, created, existing, skipped, errors })
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
