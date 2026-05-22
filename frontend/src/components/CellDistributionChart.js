import React, { useEffect, useState } from 'react';

const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || process.env.REACT_APP_API_BASE || 'http://localhost:3801/api';

export default function CellDistributionChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/custom-views/cell-distribution`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return <div data-testid="cell-dist-loading" style={{ color: '#a1a1aa' }}>Loading cell distribution…</div>;
  if (err) return <div style={{ color: '#dc2626' }}>Error: {err}</div>;
  if (!data || !data.labels || data.labels.length === 0) {
    return <div style={{ color: '#a1a1aa' }}>No cell classification data yet.</div>;
  }

  const max = Math.max(1, ...data.counts);
  const colours = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#a855f7', '#3b82f6', '#22c55e', '#eab308'];

  return (
    <div data-testid="cell-distribution-chart" style={{ background: '#1a1b2e', border: '1px solid #2d2e3f', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 16 }}>Cell Count Distribution</h3>
        <span style={{ color: '#71717a', fontSize: 12 }}>Total cells counted: {data.total.toLocaleString()}</span>
      </div>
      <svg viewBox="0 0 600 260" style={{ width: '100%', height: 260 }} data-testid="cell-dist-svg">
        <line x1="40" y1="220" x2="590" y2="220" stroke="#2d2e3f" />
        <line x1="40" y1="20"  x2="40"  y2="220" stroke="#2d2e3f" />
        {data.labels.map((label, i) => {
          const barW = Math.max(8, (550 / data.labels.length) - 8);
          const x = 50 + i * (550 / data.labels.length);
          const h = (data.counts[i] / max) * 190;
          const y = 220 - h;
          return (
            <g key={label}>
              <rect x={x} y={y} width={barW} height={h} fill={colours[i % colours.length]} rx="3" />
              <text x={x + barW / 2} y={y - 4} fill="#e4e4e7" fontSize="10" textAnchor="middle">{data.counts[i]}</text>
              <text x={x + barW / 2} y="240" fill="#a1a1aa" fontSize="10" textAnchor="middle" transform={`rotate(-20 ${x + barW / 2} 240)`}>{label.length > 12 ? label.slice(0, 12) + '…' : label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {data.labels.map((label, i) => (
          <span key={label} style={{ fontSize: 11, color: '#a1a1aa', padding: '4px 8px', background: '#0f1117', borderRadius: 6, border: '1px solid #2d2e3f' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, background: colours[i % colours.length], borderRadius: 2, marginRight: 6 }} />
            {label} — {data.percentages[i]}% avg
          </span>
        ))}
      </div>
    </div>
  );
}
