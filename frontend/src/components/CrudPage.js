import React, { useState, useEffect } from 'react';

function formatAIResponse(text) {
  if (!text) return '';
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  return `<p>${html}</p>`;
}

function isLongText(val) {
  return typeof val === 'string' && val.length > 200;
}

export default function CrudPage({
  title, icon, apiGet, apiGetOne, apiCreate, apiUpdate, apiDelete,
  columns, formFields, detailFields, searchField,
  aiActions, aiFields,
  newItemDefaults,
}) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => apiGet().then(setItems).catch(e => showToast(e.message, 'error'));

  useEffect(() => { load(); }, []);

  const handleRowClick = async (item) => {
    if (apiGetOne) {
      try { const full = await apiGetOne(item.id); setSelected(full); } catch { setSelected(item); }
    } else { setSelected(item); }
    setShowDetail(true);
    setAiResult(null);
  };

  const handleNew = () => {
    setFormData(newItemDefaults || {});
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = () => {
    const data = {};
    formFields.forEach(f => { data[f.key] = selected[f.key] || ''; });
    setFormData(data);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiDelete(selected.id);
      showToast('Deleted successfully');
      setShowDetail(false);
      setSelected(null);
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await apiUpdate(selected.id, formData);
        showToast('Updated successfully');
      } else {
        await apiCreate(formData);
        showToast('Created successfully');
      }
      setShowForm(false);
      setShowDetail(false);
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleAiAction = async (action) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await action.handler(selected);
      setAiResult(result);
      if (action.refresh) load();
      showToast(action.successMsg || 'AI analysis complete');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = items.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return columns.some(c => String(item[c.key] || '').toLowerCase().includes(s));
  });

  return (
    <div>
      <div className="page-header">
        <h1>{icon} {title}</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {apiCreate && <button className="btn btn-primary" onClick={handleNew}>+ New {title.replace(/s$/, '').replace(/ie$/, 'y')}</button>}
        </div>
      </div>

      <input className="search-bar" placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length}><div className="empty-state"><div className="empty-icon">{icon}</div><div>No items found</div></div></td></tr>
            ) : filtered.map(item => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                {columns.map(c => (
                  <td key={c.key}>
                    {c.render ? c.render(item[c.key], item) :
                     c.type === 'status' ? <span className={`status-badge status-${(item[c.key] || '').toLowerCase().replace(/ /g, '_')}`}>{item[c.key]}</span> :
                     c.type === 'probability' ? (
                       <div>
                         <span>{(parseFloat(item[c.key]) * 100).toFixed(1)}%</span>
                         <div className="probability-bar">
                           <div className={`probability-fill ${parseFloat(item[c.key]) > 0.7 ? 'high' : parseFloat(item[c.key]) > 0.4 ? 'medium' : 'low'}`}
                                style={{ width: `${parseFloat(item[c.key]) * 100}%` }} />
                         </div>
                       </div>
                     ) :
                     c.type === 'currency' ? `$${parseFloat(item[c.key] || 0).toFixed(2)}` :
                     c.type === 'date' ? (item[c.key] ? new Date(item[c.key]).toLocaleDateString() : '-') :
                     c.type === 'boolean' ? (item[c.key] ? 'Yes' : 'No') :
                     String(item[c.key] || '-').substring(0, 60) + (String(item[c.key] || '').length > 60 ? '...' : '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {showDetail && selected && (
        <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowDetail(false); setAiResult(null); } }}>
          <div className="detail-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Details</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowDetail(false); setAiResult(null); }}>Close</button>
            </div>
            <div className="detail-actions">
              {apiUpdate && <button className="btn btn-primary btn-sm" onClick={handleEdit}>Edit</button>}
              {apiDelete && <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>}
              {aiActions && aiActions.map((action, i) => (
                <button key={i} className="btn btn-success btn-sm" onClick={() => handleAiAction(action)} disabled={aiLoading}>
                  {action.label}
                </button>
              ))}
            </div>

            {(detailFields || Object.keys(selected)).map(field => {
              const key = typeof field === 'string' ? field : field.key;
              const label = typeof field === 'string' ? field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : field.label;
              const val = selected[key];
              if (val === null || val === undefined) return null;

              const isAiField = aiFields && aiFields.includes(key);
              if (isAiField && isLongText(val)) {
                return (
                  <div key={key} className="ai-response" style={{ marginBottom: 16 }}>
                    <div className="ai-response-header">
                      <span className="ai-badge">AI Generated</span>
                      <span className="ai-model">{label}</span>
                    </div>
                    <div className="ai-response-body" dangerouslySetInnerHTML={{ __html: formatAIResponse(val) }} />
                  </div>
                );
              }

              return (
                <div key={key} className="detail-field">
                  <div className="field-label">{label}</div>
                  <div className="field-value">
                    {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                  </div>
                </div>
              );
            })}

            {aiLoading && (
              <div className="ai-loading">
                <div className="spinner"></div>
                <span>AI is analyzing... This may take a moment.</span>
              </div>
            )}

            {aiResult && (
              <div className="ai-response">
                <div className="ai-response-header">
                  <span className="ai-badge">AI Analysis Result</span>
                  <span className="ai-model">claude-haiku-4.5 via OpenRouter</span>
                </div>
                <div className="ai-response-body" dangerouslySetInnerHTML={{
                  __html: formatAIResponse(
                    typeof aiResult === 'string' ? aiResult :
                    aiResult.findings || aiResult.recommendation || aiResult.notes ||
                    aiResult.assessment || aiResult.microscopic_findings ||
                    JSON.stringify(aiResult, null, 2)
                  )
                }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <h2>{editMode ? 'Edit' : 'New'} {title.replace(/s$/, '').replace(/ie$/, 'y')}</h2>
            <form onSubmit={handleSubmit}>
              {formFields.map(f => (
                <div key={f.key} className="form-group">
                  <label>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} required={f.required} />
                  ) : f.type === 'select' ? (
                    <select value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} required={f.required}>
                      <option value="">Select...</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type || 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} required={f.required} />
                  )}
                </div>
              ))}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editMode ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
