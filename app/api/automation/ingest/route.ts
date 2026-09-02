import { createClient } from "@supabase/supabase-js";
import { fetchFeed } from "@/lib/news/ingest";
import type { FeedSource, SourceType } from "@/lib/news/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials are not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: Request) {
  const expected = process.env.AUTOMATION_CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = db();
  const { data: run, error: runError } = await supabase.from("automation_runs").insert({ job_type: "feed_ingestion", status: "running" }).select("id").single();
  if (runError) return Response.json({ error: runError.message }, { status: 500 });
  const { data: sources, error: sourceError } = await supabase.from("sources").select("id,name,feed_url,homepage_url,source_type,category,country,enabled").eq("enabled", true);
  if (sourceError) { await supabase.from("automation_runs").update({ status:"failed", finished_at:new Date().toISOString(), error_message:sourceError.message }).eq("id",run.id); return Response.json({error:sourceError.message},{status:500}); }
  let storiesDiscovered=0, storiesProcessed=0, errors=0; const results=[];
  for(const source of (sources??[])){
    const feedSource: FeedSource = {
      id: source.id,
      name: source.name,
      feedUrl: source.feed_url,
      homepageUrl: source.homepage_url,
      sourceType: source.source_type as SourceType,
      category: source.category,
      country: source.country,
      enabled: source.enabled,
    };
    try{const stories=await fetchFeed(feedSource);storiesDiscovered+=stories.length;let processed=0;for(const story of stories){const{error}=await supabase.from("stories").upsert({source_id:story.sourceId,external_id:story.externalId,canonical_url:story.canonicalUrl,title:story.title,description:story.description,published_at:story.publishedAt,content_hash:story.contentHash,category:story.category,country:story.country,metadata:story.metadata,status:"discovered"},{onConflict:"source_id,canonical_url"});if(error)throw error;processed++;}storiesProcessed+=processed;await supabase.from("sources").update({last_checked_at:new Date().toISOString(),last_success_at:new Date().toISOString(),last_error:null}).eq("id",source.id);results.push({source:source.name,fetched:stories.length,processed});}catch(error){errors++;const message=error instanceof Error?error.message:"Unknown feed error";await supabase.from("sources").update({last_checked_at:new Date().toISOString(),last_error:message}).eq("id",source.id);results.push({source:source.name,error:message});}}
  await supabase.from("automation_runs").update({status:errors&&!storiesProcessed?"failed":"completed",finished_at:new Date().toISOString(),sources_checked:sources?.length??0,stories_discovered:storiesDiscovered,stories_processed:storiesProcessed,metadata:{results}}).eq("id",run.id);
  return Response.json({ok:true,sourcesChecked:sources?.length??0,storiesDiscovered,storiesProcessed,errors,results});
}
