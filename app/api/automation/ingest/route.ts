import { createClient } from "@supabase/supabase-js";
import { fetchFeed } from "@/lib/news/ingest";
import type { FeedSource } from "@/lib/news/types";

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
  if (expected && request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = db();
  const started = new Date().toISOString();
  const { data: run, error: runError } = await supabase
    .from("automation_runs")
    .insert({ job_type: "feed_ingestion", status: "running", started_at: started })
    .select("id")
    .single();

  if (runError) return Response.json({ error: runError.message }, { status: 500 });

  const { data: sources, error: sourceError } = await supabase
    .from("sources")
    .select("id,name,url,feed_url,source_type,category,country,enabled")
    .eq("enabled", true);

  if (sourceError) {
    await supabase.from("automation_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: sourceError.message }).eq("id", run.id);
    return Response.json({ error: sourceError.message }, { status: 500 });
  }

  const results = [];
  let inserted = 0;
  let duplicates = 0;
  let errors = 0;

  for (const source of (sources ?? []) as FeedSource[]) {
    try {
      const stories = await fetchFeed(source);
      let sourceInserted = 0;
      let sourceDuplicates = 0;
      for (const story of stories) {
        const { error } = await supabase.from("stories").upsert({
          source_id: story.sourceId,
          external_id: story.externalId,
          source_url: story.canonicalUrl,
          canonical_url: story.canonicalUrl,
          title: story.title,
          description: story.description,
          published_at: story.publishedAt,
          content_hash: story.contentHash,
          category: story.category,
          country: story.country,
          metadata: story.metadata,
          status: "new",
        }, { onConflict: "canonical_url" });
        if (error) {
          if (error.code === "23505") sourceDuplicates++;
          else throw error;
        } else sourceInserted++;
      }
      inserted += sourceInserted;
      duplicates += sourceDuplicates;
      results.push({ source: source.name, fetched: stories.length, inserted: sourceInserted, duplicates: sourceDuplicates });
      await supabase.from("sources").update({ last_checked_at: new Date().toISOString(), health: "healthy" }).eq("id", source.id);
    } catch (error) {
      errors++;
      const message = error instanceof Error ? error.message : "Unknown feed error";
      results.push({ source: source.name, error: message });
      await supabase.from("sources").update({ last_checked_at: new Date().toISOString(), health: "error" }).eq("id", source.id);
    }
  }

  await supabase.from("automation_runs").update({
    status: errors && !inserted ? "failed" : "completed",
    finished_at: new Date().toISOString(),
    items_found: inserted,
    items_processed: inserted,
    error_message: errors ? `${errors} source(s) failed` : null,
    metadata: { duplicates, results },
  }).eq("id", run.id);

  return Response.json({ ok: true, inserted, duplicates, errors, results });
}
