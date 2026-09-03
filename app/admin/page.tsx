import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const [{ count: sources }, { count: stories }, { count: briefs }, { count: review }, { data: { user } }] = await Promise.all([
    supabase.from('sources').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('briefs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('stories').select('*', { count: 'exact', head: true }).eq('status', 'review'),
    supabase.auth.getUser(),
  ])
  const stats = [['Sources', sources ?? 0, 'Approved feeds and news APIs.'], ['Stories detected', stories ?? 0, 'Stories currently in the pipeline.'], ['Briefs published', briefs ?? 0, 'Editorially approved public briefings.'], ['Awaiting review', review ?? 0, 'Stories waiting for an editorial decision.']]
  return <main className="site"><header className="header"><div className="header-inner"><Link className="brand" href="/admin">READ-A-BRIEF <span>/ OPERATIONS</span></Link><div style={{display:'flex',gap:18,alignItems:'center'}}><span className="muted">{user?.email}</span><SignOutButton/><Link href="/">Public site</Link></div></div></header><div className="content admin-content"><div className="section-head"><div><div className="eyebrow">Operations center</div><h2>Control the briefing engine</h2></div><span className="muted">Live Supabase data</span></div><section className="grid">{stats.map(([title,value,description])=><article className="card" key={String(title)}><div className="tag">{title}</div><h3>{String(value)}</h3><p>{String(description)}</p></article>)}</section><div className="admin-links"><section className="card"><div className="tag">EDITORIAL</div><h3>Story Inbox</h3><p>Review detected stories before they enter the publishing workflow.</p><Link className="button-link" href="/admin/inbox">Open Story Inbox →</Link></section><section className="card"><div className="tag">PUBLISHING</div><h3>Briefings</h3><p>Create, edit, approve and publish original briefings with source attribution.</p><Link className="button-link" href="/admin/briefs">Manage Briefings →</Link></section><section className="card"><div className="tag">SOURCE CONTROL</div><h3>Sources Manager</h3><p>Add, test, enable or disable the approved feeds powering ingestion.</p><Link className="button-link" href="/admin/sources">Open Sources Manager →</Link></section><section className="card"><div className="tag">AUTOMATION</div><h3>Automation</h3><p>Monitor scheduled ingestion runs and pipeline health.</p><Link className="button-link" href="/admin/automation">Open Automation →</Link></section><section className="card"><div className="tag">ANALYTICS</div><h3>Analytics</h3><p>View current source, story, review and publishing totals.</p><Link className="button-link" href="/admin/analytics">Open Analytics →</Link></section><section className="card"><div className="tag">ACCESS CONTROL</div><h3>Users & roles</h3><p>Review accounts, assigned roles and active status for the operations team.</p><Link className="button-link" href="/admin/users">Open User Management →</Link></section></div></div></main>
}
