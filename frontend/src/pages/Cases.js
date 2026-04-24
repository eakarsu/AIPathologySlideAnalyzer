import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Cases() {
  return (
    <CrudPage
      title="Cases"
      icon={'\u{1F4C2}'}
      apiGet={api.getCases}
      apiGetOne={api.getCase}
      apiCreate={api.createCase}
      apiUpdate={api.updateCase}
      apiDelete={api.deleteCase}
      columns={[
        { key: 'case_id', label: 'Case ID' },
        { key: 'patient_id', label: 'Patient' },
        { key: 'case_type', label: 'Type' },
        { key: 'priority', label: 'Priority', type: 'status' },
        { key: 'assigned_pathologist', label: 'Assigned To' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'turnaround_days', label: 'TAT (days)' },
      ]}
      formFields={[
        { key: 'case_id', label: 'Case ID', required: true },
        { key: 'patient_id', label: 'Patient ID (number)', type: 'number', required: true },
        { key: 'case_type', label: 'Case Type', required: true, type: 'select', options: ['Surgical Pathology', 'Cytopathology', 'Dermatopathology', 'Hepatopathology', 'GI Pathology', 'Renal Pathology', 'Gynecologic Pathology', 'Hematopathology'] },
        { key: 'priority', label: 'Priority', type: 'select', options: ['normal', 'high', 'urgent'] },
        { key: 'assigned_pathologist', label: 'Assigned Pathologist' },
        { key: 'status', label: 'Status', type: 'select', options: ['open', 'in_progress', 'completed', 'on_hold'] },
        { key: 'diagnosis', label: 'Diagnosis', type: 'textarea' },
        { key: 'turnaround_days', label: 'Turnaround Days', type: 'number' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      detailFields={[
        { key: 'case_id', label: 'Case ID' },
        { key: 'patient_id', label: 'Patient ID' },
        { key: 'case_type', label: 'Case Type' },
        { key: 'priority', label: 'Priority' },
        { key: 'assigned_pathologist', label: 'Assigned Pathologist' },
        { key: 'status', label: 'Status' },
        { key: 'diagnosis', label: 'Diagnosis' },
        { key: 'turnaround_days', label: 'Turnaround Days' },
        { key: 'notes', label: 'Notes' },
        { key: 'created_at', label: 'Created' },
        { key: 'updated_at', label: 'Updated' },
      ]}
      newItemDefaults={{ case_id: `CASE-${Date.now().toString(36).toUpperCase()}`, status: 'open', priority: 'normal' }}
    />
  );
}
