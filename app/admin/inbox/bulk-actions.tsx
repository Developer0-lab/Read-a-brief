'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BulkStoryActions({ stories }: { stories: { id: string; status: string }[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id])
  const all = stories.length > 0 && selected.length === stories.length

  async function approveSelected() {
    if (!selected.length) return
    setBusy(true); setMessage('Approving selected stories and creating drafts…')
    const r = await fetch('/api/admin/briefs/bulk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ storyIds: selected }) })
    const data = await r.json()
    setMessage(r.ok ? `${data.created} draft${data.created === 1 ? '' : 's'} created${data.existing ? ` · ${data.existing} already existed` : ''}.` : (data.error || 'Bulk approval failed.'))
    setBusy(false); setSelected([]); router.refresh()
  }

  return <>
    <div className="bulk-toolbar">
      <label className="bulk-select"><input type="checkbox" checked={all} onChange={() => setSelected(all ? [] : stories.map(s => s.id))} /> Select all</label>
      <span className="bulk-count">{selected.length} selected</span>
      <button disabled={!selected.length || busy} onClick={approveSelected}>✓ Approve & create drafts</button>
      {selected.length > 0 && <button className="button-secondary" disabled={busy} onClick={() => setSelected([])}>Clear</button>}
    </div>
    {message && <p className="muted bulk-message">{message}</p>}
    <div className="bulk-story-list">
      {stories.map(story => <label className={`bulk-check-row ${selected.includes(story.id) ? 'is-selected' : ''}`} key={story.id}>
        <input type="checkbox" checked={selected.includes(story.id)} onChange={() => toggle(story.id)} />
      </label>)}
    </div>
  </>
}
