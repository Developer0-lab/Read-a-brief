import Link from 'next/link'

export default function UnauthorizedPage(){return <main className="auth-shell"><section className="auth-card"><div className="eyebrow">ACCESS DENIED</div><h1>Super Admin access required</h1><p className="muted">This operations center is restricted to the designated Super Admin account.</p><Link href="/auth/login" className="button-link">Sign in as Super Admin →</Link><Link href="/" className="muted">Return to public site</Link></section></main>}
