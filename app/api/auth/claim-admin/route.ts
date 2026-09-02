import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST() {
  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return Response.json({ error: 'Server configuration is incomplete' }, { status: 500 })
  const admin = createAdminClient(url, serviceKey, { auth: { autoRefreshToken:false, persistSession:false } })
  const { count: profileCount } = await admin.from('profiles').select('*', { count:'exact', head:true })
  const { count: managerCount } = await admin.from('profiles').select('*', { count:'exact', head:true }).in('role',['admin','editor'])
  if (profileCount !== 1 || (managerCount ?? 0) !== 0) return Response.json({ error:'Initial admin claim is no longer available.' }, { status:409 })
  const { error } = await admin.from('profiles').update({ role:'admin' }).eq('id', user.id)
  if (error) return Response.json({ error:error.message }, { status:500 })
  return Response.json({ ok:true })
}
