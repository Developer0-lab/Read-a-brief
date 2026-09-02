import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const [{ count: sources }, { count: stories }, { count: briefs }, { data: { user } }] = await Promise.all([
    supabase.from('sources').select('*', { count: 'exact', head: true }),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('briefs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.auth.getUser(),
  ])
  const stats = [['Sources', sources ?? 0, 'Approved feeds and news APIs.'], ['Stories detected', stories ?? 0, 'Stories currently in the pipeline.'], ['Briefs published', briefs ?? 0, 'Generated and published briefs.']]
  return <main className="site"><header className="header"><div className="header-inner"><div className="brand">READ-A-BRIEF <span>/ OPERATIONS</span></div><div style={{display:'flex',gap:18,alignItems:'center'}}><span className="muted">{user?.email}</span><SignOutButton/><a href="/">Public site</a></div></div></header><div className="content" style={{marginTop:0,paddingTop:42}}><div className="section-head"><div><div className="eyebrow">Operations center</div><h2>Control the briefing engine</h2></div><span className="muted">Live Supabase data</span></div><section className="grid">{stats.map(([title,value,description])=><article className="card" key={String(title)}><div className="tag">{title}</div><h3>{String(value)}</h3><p>{String(description)}</p></article>)}</section><section className="card" style={{marginTop:20}}><div className="tag">SOURCE CONTROL</div><h3>Sources Manager</h3><p>Add, test, enable or disable the approved feeds that power the ingestion engine.</p><Link href="/admin/sources">Open Sources Manager →</Link></section></div></main>
}
