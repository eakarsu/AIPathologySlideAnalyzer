import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [toast, setToast] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    api.getSettings().then(data => {
      setSettings(data);
      const vals = {};
      data.forEach(s => { vals[s.id] = s.value; });
      setEditValues(vals);
    });
  }, []);

  const handleSave = async (id) => {
    try {
      await api.updateSetting(id, editValues[id]);
      setToast({ msg: 'Setting updated', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ msg: e.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const categories = [...new Set(settings.map(s => s.category))];

  return (
    <div>
      <div className="page-header">
        <h1>{'\u{1F527}'} Settings</h1>
      </div>
      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#818cf8', marginBottom: 12 }}>{cat}</h3>
          <div className="settings-grid">
            {settings.filter(s => s.category === cat).map(s => (
              <div key={s.id} className="setting-row">
                <div className="setting-info">
                  <div className="setting-key">{s.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                  <div className="setting-desc">{s.description}</div>
                  <span className="setting-category">{s.category}</span>
                </div>
                <div className="setting-value" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {s.value === 'true' || s.value === 'false' ? (
                    <select
                      value={editValues[s.id] || s.value}
                      onChange={e => setEditValues({ ...editValues, [s.id]: e.target.value })}
                      style={{ background: '#0f1117', border: '1px solid #2d2e3f', borderRadius: 6, color: '#e4e4e7', padding: '6px 12px', fontSize: 13 }}
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <input
                      value={editValues[s.id] || ''}
                      onChange={e => setEditValues({ ...editValues, [s.id]: e.target.value })}
                    />
                  )}
                  <button className="btn btn-primary btn-sm" onClick={() => handleSave(s.id)}>Save</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
