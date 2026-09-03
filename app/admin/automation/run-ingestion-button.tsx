'use client'

import { useState } from 'react'

export default function RunIngestionButton(){const[busy,setBusy]=useState(false);const[result,setResult]=useState('');async function run(){setBusy(true);setResult('Running ingestion…');try{const r=await fetch('/api/admin/automation/ingest',{method:'POST'});const d=await r.json();setResult(r.ok?`Complete — ${d.storiesDiscovered??0} discovered, ${d.storiesProcessed??0} processed.`:d.error||'Ingestion failed.')}catch{setResult('Ingestion failed.')}finally{setBusy(false)}}return <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><button onClick={run} disabled={busy}>{busy?'Running…':'Run ingestion now'}</button>{result&&<span className="muted">{result}</span>}</div>}
