import { createClient } from '@/lib/supabase/server'
import { fetchFeed } from '@/lib/news/ingest'
import type { FeedSource } from '@/lib/news/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle()
  if (!profile || profile.is_active === false || !['admin','editor'].includes(profile.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  if (!body.feedUrl) return Response.json({ error: 'Feed URL is required' }, { status: 400 })
  try {
    const stories = await fetchFeed({ id: body.id || 'test', name: body.name || 'Test source', feedUrl: body.feedUrl, homepageUrl: body.homepageUrl, category: body.category, country: body.country, sourceType: body.sourceType || 'rss', enabled: true } as FeedSource)
    return Response.json({ ok: true, count: stories.length, stories: stories.slice(0, 5).map(s => ({ title:s.title, url:s.canonicalUrl, publishedAt:s.publishedAt })) })
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Feed test failed' }, { status: 400 }) }
}
