import React, { useEffect, useState, useCallback } from 'react';

const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || process.env.REACT_APP_API_BASE || 'http://localhost:3801/api';
const BASE = `${API_BASE}/custom-views/diagnostic-rules`;

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

function authHeaders() {
  const t = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

export default function DiagnosticRulesEditor() {
  const [grouped, setGrouped] = useState({});
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [draft, setDraft] = useState({ tissue_type: '', criterion: '', threshold: '', severity: 'medium', notes: '' });
  const [editId, setEditId] = useState(null);

  const load = useCallback(() => {
    setBusy(true); setErr(null);
    const url = filter ? `${BASE}?tissue=${encodeURIComponent(filter)}` : BASE;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setGrouped(d.grouped || {}); setBusy(false); })
      .catch(e => { setErr(e.message); setBusy(false); });
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!draft.tissue_type || !draft.criterion) { setErr('tissue_type and criterion required'); return; }
    setBusy(true); setErr(null);
    try {
      const url = editId ? `${BASE}/${editId}` : BASE;
      const method = editId ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(draft) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setDraft({ tissue_type: '', criterion: '', threshold: '', severity: 'medium', notes: '' });
      setEditId(null);
      load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const edit = (rule) => {
    setEditId(rule.id);
    setDraft({
      tissue_type: rule.tissue_type || '',
      criterion: rule.criterion || '',
      threshold: rule.threshold || '',
      severity: rule.severity || 'medium',
      notes: rule.notes || '',
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    setBusy(true);
    try {
      const r = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const sevColor = (s) => ({
    low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626',
  }[s] || '#71717a');

  return (
    <div data-testid="diagnostic-rules-editor" style={{ background: '#1a1b2e', border: '1px solid #2d2e3f', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 16 }}>Diagnostic Criteria Rules (per tissue type)</h3>
        <input
          placeholder="filter by tissue…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '6px 10px', background: '#0f1117', border: '1px solid #2d2e3f', color: '#e4e4e7', borderRadius: 6, fontSize: 12, width: 160 }}
        />
      </div>

      {err && <div style={{ color: '#dc2626', marginBottom: 8, fontSize: 13 }}>Error: {err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 14 }}>
        <input placeholder="tissue type" value={draft.tissue_type} onChange={e => setDraft({ ...draft, tissue_type: e.target.value })} style={inp} />
        <input placeholder="criterion" value={draft.criterion} onChange={e => setDraft({ ...draft, criterion: e.target.value })} style={inp} />
        <input placeholder="threshold" value={draft.threshold} onChange={e => setDraft({ ...draft, threshold: e.target.value })} style={inp} />
        <select value={draft.severity} onChange={e => setDraft({ ...draft, severity: e.target.value })} style={inp}>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={save} disabled={busy} className="btn btn-primary btn-sm">{editId ? 'Update' : 'Add rule'}</button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ color: '#a1a1aa', fontSize: 13 }}>No rules yet.</div>
      ) : (
        Object.entries(grouped).map(([tissue, rules]) => (
          <div key={tissue} style={{ marginBottom: 14 }}>
            <h4 style={{ color: '#6366f1', margin: 0, marginBottom: 6, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>{tissue}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rules.map(r => (
                <div key={r.id} data-testid={`rule-${r.id}`} style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr auto auto auto',
                  alignItems: 'center', gap: 8,
                  background: '#0f1117', border: '1px solid #2d2e3f', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#e4e4e7',
                }}>
                  <span><strong>{r.criterion}</strong>{r.notes ? <span style={{ color: '#71717a' }}> — {r.notes}</span> : null}</span>
                  <span style={{ color: '#a1a1aa' }}>{r.threshold || '—'}</span>
                  <span style={{ background: sevColor(r.severity), color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10, textTransform: 'uppercase' }}>{r.severity}</span>
                  <button onClick={() => edit(r)} className="btn btn-secondary btn-sm">Edit</button>
                  <button onClick={() => remove(r.id)} className="btn btn-danger btn-sm">Del</button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const inp = {
  padding: '8px 10px', background: '#0f1117', border: '1px solid #2d2e3f',
  color: '#e4e4e7', borderRadius: 6, fontSize: 12, fontFamily: 'inherit',
};
