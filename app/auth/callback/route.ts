import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/admin'
  if (!code) return NextResponse.redirect(new URL('/auth/login?error=missing_code', request.url))
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll:()=>cookieStore.getAll(), setAll:(items)=>items.forEach(({name,value,options})=>cookieStore.set(name,value,options)) } })
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', request.url))
  return NextResponse.redirect(new URL(next, request.url))
}
