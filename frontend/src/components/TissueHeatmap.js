import React, { useEffect, useState } from 'react';

const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || process.env.REACT_APP_API_BASE || 'http://localhost:3801/api';

function intensityColour(v, max) {
  if (!v || !max) return '#0f1117';
  const ratio = Math.min(1, v / max);
  // dark indigo → bright violet → orange/red
  const r = Math.round(99 + (239 - 99) * ratio);
  const g = Math.round(102 + (68 - 102) * ratio);
  const b = Math.round(241 + (68 - 241) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function TissueHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/custom-views/tissue-heatmap`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <div style={{ color: '#a1a1aa' }}>Loading tissue heatmap…</div>;
  if (err) return <div style={{ color: '#dc2626' }}>Error: {err}</div>;
  if (!data || !data.tissues || data.tissues.length === 0) {
    return <div style={{ color: '#a1a1aa' }}>No tissue segmentation data yet.</div>;
  }

  let maxCount = 1;
  data.matrix.forEach(row => row.forEach(c => { if (c.count > maxCount) maxCount = c.count; }));

  return (
    <div data-testid="tissue-heatmap" style={{ background: '#1a1b2e', border: '1px solid #2d2e3f', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 16 }}>Tissue Region Heatmap</h3>
        <span style={{ color: '#71717a', fontSize: 12 }}>tissue class × health status</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 500, textAlign: 'left', padding: '6px 8px' }}></th>
              {data.statuses.map(s => (
                <th key={s} style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 500, padding: '6px 8px' }}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.tissues.map((t, i) => (
              <tr key={t}>
                <td style={{ color: '#e4e4e7', fontSize: 12, padding: '6px 8px', whiteSpace: 'nowrap' }}>{t}</td>
                {data.matrix[i].map((cell, j) => (
                  <td
                    key={`${t}-${data.statuses[j]}`}
                    title={`count=${cell.count}, area=${cell.area}%, density=${cell.density}`}
                    style={{
                      background: intensityColour(cell.count, maxCount),
                      color: cell.count / maxCount > 0.55 ? '#fff' : '#e4e4e7',
                      padding: '14px 18px',
                      borderRadius: 6,
                      textAlign: 'center',
                      fontSize: 12,
                      minWidth: 60,
                      fontWeight: cell.count > 0 ? 600 : 400,
                    }}
                  >
                    {cell.count}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#a1a1aa' }}>
        <span>low</span>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, rgb(99,102,241), rgb(239,68,68))' }} />
        <span>high</span>
      </div>
    </div>
  );
}
