import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AutomationPage() {
  const supabase = await createClient()
  const { data: runs, error } = await supabase
    .from('automation_runs')
    .select('id, job_type, status, started_at, finished_at, sources_checked, stories_discovered, stories_processed, briefs_generated, briefs_published, error_message')
    .order('started_at', { ascending: false })
    .limit(50)

  return <main className="site">
    <header className="header"><div className="header-inner"><Link className="brand" href="/admin">READ-A-BRIEF <span>/ AUTOMATION</span></Link><nav className="nav"><Link href="/admin">Dashboard</Link><Link href="/admin/sources">Sources</Link><Link href="/admin/inbox">Inbox</Link><Link href="/">Public site</Link></nav></div></header>
    <div className="content admin-content">
      <div className="section-head"><div><div className="eyebrow">Pipeline monitoring</div><h2>Automation</h2><p className="muted">Monitor ingestion and briefing jobs without exposing service credentials in the browser.</p></div></div>
      <section className="card" style={{marginBottom:20}}><div className="tag">SCHEDULE</div><h3>Automatic ingestion</h3><p>Enabled source polling is handled by the server-side ingestion endpoint. The production schedule is configured in the deployment configuration.</p><p className="muted">No AI provider is hard-coded into this control surface.</p></section>
      {error ? <section className="empty-state"><h3>Could not load automation history</h3><p>{error.message}</p></section> : runs && runs.length ? <section className="table-card"><div className="story-table-head"><span>Job</span><span>Status</span><span>Results</span></div>{runs.map((run) => <div className="story-row" key={run.id}><div><strong>{run.job_type}</strong><small>{new Date(run.started_at).toLocaleString()} {run.finished_at ? `→ ${new Date(run.finished_at).toLocaleString()}` : '· running'}</small>{run.error_message && <small className="auth-error">{run.error_message}</small>}</div><span className={`status status-${run.status}`}>{run.status}</span><span><small>{run.sources_checked} sources · {run.stories_discovered} discovered · {run.briefs_generated} briefs · {run.briefs_published} published</small></span></div>)}</section> : <section className="empty-state"><div className="empty-mark">R</div><h3>No automation runs yet.</h3><p>Once ingestion runs, its execution history and counters will appear here.</p><Link className="button-link" href="/admin/sources">Configure sources →</Link></section>}
    </div>
  </main>
}
