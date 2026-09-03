import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function manager() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null }
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle()
  const role = profile?.is_active && (profile.role === 'admin' || profile.role === 'editor') ? profile.role : null
  return { supabase, user, role }
}

export async function POST(request: Request) {
  const { supabase, user, role } = await manager()
  if (!user || !role) return Response.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const body = await request.json()
    const storyId = typeof body.storyId === 'string' ? body.storyId.trim() : ''
    if (!storyId) return Response.json({ error: 'storyId is required' }, { status: 400 })

    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id,source_id,title,description,category,country,language,canonical_url,status')
      .eq('id', storyId)
      .single()
    if (storyError || !story) return Response.json({ error: 'Story not found' }, { status: 404 })
    if (story.status !== 'approved') return Response.json({ error: 'Only approved stories can become briefings.' }, { status: 409 })

    const { data: existingSource } = await supabase
      .from('brief_sources')
      .select('brief_id')
      .eq('story_id', story.id)
      .maybeSingle()
    if (existingSource?.brief_id) return Response.json({ ok: true, id: existingSource.brief_id, existing: true })

    const { data: source } = await supabase.from('sources').select('name').eq('id', story.source_id).maybeSingle()
    const { data: brief, error } = await supabase.from('briefs').insert({
      headline: story.title,
      dek: story.description,
      summary: story.description,
      category: story.category,
      country: story.country,
      language: story.language || 'English',
      source_count: 1,
      status: 'review',
      created_by: user.id,
    }).select('id').single()
    if (error || !brief) return Response.json({ error: 'Could not create brief.' }, { status: 500 })

    const { error: sourceError } = await supabase.from('brief_sources').insert({
      brief_id: brief.id,
      story_id: story.id,
      source_name: source?.name || 'Source',
      source_url: story.canonical_url,
      attribution: `Source: ${source?.name || 'Original report'}`,
    })
    if (sourceError) {
      await supabase.from('briefs').delete().eq('id', brief.id)
      return Response.json({ error: 'Could not attach source attribution.' }, { status: 500 })
    }

    return Response.json({ ok: true, id: brief.id })
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
