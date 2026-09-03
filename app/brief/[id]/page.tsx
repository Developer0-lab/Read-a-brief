import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Brief = {
  id: string
  headline: string
  dek: string | null
  summary: string | null
  body: string | null
  why_it_matters: string | null
  what_happens_next: string | null
  category: string | null
  country: string | null
  language: string | null
  published_at: string | null
  created_at: string
}

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: brief } = await supabase
    .from('briefs')
    .select('id, headline, dek, summary, body, why_it_matters, what_happens_next, category, country, language, published_at, created_at')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle<Brief>()

  if (!brief) notFound()

  return (
    <main className="site">
      <header className="header"><div className="header-inner"><Link className="brand" href="/">READ-A-BRIEF <span>/ BRIEFING</span></Link><nav className="nav"><Link href="/">← All briefings</Link><Link href="/auth/login">Sign in</Link></nav></div></header>
      <article className="article-shell">
        <div className="article-meta"><span className="tag">{brief.category || brief.country || 'News'}</span><span>{brief.published_at ? new Date(brief.published_at).toLocaleDateString() : 'Published'}</span></div>
        <h1>{brief.headline}</h1>
        {brief.dek && <p className="article-dek">{brief.dek}</p>}
        {brief.summary && <section className="article-lead"><strong>THE BRIEF</strong><p>{brief.summary}</p></section>}
        {brief.body && <div className="article-body">{brief.body.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>}
        {(brief.why_it_matters || brief.what_happens_next) && <div className="article-grid">{brief.why_it_matters && <section className="article-note"><span>WHY IT MATTERS</span><p>{brief.why_it_matters}</p></section>}{brief.what_happens_next && <section className="article-note"><span>WHAT HAPPENS NEXT</span><p>{brief.what_happens_next}</p></section>}</div>}
        <footer className="article-footer"><span>{brief.country || 'Global'} · {brief.language || 'English'}</span><Link href="/">More briefings →</Link></footer>
      </article>
    </main>
  )
}
