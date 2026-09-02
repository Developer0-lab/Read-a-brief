import Link from 'next/link'

export default function UnauthorizedPage(){return <main className="auth-shell"><section className="auth-card"><div className="eyebrow">ACCESS DENIED</div><h1>Manager access required</h1><p className="muted">Your account is signed in, but it does not have the editor or admin role needed for the operations center.</p><Link href="/" className="button-link">Return to public site</Link></section></main>}
