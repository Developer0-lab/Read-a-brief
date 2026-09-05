'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Brief = { id: string; headline: string; category: string | null; country: string | null; status: string; created_at: string; published_at: string | null }

export default function BulkBriefActions({ briefs }: { briefs: Brief[] }) {
  const router = useRouter(); const [selected, setSelected] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  const selectable = briefs.filter(b => ['review', 'approved'].includes(b.status)); const all = selectable.length > 0 && selected.length === selectable.length
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  async function publishSelected() {
    if (!selected.length) return
    if (!window.confirm(`Publish ${selected.length} briefing${selected.length === 1 ? '' : 's'} now?`)) return
    setBusy(true); setMessage('Publishing selected briefings…')
    try {
      const r = await fetch('/api/admin/briefs/bulk-publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ briefIds: selected }) })
      const data = await r.json()
      setMessage(r.ok ? `${data.published} briefing${data.published === 1 ? '' : 's'} published${data.skipped ? ` · ${data.skipped} skipped` : ''}.` : (data.error || 'Bulk publish failed.'))
      if (r.ok) { setSelected([]); router.refresh() }
    } catch { setMessage('Network error. Please try again.') }
    setBusy(false)
  }
  return <section className="table-card">
    <div className="bulk-toolbar">
      <label className="bulk-select"><input type="checkbox" checked={all} onChange={() => setSelected(all ? [] : selectable.map(b => b.id))} /> Select publishable</label>
      <span className="bulk-count">{selected.length} selected</span>
      <button disabled={!selected.length || busy} onClick={publishSelected}>Publish selected</button>
      {selected.length > 0 && <button className="button-secondary" disabled={busy} onClick={() => setSelected([])}>Clear</button>}
    </div>
    {message && <p className="muted bulk-message">{message}</p>}
    <div className="story-table-head"><span>Brief</span><span>Status</span><span>Published</span></div>
    {briefs.map(b => <div className={`story-row ${selected.includes(b.id) ? 'is-selected' : ''}`} key={b.id}>
      <label className="story-check"><input aria-label={`Select ${b.headline}`} type="checkbox" disabled={!['review','approved'].includes(b.status)} checked={selected.includes(b.id)} onChange={() => toggle(b.id)} /></label>
      <div><Link href={`/admin/briefs/${b.id}`}><strong>{b.headline}</strong></Link><small>{b.category || b.country || 'Uncategorized'} · {new Date(b.created_at).toLocaleString()}</small></div>
      <span className={`status status-${b.status}`}>{b.status}</span>
      <span>{b.published_at ? new Date(b.published_at).toLocaleDateString() : '—'}</span>
    </div>)}
  </section>
}
