import React from 'react';
import CellDistributionChart from '../components/CellDistributionChart';
import TissueHeatmap from '../components/TissueHeatmap';
import PathologyReportPDF from '../components/PathologyReportPDF';
import DiagnosticRulesEditor from '../components/DiagnosticRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <h1>Pathology Views</h1>
        <span style={{ color: '#71717a', fontSize: 13 }}>4 custom views — cell distribution · tissue heatmap · report PDF · diagnostic rules</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <CellDistributionChart />
        <TissueHeatmap />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 16 }}>
        <PathologyReportPDF />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <DiagnosticRulesEditor />
      </div>
    </div>
  );
}
