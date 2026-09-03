import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const categories = ['Top Stories', 'Uganda', 'Africa', 'World', 'Technology', 'AI', 'Business', 'Science', 'Sports']

export default async function Home({ searchParams }: { searchParams?: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams
  const category = params?.category
  const query = params?.q?.trim()
  const supabase = await createClient()

  let request = supabase
    .from('briefs')
    .select('id, headline, dek, summary, category, country, published_at, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(24)

  if (category && category !== 'Top Stories') request = request.eq('category', category)
  if (query) request = request.or(`headline.ilike.%${query}%,summary.ilike.%${query}%`)

  const { data: briefs } = await request

  return (
    <main className="site">
      <header className="header">
        <div className="header-inner">
          <Link className="brand" href="/">READ-A-BRIEF <span>/ NEWS INTELLIGENCE</span></Link>
          <nav className="nav">
            <a href="#latest">Latest</a>
            <a href="#categories">Categories</a>
            <Link href="/auth/login">Sign in</Link>
            <Link href="/admin">Operations</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">THE WORLD. IN A FEW MINUTES.</div>
          <h1>Know what happened.<br /><em>Understand why it matters.</em></h1>
          <p>Original, source-attributed briefings that turn the day&apos;s important developments into clear context you can actually use.</p>
          <form className="search" action="/" method="get">
            <input name="q" defaultValue={query} placeholder="Search today&apos;s briefings…" aria-label="Search briefings" />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <div className="content">
        <div id="categories" className="toolbar">
          {categories.map((item) => (
            <Link className={`chip ${(!category && item === 'Top Stories') || category === item ? 'active' : ''}`} href={item === 'Top Stories' ? '/' : `/?category=${encodeURIComponent(item)}`} key={item}>{item}</Link>
          ))}
        </div>

        <div id="latest" className="section-head">
          <div>
            <div className="eyebrow">{query ? `SEARCH RESULTS FOR “${query}”` : category || 'LATEST'}</div>
            <h2>{briefs?.length ? 'Today’s briefings' : 'No published briefings yet'}</h2>
          </div>
          <span className="muted">Updated automatically</span>
        </div>

        {briefs && briefs.length > 0 ? (
          <section className="grid">
            {briefs.map((brief) => (
              <article className="card briefing-card" key={brief.id}>
                <div className="tag">{brief.category || brief.country || 'News'}</div>
                <h3><Link href={`/brief/${brief.id}`}>{brief.headline}</Link></h3>
                <p>{brief.dek || brief.summary || 'A concise Read-a-Brief briefing.'}</p>
                <footer><span>{brief.country || 'Global'}</span><span>{brief.published_at ? new Date(brief.published_at).toLocaleDateString() : 'New'}</span></footer>
              </article>
            ))}
          </section>
        ) : (
          <section className="empty-state">
            <div className="empty-mark">R</div>
            <h3>The briefing engine is coming online.</h3>
            <p>Once approved stories are published, they will appear here automatically. Operations can manage the source pipeline from the admin center.</p>
            <Link className="button-link" href="/admin">Open Operations →</Link>
          </section>
        )}
      </div>
    </main>
  )
}
