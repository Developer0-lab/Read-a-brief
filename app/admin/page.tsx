import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const [{ count: sources }, { count: stories }, { count: briefs }, { count: review }, { data: recentStories }] = await Promise.all([
    supabase.from('sources').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('briefs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('stories').select('*', { count: 'exact', head: true }).eq('status', 'review'),
    supabase.from('stories').select('id,title,category,country,status,created_at,canonical_url').order('created_at', { ascending: false }).limit(6),
  ])

  const stats = [
    ['Stories detected', stories ?? 0, 'Incoming stories in the pipeline.'],
    ['Awaiting review', review ?? 0, 'Stories waiting for an editorial decision.'],
    ['Briefs published', briefs ?? 0, 'Editorially approved public briefings.'],
    ['Active sources', sources ?? 0, 'Configured feeds and news APIs.'],
  ]

  return <main className="site"><div className="content admin-content">
    <div className="section-head admin-page-head"><div><div className="eyebrow">Dashboard</div><h2>Editorial control center</h2><p className="admin-page-subtitle">A live view of what is entering, waiting, and being published.</p></div><span className="muted">Live Supabase data</span></div>

    <section className="grid admin-stats">{stats.map(([title,value,description]) => <article className="card stat-card" key={String(title)}><div className="tag">{title}</div><h3>{String(value)}</h3><p>{String(description)}</p></article>)}</section>

    <section className="admin-dashboard-grid">
      <article className="card dashboard-panel editorial-panel">
        <div className="panel-head"><div><div className="tag">EDITORIAL QUEUE</div><h3>Latest incoming stories</h3></div><Link href="/admin/inbox">View all →</Link></div>
        {recentStories && recentStories.length > 0 ? <div className="dashboard-story-list">{recentStories.map((story) => <div className="dashboard-story" key={story.id}><div className="dashboard-story-main"><Link href={`/admin/inbox/${story.id}`}><strong>{story.title}</strong></Link><small>{story.category || story.country || 'Uncategorized'} · {new Date(story.created_at).toLocaleString()}</small></div><span className={`status status-${story.status}`}>{story.status}</span></div>)}</div> : <div className="panel-empty"><strong>No incoming stories</strong><span>Enable a source and run ingestion to populate the editorial queue.</span><Link href="/admin/sources">Manage sources →</Link></div>}
      </article>

      <article className="card dashboard-panel automation-panel">
        <div className="tag">AUTOMATION HEALTH</div><h3>Ingestion operations</h3>
        <div className="health-row"><span>Sources configured</span><strong>{sources ?? 0}</strong></div>
        <div className="health-row"><span>Stories detected</span><strong>{stories ?? 0}</strong></div>
        <div className="health-row"><span>Awaiting review</span><strong>{review ?? 0}</strong></div>
        <div className="health-row"><span>Published briefs</span><strong>{briefs ?? 0}</strong></div>
        <Link className="button-link" href="/admin/automation">Open automation →</Link>
      </article>
    </section>

    <div className="admin-links"><section className="card"><div className="tag">EDITORIAL</div><h3>Story Inbox</h3><p>Review detected stories before they enter the publishing workflow.</p><Link className="button-link" href="/admin/inbox">Open Story Inbox →</Link></section><section className="card"><div className="tag">PUBLISHING</div><h3>Briefings</h3><p>Create, edit, approve and publish original briefings with source attribution.</p><Link className="button-link" href="/admin/briefs">Manage Briefings →</Link></section><section className="card"><div className="tag">SOURCE CONTROL</div><h3>Sources Manager</h3><p>Add, test, enable or disable the feeds powering ingestion.</p><Link className="button-link" href="/admin/sources">Open Sources Manager →</Link></section><section className="card"><div className="tag">AUTOMATION</div><h3>Automation</h3><p>Monitor scheduled ingestion runs and pipeline health.</p><Link className="button-link" href="/admin/automation">Open Automation →</Link></section><section className="card"><div className="tag">ANALYTICS</div><h3>Analytics</h3><p>View current source, story, review and publishing totals.</p><Link className="button-link" href="/admin/analytics">Open Analytics →</Link></section><section className="card"><div className="tag">ACCESS CONTROL</div><h3>Users & roles</h3><p>Review accounts, assigned roles and active status for the operations team.</p><Link className="button-link" href="/admin/users">Open User Management →</Link></section></div>
  </div></main>
}
