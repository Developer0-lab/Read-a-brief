import Link from 'next/link'

export default function SourcesPage() {
  return (
    <main style={{maxWidth: 1100, margin: '0 auto', padding: 32, fontFamily: 'system-ui'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:16}}>
        <div>
          <Link href="/admin">← Admin</Link>
          <h1 style={{fontSize: 36, marginBottom: 8}}>Sources Manager</h1>
          <p style={{color:'#666'}}>Manage RSS, Atom and API sources used by Read-a-Brief automation.</p>
        </div>
      </div>
      <section style={{marginTop:28, padding:24, border:'1px solid #ddd', borderRadius:16}}>
        <h2>Add a source</h2>
        <p style={{color:'#666'}}>The dashboard UI is ready to be connected to Supabase source records and the feed test endpoint.</p>
        <div style={{display:'grid', gap:12, maxWidth:650}}>
          <input aria-label="Source name" placeholder="Source name" style={{padding:12, border:'1px solid #ccc', borderRadius:8}} />
          <input aria-label="Homepage URL" placeholder="Homepage URL" style={{padding:12, border:'1px solid #ccc', borderRadius:8}} />
          <input aria-label="Feed URL" placeholder="RSS or Atom feed URL" style={{padding:12, border:'1px solid #ccc', borderRadius:8}} />
          <div style={{display:'flex', gap:12}}>
            <select aria-label="Source type" style={{padding:12, border:'1px solid #ccc', borderRadius:8}} defaultValue="rss">
              <option value="rss">RSS</option><option value="atom">Atom</option><option value="api">API</option><option value="website">Website</option>
            </select>
            <input aria-label="Category" placeholder="Category" style={{padding:12, border:'1px solid #ccc', borderRadius:8, flex:1}} />
            <input aria-label="Country" placeholder="Country" style={{padding:12, border:'1px solid #ccc', borderRadius:8, flex:1}} />
          </div>
          <button type="button" style={{padding:12, border:0, borderRadius:8, cursor:'pointer'}}>Save source</button>
        </div>
      </section>
      <section style={{marginTop:20, padding:24, border:'1px solid #ddd', borderRadius:16}}>
        <h2>Configured sources</h2>
        <p style={{color:'#666'}}>No sources are configured yet. Add your first approved feed to start ingestion.</p>
      </section>
    </main>
  )
}
