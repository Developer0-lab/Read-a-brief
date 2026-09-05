import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BulkBriefActions from './bulk-actions'

export const dynamic='force-dynamic'

export default async function BriefsPage(){
 const supabase=await createClient(); const{data:briefs,error}=await supabase.from('briefs').select('id,headline,category,country,status,published_at,created_at').order('created_at',{ascending:false}).limit(100)
 return <main className="site"><header className="header"><div className="header-inner"><Link className="brand" href="/admin">READ-A-BRIEF <span>/ BRIEFS</span></Link><nav className="nav"><Link href="/admin">Dashboard</Link><Link href="/admin/inbox">Inbox</Link><Link href="/admin/automation">Automation</Link><Link href="/">Public site</Link></nav></div></header><div className="content admin-content"><div className="section-head"><div><div className="eyebrow">Publishing</div><h2>Briefings</h2></div><span className="muted">{briefs?.length??0} recent</span></div>{error?<section className="empty-state"><h3>Could not load briefs</h3><p>{error.message}</p></section>:briefs?.length?<BulkBriefActions briefs={briefs}/>:<section className="empty-state"><h3>No briefings yet.</h3><p>Approve stories in the Story Inbox, then create their briefings.</p><Link className="button-link" href="/admin/inbox">Open Story Inbox →</Link></section>}</div></main>
}
