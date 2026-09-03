import { createClient } from '@/lib/supabase/server'
import { fetchFeed } from '@/lib/news/ingest'
import type { FeedSource, SourceType } from '@/lib/news/types'

export const runtime='nodejs'

export async function POST(request:Request){
  const supabase=await createClient()
  const{data:{user}}=await supabase.auth.getUser()
  if(!user)return Response.json({error:'Unauthorized'},{status:401})
  const{data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle()
  if(!profile||profile.is_active===false||!['admin','editor'].includes(profile.role))return Response.json({error:'Forbidden'},{status:403})
  try{
    const body=await request.json()
    if(typeof body.feedUrl!=='string'||!body.feedUrl.trim())return Response.json({error:'Feed URL is required'},{status:400})
    const stories=await fetchFeed({id:typeof body.id==='string'?body.id:'test',name:typeof body.name==='string'?body.name:'Test source',feedUrl:body.feedUrl.trim(),homepageUrl:typeof body.homepageUrl==='string'?body.homepageUrl:null,category:typeof body.category==='string'?body.category:null,country:typeof body.country==='string'?body.country:null,sourceType:(body.sourceType||'rss') as SourceType,enabled:true})
    return Response.json({ok:true,count:stories.length,stories:stories.slice(0,5).map(s=>({title:s.title,url:s.canonicalUrl,publishedAt:s.publishedAt}))})
  }catch(error){return Response.json({error:error instanceof Error?error.message:'Feed test failed'},{status:400})}
}
