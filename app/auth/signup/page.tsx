'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const supabase = createClient(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState(''); const [message,setMessage]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false)
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});if(error)setError(error.message);else if(data.session)window.location.href='/admin';else setMessage('Account created. Check your email to confirm your account, then sign in.');setBusy(false)}
  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}><Link href="/" className="muted">← Read-a-Brief</Link><div className="eyebrow">CREATE ACCESS</div><h1>Create account</h1><p className="muted">Create your Read-a-Brief account.</p><label>Display name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name" /></label><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" /></label><label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" /></label>{error&&<div className="auth-error">{error}</div>}{message&&<div className="auth-success">{message}</div>}<button disabled={busy}>{busy?'Creating…':'Create account'}</button><div className="auth-links"><Link href="/auth/login">Already have an account? Sign in</Link></div></form></main>
}
