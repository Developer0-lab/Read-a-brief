import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle()
  if (!Boolean(profile?.is_active && ['admin', 'editor'].includes(profile.role))) return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const briefIds = Array.isArray(body.briefIds) ? [...new Set(body.briefIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim()).map((id: string) => id.trim()))] : []
    if (!briefIds.length || briefIds.length > 100) return Response.json({ error: 'Select between 1 and 100 briefings.' }, { status: 400 })

    const { data: briefs, error } = await supabase.from('briefs').select('id,status,headline,summary').in('id', briefIds)
    if (error) return Response.json({ error: 'Could not load selected briefings.' }, { status: 500 })

    const now = new Date().toISOString()
    const publishable = (briefs ?? []).filter(b => ['review', 'approved'].includes(b.status) && b.headline?.trim() && b.summary?.trim())
    const skipped = (briefs ?? []).filter(b => !publishable.some(p => p.id === b.id))
    if (publishable.length) {
      const { error: updateError } = await supabase.from('briefs').update({ status: 'published', published_at: now, reviewed_at: now }).in('id', publishable.map(b => b.id))
      if (updateError) return Response.json({ error: 'Could not publish the selected briefings.' }, { status: 500 })
    }

    return Response.json({ ok: true, published: publishable.length, skipped: skipped.length, skippedHeadlines: skipped.map(b => b.headline) })
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }
}
