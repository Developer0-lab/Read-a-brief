'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else window.location.href = new URLSearchParams(window.location.search).get('next') || '/admin'
    setBusy(false)
  }

  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}>
    <Link href="/" className="muted">← Read-a-Brief</Link><div className="eyebrow">OPERATIONS ACCESS</div><h1>Sign in</h1><p className="muted">Access the briefing operations center.</p>
    <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" /></label>
    <label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" /></label>
    {error && <div className="auth-error">{error}</div>}
    <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    <div className="auth-links"><Link href="/auth/forgot-password">Forgot password?</Link><Link href="/auth/signup">Create account</Link></div>
  </form></main>
}
