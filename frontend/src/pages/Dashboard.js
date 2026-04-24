import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { api.getDashboardStats().then(setStats).catch(console.error); }, []);

  const features = [
    { path: '/patients', icon: '\u{1F465}', title: 'Patient Management', desc: 'Manage patient records, history, and demographics', color: '#6366f1' },
    { path: '/slides', icon: '\u{1F52C}', title: 'Slide Management', desc: 'Track and manage digital pathology slides', color: '#8b5cf6' },
    { path: '/analyses', icon: '\u{1F9E0}', title: 'AI Slide Analysis', desc: 'Run comprehensive AI-powered slide analysis', color: '#06b6d4' },
    { path: '/cancer-detections', icon: '\u{1F3AF}', title: 'Cancer Detection', desc: 'AI cancer detection with probability scoring', color: '#dc2626' },
    { path: '/cell-classifications', icon: '\u{1F9EC}', title: 'Cell Classification', desc: 'Automated cell type identification and counting', color: '#059669' },
    { path: '/tissue-segmentations', icon: '\u{1F4DA}', title: 'Tissue Segmentation', desc: 'AI tissue region segmentation and analysis', color: '#d97706' },
    { path: '/reports', icon: '\u{1F4CB}', title: 'Pathology Reports', desc: 'Generate and manage pathology reports', color: '#0891b2' },
    { path: '/cases', icon: '\u{1F4C2}', title: 'Case Management', desc: 'Track pathology cases and assignments', color: '#7c3aed' },
    { path: '/quality-controls', icon: '\u2705', title: 'Quality Control', desc: 'Slide and process quality management', color: '#16a34a' },
    { path: '/annotations', icon: '\u{1F58A}\uFE0F', title: 'Slide Annotations', desc: 'View and manage slide annotations', color: '#ea580c' },
    { path: '/billing', icon: '\u{1F4B0}', title: 'Billing & Invoicing', desc: 'Per-slide billing and insurance claims', color: '#0d9488' },
    { path: '/equipment', icon: '\u2699\uFE0F', title: 'Lab Equipment', desc: 'Equipment inventory and maintenance tracking', color: '#4f46e5' },
    { path: '/audit-logs', icon: '\u{1F4DD}', title: 'Audit Log', desc: 'System activity and compliance tracking', color: '#71717a' },
    { path: '/settings', icon: '\u{1F527}', title: 'Settings', desc: 'System and AI configuration', color: '#a1a1aa' },
  ];

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">{'\u{1F465}'}</div>
            <div className="stat-value">{stats.totalPatients}</div>
            <div className="stat-label">Total Patients</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{'\u{1F52C}'}</div>
            <div className="stat-value">{stats.totalSlides}</div>
            <div className="stat-label">Total Slides</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{'\u{1F9E0}'}</div>
            <div className="stat-value">{stats.totalAnalyses}</div>
            <div className="stat-label">AI Analyses</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{'\u{1F3AF}'}</div>
            <div className="stat-value">{stats.cancerDetections}</div>
            <div className="stat-label">Cancer Detections</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{'\u{1F4C2}'}</div>
            <div className="stat-value">{stats.activeCases}</div>
            <div className="stat-label">Active Cases</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{'\u23F3'}</div>
            <div className="stat-value">{stats.pendingSlides}</div>
            <div className="stat-label">Pending Slides</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{'\u{1F4CB}'}</div>
            <div className="stat-value">{stats.totalReports}</div>
            <div className="stat-label">Total Reports</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">{'\u{1F4B0}'}</div>
            <div className="stat-value">${stats.totalRevenue?.toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      )}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Features</h2>
      <div className="feature-grid">
        {features.map(f => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className="card-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
