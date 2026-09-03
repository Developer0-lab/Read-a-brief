import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPER_ADMIN_EMAIL = 'thieryhenry436@gmail.com'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return response
  const supabase = createServerClient(url, key, { cookies: { getAll:()=>request.cookies.getAll(), setAll:(items)=>items.forEach(({name,value,options})=>{request.cookies.set(name,value);response.cookies.set(name,value,options)}) } })
  const { data:{user} } = await supabase.auth.getUser()
  const pathname=request.nextUrl.pathname; const isAuth=pathname.startsWith('/auth'); const isAdmin=pathname.startsWith('/admin')
  if(!user&&isAdmin){const u=new URL('/auth/login',request.url);u.searchParams.set('next',pathname);return NextResponse.redirect(u)}
  if(user&&isAdmin){const isSuperAdmin=user.email?.toLowerCase()===SUPER_ADMIN_EMAIL;if(!isSuperAdmin)return NextResponse.redirect(new URL('/admin/unauthorized',request.url))}
  if(user&&isAuth&&!pathname.startsWith('/auth/callback'))return NextResponse.redirect(new URL('/admin',request.url))
  return response
}
export const config={matcher:['/admin/:path*','/auth/:path*']}
