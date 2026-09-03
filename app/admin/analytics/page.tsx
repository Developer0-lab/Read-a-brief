import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const [{ count: sources }, { count: stories }, { count: published }, { count: review }, { count: rejected }] = await Promise.all([
    supabase.from('sources').select('*', { count: 'exact', head: true }).eq('enabled', true),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('briefs').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('stories').select('*', { count: 'exact', head: true }).eq('status', 'review'),
    supabase.from('stories').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ])
  const metrics = [['Enabled sources', sources ?? 0], ['Stories', stories ?? 0], ['Published briefs', published ?? 0], ['Awaiting review', review ?? 0], ['Rejected stories', rejected ?? 0]]
  return <main className="site"><header className="header"><div className="header-inner"><Link className="brand" href="/admin">READ-A-BRIEF <span>/ ANALYTICS</span></Link><nav className="nav"><Link href="/admin">Dashboard</Link><Link href="/admin/inbox">Inbox</Link><Link href="/admin/automation">Automation</Link><Link href="/">Public site</Link></nav></div></header><div className="content admin-content"><div className="section-head"><div><div className="eyebrow">Editorial intelligence</div><h2>Analytics</h2><p className="muted">Current pipeline totals from Supabase.</p></div></div><section className="grid">{metrics.map(([label,value])=><article className="card" key={String(label)}><div className="tag">{label}</div><h3>{String(value)}</h3></article>)}</section><section className="card" style={{marginTop:20}}><div className="tag">NEXT</div><h3>Detailed reporting</h3><p>Historical trends, source performance, category distribution and publishing velocity can be added without changing the core editorial data model.</p></section></div></main>
}
