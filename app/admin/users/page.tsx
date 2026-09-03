import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: profiles, error } = await supabase.from('profiles').select('id, display_name, avatar_url, role, is_active, created_at').order('created_at', { ascending: false })

  return <main className="site"><header className="header"><div className="header-inner"><Link className="brand" href="/admin">READ-A-BRIEF <span>/ PEOPLE</span></Link><nav className="nav"><Link href="/admin">Dashboard</Link><Link href="/admin/inbox">Inbox</Link><Link href="/admin/automation">Automation</Link><Link href="/">Public site</Link></nav></div></header><div className="content admin-content"><div className="section-head"><div><div className="eyebrow">Access control</div><h2>Users & roles</h2></div><span className="muted">{profiles?.length ?? 0} profiles</span></div>{error ? <section className="empty-state"><h3>Could not load users</h3><p>{error.message}</p></section> : profiles && profiles.length ? <section className="table-card"><div className="story-table-head"><span>User</span><span>Role</span><span>State</span></div>{profiles.map((profile) => <div className="story-row" key={profile.id}><div><strong>{profile.display_name || 'Unnamed user'}</strong><small>Profile created {new Date(profile.created_at).toLocaleDateString()}</small></div><span className="status">{profile.role}</span><span className={`status ${profile.is_active ? 'status-published' : 'status-rejected'}`}>{profile.is_active ? 'Active' : 'Inactive'}</span></div>)}</section> : <section className="empty-state"><h3>No user profiles yet.</h3><p>Accounts created through Supabase Auth will appear here when their profile records exist.</p></section>}</div></main>
}
