'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Story = { id: string; title: string; category: string | null; country: string | null; status: string; created_at: string; canonical_url: string }

export default function BulkStoryActions({ stories }: { stories: Story[] }) {
  const router = useRouter(); const [selected, setSelected] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  const all = stories.length > 0 && selected.length === stories.length
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  async function approveSelected() {
    if (!selected.length) return
    setBusy(true); setMessage('Approving selected stories and creating drafts…')
    try {
      const r = await fetch('/api/admin/briefs/bulk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ storyIds: selected }) })
      const data = await r.json()
      setMessage(r.ok ? `${data.created} draft${data.created === 1 ? '' : 's'} created${data.existing ? ` · ${data.existing} already existed` : ''}.` : (data.error || 'Bulk approval failed.'))
      if (r.ok) { setSelected([]); router.refresh() }
    } catch { setMessage('Network error. Please try again.') }
    setBusy(false)
  }
  return <section className="table-card">
    <div className="bulk-toolbar">
      <label className="bulk-select"><input type="checkbox" checked={all} onChange={() => setSelected(all ? [] : stories.map(s => s.id))} /> Select all</label>
      <span className="bulk-count">{selected.length} selected</span>
      <button disabled={!selected.length || busy} onClick={approveSelected}>✓ Approve & create drafts</button>
      {selected.length > 0 && <button className="button-secondary" disabled={busy} onClick={() => setSelected([])}>Clear</button>}
    </div>
    {message && <p className="muted bulk-message">{message}</p>}
    <div className="story-table-head"><span>Story</span><span>Status</span><span>Source</span></div>
    {stories.map(story => <div className={`story-row ${selected.includes(story.id) ? 'is-selected' : ''}`} key={story.id}>
      <label className="story-check"><input aria-label={`Select ${story.title}`} type="checkbox" checked={selected.includes(story.id)} onChange={() => toggle(story.id)} /></label>
      <div><Link href={`/admin/inbox/${story.id}`}><strong>{story.title}</strong></Link><small>{story.category || story.country || 'Uncategorized'} · {new Date(story.created_at).toLocaleString()}</small></div>
      <span className={`status status-${story.status}`}>{story.status}</span>
      <a href={story.canonical_url} target="_blank" rel="noreferrer">Original ↗</a>
    </div>)}
  </section>
}
