import { createClient } from '@/lib/supabase/server'
import { GET as runIngestion } from '@/app/api/automation/ingest/route'

export const runtime='nodejs'
export const dynamic='force-dynamic'

export async function POST(){
 const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return Response.json({error:'Unauthorized'},{status:401})
 const{data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle()
 if(!profile?.is_active||!['admin','editor'].includes(profile.role))return Response.json({error:'Forbidden'},{status:403})
 const secret=process.env.AUTOMATION_CRON_SECRET;if(!secret)return Response.json({error:'Automation secret is not configured'},{status:500})
 return runIngestion(new Request('http://internal/api/automation/ingest',{headers:{authorization:`Bearer ${secret}`}}))
}
