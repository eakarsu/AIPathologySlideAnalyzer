// Apply pass 5 — Extensions UI (DICOM, LIS, WSI, MDC, second-opinion, registry, compliance).
import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
function authH() {
  const t = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}
async function api(p, opts = {}) {
  const r = await fetch(`${API}${p}`, { ...opts, headers: authH() });
  let body; try { body = await r.json(); } catch { body = {}; }
  return { ok: r.ok, status: r.status, body };
}
const Pre = ({ data }) => data == null ? null : (
  <pre style={{ background: '#0f172a', color: '#cbd5e1', padding: 10, borderRadius: 6, overflow: 'auto', maxHeight: 300 }}>
    {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
  </pre>
);

export default function Extensions() {
  const [tab, setTab] = useState('dicom');
  const tabs = [
    ['dicom', 'DICOM'],
    ['lis', 'LIS'],
    ['wsi', 'WSI Viewer'],
    ['mdc', 'MDT Conferences'],
    ['so', 'Second-Opinion'],
    ['reg', 'Cancer Registry'],
    ['comp', 'Compliance'],
  ];
  return (
    <div style={{ padding: 24 }}>
      <h2>Extensions <small style={{ color: '#94a3b8', fontWeight: 400 }}>(pass 5 backlog)</small></h2>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1',
            background: tab === id ? '#1e40af' : '#f8fafc',
            color: tab === id ? 'white' : 'inherit', cursor: 'pointer'
          }}>{label}</button>
        ))}
      </div>
      {tab === 'dicom' && <Dicom />}
      {tab === 'lis' && <Lis />}
      {tab === 'wsi' && <Wsi />}
      {tab === 'mdc' && <Mdc />}
      {tab === 'so' && <SO />}
      {tab === 'reg' && <Reg />}
      {tab === 'comp' && <Comp />}
    </div>
  );
}

function Dicom() {
  const [s, setS] = useState(null);
  const [list, setList] = useState([]);
  const [r, setR] = useState(null);
  async function load() { setS((await api('/ext/dicom/status')).body); setList((await api('/ext/dicom/studies')).body || []); }
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h3>DICOM Server Integration</h3>
      <button onClick={async () => setR((await api('/ext/dicom/import', { method: 'POST', body: JSON.stringify({ slide_id: 1, study_uid: '1.2.840.' + Date.now(), modality: 'SM', patient_ref: 'P-001' }) })).body)}>Import test study</button>
      <Pre data={s} /><Pre data={r} /><Pre data={list} />
    </div>
  );
}
function Lis() {
  const [s, setS] = useState(null);
  const [list, setList] = useState([]);
  const [r, setR] = useState(null);
  async function load() { setS((await api('/ext/lis/status')).body); setList((await api('/ext/lis/orders')).body || []); }
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h3>LIS Integration</h3>
      <button onClick={async () => setR((await api('/ext/lis/order-inbound', { method: 'POST', body: JSON.stringify({ external_order_id: 'LIS-' + Date.now(), patient_ref: 'P-001', test_code: 'HISTO', payload: {} }) })).body)}>Receive test order</button>
      <Pre data={s} /><Pre data={r} /><Pre data={list} />
    </div>
  );
}
function Wsi() {
  const [slideId, setSlideId] = useState('1');
  const [m, setM] = useState(null);
  const [r, setR] = useState(null);
  return (
    <div>
      <h3>WSI Viewer Manifest</h3>
      <input value={slideId} onChange={e => setSlideId(e.target.value)} placeholder="slide id" />{' '}
      <button onClick={async () => setR((await api('/ext/wsi/manifest', { method: 'POST', body: JSON.stringify({ slide_id: Number(slideId), tile_size: 256, max_level: 14 }) })).body)}>Create manifest</button>{' '}
      <button onClick={async () => setM((await api(`/ext/wsi/manifest/${slideId}`)).body)}>Fetch manifest</button>
      <Pre data={r} /><Pre data={m} />
    </div>
  );
}
function Mdc() {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('Lung MDT');
  async function load() { setList((await api('/ext/mdc/conferences')).body || []); }
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h3>Multi-Disciplinary Team Conferences</h3>
      <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
      <button onClick={async () => { await api('/ext/mdc/conferences', { method: 'POST', body: JSON.stringify({ case_id: 1, title, participants: [{ name: 'Dr A', email: 'a@h.x', specialty: 'pathology' }, { name: 'Dr B', email: 'b@h.x', specialty: 'oncology' }] }) }); load(); }}>Schedule</button>
      <Pre data={list} />
    </div>
  );
}
function SO() {
  const [slideId, setSlideId] = useState('1');
  const [r, setR] = useState(null);
  return (
    <div>
      <h3>Second-Opinion Ensemble</h3>
      <input value={slideId} onChange={e => setSlideId(e.target.value)} />{' '}
      <button onClick={async () => setR((await api(`/ext/ai/second-opinion/${slideId}`, { method: 'POST', body: '{}' })).body)}>Run ensemble</button>
      <Pre data={r} />
    </div>
  );
}
function Reg() {
  const [list, setList] = useState([]);
  const [r, setR] = useState(null);
  async function load() { setList((await api('/ext/registry/submissions')).body || []); }
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h3>Cancer Registry Submission</h3>
      <button onClick={async () => { setR((await api('/ext/registry/submit', { method: 'POST', body: JSON.stringify({ case_id: 1, registry_name: 'NCDB', payload: {} }) })).body); load(); }}>Submit test</button>
      <Pre data={r} /><Pre data={list} />
    </div>
  );
}
function Comp() {
  const [list, setList] = useState([]);
  async function load() { setList((await api('/ext/compliance/events')).body || []); }
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h3>Compliance Audit Trail</h3>
      <button onClick={async () => { await api('/ext/compliance/event', { method: 'POST', body: JSON.stringify({ event_type: 'phi_access', entity_type: 'slide', entity_id: 1, details: { reason: 'review' } }) }); load(); }}>Log PHI access (sample)</button>
      <Pre data={list} />
    </div>
  );
}
