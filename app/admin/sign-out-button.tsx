'use client'
import { createClient } from '@/lib/supabase/client'
export default function SignOutButton(){const supabase=createClient();return <button type="button" onClick={async()=>{await supabase.auth.signOut();window.location.href='/'}} style={{background:'transparent',padding:0}}>Sign out</button>}
