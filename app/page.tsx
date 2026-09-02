const briefs = [
  { category: "World", title: "A clearer way to follow the stories shaping today", summary: "Read-a-Brief turns important developments into concise, context-rich briefings so readers can understand what happened and why it matters." },
  { category: "Technology", title: "The technology stories worth knowing today", summary: "A focused briefing on major technology developments, written for quick understanding rather than endless scrolling." },
  { category: "Africa", title: "Africa in focus", summary: "Follow important developments across African countries with short summaries, context and source attribution." },
];

export default function Home() {
  return (
    <main className="site">
      <header className="header">
        <div className="header-inner">
          <div className="brand">READ-A-BRIEF <span>/ NEWS INTELLIGENCE</span></div>
          <nav className="nav"><a href="#latest">Latest</a><a href="#categories">Categories</a><a href="/admin">Operations</a></nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">The world. In a few minutes.</div>
          <h1>Know what happened. Understand why it matters.</h1>
          <p>Read-a-Brief is an automated news briefing platform designed to turn fast-moving stories into clear, original, source-attributed briefings.</p>
        </div>
      </section>

      <div className="content">
        <div id="categories" className="toolbar">
          {['Top Stories', 'Uganda', 'Africa', 'World', 'Technology', 'AI', 'Business', 'Science', 'Sports'].map((item, i) => (
            <button className={`chip ${i === 0 ? 'active' : ''}`} key={item}>{item}</button>
          ))}
        </div>

        <div id="latest" className="section-head">
          <h2>Latest briefs</h2>
          <span className="muted">Automated publishing engine · Coming online</span>
        </div>

        <section className="grid">
          {briefs.map((brief) => (
            <article className="card" key={brief.title}>
              <div className="tag">{brief.category}</div>
              <h3>{brief.title}</h3>
              <p>{brief.summary}</p>
              <footer><span>Read-a-Brief</span><span>Briefing</span></footer>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
