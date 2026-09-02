export default function AdminPage() {
  const stats = [
    ["Sources", "0", "RSS feeds and approved news APIs."],
    ["Stories detected", "0", "New stories waiting for processing."],
    ["Briefs published", "0", "Generated and published briefs."],
  ];

  return (
    <main className="site">
      <header className="header">
        <div className="header-inner">
          <div className="brand">READ-A-BRIEF <span>/ OPERATIONS</span></div>
          <a href="/">← Public site</a>
        </div>
      </header>
      <div className="content" style={{ marginTop: 0, paddingTop: 42 }}>
        <div className="section-head">
          <div><div className="eyebrow">Operations center</div><h2>Control the briefing engine</h2></div>
          <span className="muted">Data services will be connected next.</span>
        </div>
        <section className="grid">
          {stats.map(([title, value, description]) => (
            <article className="card" key={title}>
              <div className="tag">{title}</div>
              <h3>{value}</h3>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
