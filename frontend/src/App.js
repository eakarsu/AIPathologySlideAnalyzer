import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Slides from './pages/Slides';
import Analyses from './pages/Analyses';
import CancerDetections from './pages/CancerDetections';
import CellClassifications from './pages/CellClassifications';
import TissueSegmentations from './pages/TissueSegmentations';
import Reports from './pages/Reports';
import Cases from './pages/Cases';
import QualityControls from './pages/QualityControls';
import Annotations from './pages/Annotations';
import Billing from './pages/Billing';
import Equipment from './pages/Equipment';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
// // === Batch 06 Gaps & Frontend Mounts ===
import CFAiPathologyAssistantPage from './pages/CFAiPathologyAssistantPage';
import CFSecondOpinionConsensusPage from './pages/CFSecondOpinionConsensusPage';
import CFEducationalModePage from './pages/CFEducationalModePage';
import CFRegistryIntegrationPage from './pages/CFRegistryIntegrationPage';
import CFQualityAssuranceLoopPage from './pages/CFQualityAssuranceLoopPage';
import GapQualityAssessPage from './pages/GapQualityAssessPage';
import GapMultiPage from './pages/GapMultiPage';
import GapAutoReportGeneratePage from './pages/GapAutoReportGeneratePage';
import GapNoDedicatedRoutesDirectoryAllRoutesInlineInPage from './pages/GapNoDedicatedRoutesDirectoryAllRoutesInlineInPage';
import GapNoDicomServerIntegrationMedicalImageStandardPage from './pages/GapNoDicomServerIntegrationMedicalImageStandardPage';
import GapNoLisLabInformationSystemIntegrationPage from './pages/GapNoLisLabInformationSystemIntegrationPage';
import GapNoWholeSlideImageWsiViewerOnlyStoredImagesPage from './pages/GapNoWholeSlideImageWsiViewerOnlyStoredImagesPage';
import GapNoMultiPage from './pages/GapNoMultiPage';
import GapNoWebhooksForLabResultDeliveryPage from './pages/GapNoWebhooksForLabResultDeliveryPage';
import GapNoNotificationsLayerGrepReturned0NotificatioPage from './pages/GapNoNotificationsLayerGrepReturned0NotificatioPage';
import GapLimitedRbacBasicAuthOnlyPage from './pages/GapLimitedRbacBasicAuthOnlyPage';
import Extensions from './pages/Extensions'; // Apply pass 5

function Sidebar({ onLogout }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navItems = [
    { path: '/dashboard', icon: '\u{1F4CA}', label: 'Dashboard' },
    { path: '/patients', icon: '\u{1F465}', label: 'Patients' },
    { path: '/slides', icon: '\u{1F52C}', label: 'Slides' },
    { path: '/analyses', icon: '\u{1F9E0}', label: 'AI Analysis' },
    { path: '/cancer-detections', icon: '\u{1F3AF}', label: 'Cancer Detection' },
    { path: '/cell-classifications', icon: '\u{1F9EC}', label: 'Cell Classification' },
    { path: '/tissue-segmentations', icon: '\u{1F4DA}', label: 'Tissue Segmentation' },
    { path: '/reports', icon: '\u{1F4CB}', label: 'Reports' },
    { path: '/cases', icon: '\u{1F4C2}', label: 'Cases' },
    { path: '/quality-controls', icon: '\u2705', label: 'Quality Control' },
    { path: '/annotations', icon: '\u{1F58A}\uFE0F', label: 'Annotations' },
    { path: '/billing', icon: '\u{1F4B0}', label: 'Billing' },
    { path: '/equipment', icon: '\u2699\uFE0F', label: 'Lab Equipment' },
    { path: '/audit-logs', icon: '\u{1F4DD}', label: 'Audit Log' },
    { path: '/extensions', icon: '\u{1F9E9}', label: 'Extensions' },
    { path: '/settings', icon: '\u{1F527}', label: 'Settings' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ fontSize: 28, marginBottom: 4 }}>{'\u{1F52C}'}</div>
        <h2>PathologyAI</h2>
        <span>Digital Slide Analyzer</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-name">{user.name || 'User'}</div>
        <div className="user-info">{user.email || ''}</div>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

function ProtectedLayout({ onLogout, children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return (
    <div className="app-layout">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">{children}</div>
    </div>
  );
}

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));

  const handleLogin = () => setAuthed(true);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthed(false);
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={authed ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
        {[
          { path: '/dashboard', el: <Dashboard /> },
          { path: '/patients', el: <Patients /> },
          { path: '/slides', el: <Slides /> },
          { path: '/analyses', el: <Analyses /> },
          { path: '/cancer-detections', el: <CancerDetections /> },
          { path: '/cell-classifications', el: <CellClassifications /> },
          { path: '/tissue-segmentations', el: <TissueSegmentations /> },
          { path: '/reports', el: <Reports /> },
          { path: '/cases', el: <Cases /> },
          { path: '/quality-controls', el: <QualityControls /> },
          { path: '/annotations', el: <Annotations /> },
          { path: '/billing', el: <Billing /> },
          { path: '/equipment', el: <Equipment /> },
          { path: '/audit-logs', el: <AuditLogs /> },
          { path: '/extensions', el: <Extensions /> },
          { path: '/settings', el: <Settings /> },
        ].map(r => (
          <Route key={r.path} path={r.path} element={<ProtectedLayout onLogout={handleLogout}>{r.el}</ProtectedLayout>} />
        ))}
      
          {/* // === Batch 06 Gaps & Frontend Mounts === */}
          <Route path="/cf-ai-pathology-assistant" element={<CFAiPathologyAssistantPage />} />
          <Route path="/cf-second-opinion-consensus" element={<CFSecondOpinionConsensusPage />} />
          <Route path="/cf-educational-mode" element={<CFEducationalModePage />} />
          <Route path="/cf-registry-integration" element={<CFRegistryIntegrationPage />} />
          <Route path="/cf-quality-assurance-loop" element={<CFQualityAssuranceLoopPage />} />
          <Route path="/gap-quality-assess" element={<GapQualityAssessPage />} />
          <Route path="/gap-multi" element={<GapMultiPage />} />
          <Route path="/gap-auto-report-generate" element={<GapAutoReportGeneratePage />} />
          <Route path="/gap-no-dedicated-routes-directory-all-routes-inline-in" element={<GapNoDedicatedRoutesDirectoryAllRoutesInlineInPage />} />
          <Route path="/gap-no-dicom-server-integration-medical-image-standard" element={<GapNoDicomServerIntegrationMedicalImageStandardPage />} />
          <Route path="/gap-no-lis-lab-information-system-integration" element={<GapNoLisLabInformationSystemIntegrationPage />} />
          <Route path="/gap-no-whole-slide-image-wsi-viewer-only-stored-images" element={<GapNoWholeSlideImageWsiViewerOnlyStoredImagesPage />} />
          <Route path="/gap-no-multi" element={<GapNoMultiPage />} />
          <Route path="/gap-no-webhooks-for-lab-result-delivery" element={<GapNoWebhooksForLabResultDeliveryPage />} />
          <Route path="/gap-no-notifications-layer-grep-returned-0-notificatio" element={<GapNoNotificationsLayerGrepReturned0NotificatioPage />} />
          <Route path="/gap-limited-rbac-basic-auth-only" element={<GapLimitedRbacBasicAuthOnlyPage />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
