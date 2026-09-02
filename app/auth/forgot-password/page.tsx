'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage(){const supabase=createClient();const[email,setEmail]=useState('');const[message,setMessage]=useState('');const[error,setError]=useState('');const[busy,setBusy]=useState(false);async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth/reset-password`});if(error)setError(error.message);else setMessage('If that email exists, a password reset link has been sent.');setBusy(false)}return <main className="auth-shell"><form className="auth-card" onSubmit={submit}><Link href="/auth/login" className="muted">← Sign in</Link><div className="eyebrow">ACCOUNT RECOVERY</div><h1>Reset password</h1><p className="muted">We’ll send a secure reset link to your email.</p><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>{error&&<div className="auth-error">{error}</div>}{message&&<div className="auth-success">{message}</div>}<button disabled={busy}>{busy?'Sending…':'Send reset link'}</button></form></main>}
