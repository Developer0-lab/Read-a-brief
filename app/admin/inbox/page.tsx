import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function StoryInbox() {
  const supabase = await createClient()
  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, title, description, category, country, status, published_at, created_at, canonical_url')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <main className="site">
      <header className="header"><div className="header-inner"><Link className="brand" href="/admin">READ-A-BRIEF <span>/ OPERATIONS</span></Link><nav className="nav"><Link href="/admin">Dashboard</Link><Link href="/admin/sources">Sources</Link><Link href="/">Public site</Link></nav></div></header>
      <div className="content admin-content">
        <div className="section-head"><div><div className="eyebrow">Editorial pipeline</div><h2>Story Inbox</h2></div><span className="muted">{stories?.length ?? 0} recent stories</span></div>
        {error ? <section className="empty-state"><h3>Could not load stories</h3><p>{error.message}</p></section> : stories && stories.length > 0 ? <section className="table-card"><div className="story-table-head"><span>Story</span><span>Status</span><span>Source</span></div>{stories.map((story) => <div className="story-row" key={story.id}><div><strong>{story.title}</strong><small>{story.category || story.country || 'Uncategorized'} · {new Date(story.created_at).toLocaleString()}</small></div><span className={`status status-${story.status}`}>{story.status}</span><a href={story.canonical_url} target="_blank" rel="noreferrer">Original ↗</a></div>)}</section> : <section className="empty-state"><div className="empty-mark">R</div><h3>No stories detected yet.</h3><p>Add and enable a source, then run the ingestion automation. Detected stories will appear here for editorial review.</p><Link className="button-link" href="/admin/sources">Manage sources →</Link></section>}
      </div>
    </main>
  )
}
