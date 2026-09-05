import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

const navigation = [
  ['Dashboard', '/admin'],
  ['Story Inbox', '/admin/inbox'],
  ['Briefings', '/admin/briefs'],
  ['Sources', '/admin/sources'],
  ['Automation', '/admin/automation'],
  ['Analytics', '/admin/analytics'],
  ['Users & Roles', '/admin/users'],
]

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Link href="/admin" className="admin-brand">READ-A-BRIEF</Link>
          <span>OPERATIONS</span>
        </div>
        <nav className="admin-side-nav" aria-label="Admin navigation">
          <div className="admin-nav-label">Workspace</div>
          {navigation.map(([label, href]) => (
            <Link key={href} href={href} className="admin-nav-link">
              <span className="admin-nav-dot" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-user">
            <span className="admin-status-dot" aria-hidden="true" />
            <span className="admin-user-email">{user?.email ?? 'Signed in'}</span>
          </div>
          <Link href="/" className="admin-utility-link">Public site ↗</Link>
          <SignOutButton />
        </div>
      </aside>

      <div className="admin-mobile-bar">
        <Link href="/admin" className="admin-brand">READ-A-BRIEF</Link>
        <details>
          <summary>Menu</summary>
          <nav className="admin-mobile-nav" aria-label="Admin navigation">
            {navigation.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
            <Link href="/">Public site ↗</Link>
            <SignOutButton />
          </nav>
        </details>
      </div>

      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <div className="admin-topbar-kicker">READ-A-BRIEF / OPERATIONS</div>
            <div className="admin-topbar-title">Editorial control center</div>
          </div>
          <div className="admin-system-status"><span className="admin-status-dot" /> System operational</div>
        </div>
        {children}
      </div>
    </div>
  )
}
