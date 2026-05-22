import React, { useEffect, useState } from 'react';

const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || process.env.REACT_APP_API_BASE || 'http://localhost:3801/api';

export default function PathologyReportPDF() {
  const [slides, setSlides] = useState([]);
  const [slideId, setSlideId] = useState('');
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/slides?limit=50`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => {
        const list = d.data || [];
        setSlides(list);
        if (list[0]) setSlideId(String(list[0].id));
      })
      .catch(e => setErr(e.message));
  }, []);

  const fetchReport = async () => {
    if (!slideId) return;
    setBusy(true); setErr(null); setReport(null);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API_BASE}/custom-views/report-pdf/${slideId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      setReport(j);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const downloadPdf = () => {
    if (!slideId) return;
    const token = localStorage.getItem('token');
    // Use a fetch+blob workflow so the Authorization header is sent.
    fetch(`${API_BASE}/custom-views/report-pdf/${slideId}?format=pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `report-slide-${slideId}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(e => setErr(e.message));
  };

  return (
    <div data-testid="pathology-report-pdf" style={{ background: '#1a1b2e', border: '1px solid #2d2e3f', borderRadius: 12, padding: 20 }}>
      <h3 style={{ color: '#fff', margin: 0, marginBottom: 12, fontSize: 16 }}>Pathology Report PDF</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select
          value={slideId}
          onChange={e => setSlideId(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', background: '#0f1117', border: '1px solid #2d2e3f', color: '#e4e4e7', borderRadius: 8, fontSize: 13 }}
        >
          {slides.map(s => (
            <option key={s.id} value={s.id}>{s.slide_id || `Slide #${s.id}`} — {s.organ || 'n/a'}</option>
          ))}
        </select>
        <button onClick={fetchReport} disabled={!slideId || busy} className="btn btn-primary btn-sm">
          {busy ? 'Generating…' : 'Preview report'}
        </button>
        <button onClick={downloadPdf} disabled={!slideId} className="btn btn-secondary btn-sm">Download PDF</button>
      </div>
      {err && <div style={{ color: '#dc2626', marginBottom: 8, fontSize: 13 }}>Error: {err}</div>}
      {report && (
        <pre
          data-testid="report-text"
          style={{
            background: '#0f1117', color: '#e4e4e7', padding: 16, borderRadius: 8,
            border: '1px solid #2d2e3f', fontSize: 12, lineHeight: 1.5, maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap',
          }}
        >
          {report.report_text}
        </pre>
      )}
    </div>
  );
}
