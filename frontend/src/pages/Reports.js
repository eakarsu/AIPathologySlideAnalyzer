import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Reports() {
  return (
    <CrudPage
      title="Pathology Reports"
      icon={'\u{1F4CB}'}
      apiGet={api.getReports}
      apiGetOne={api.getReport}
      apiCreate={api.createReport}
      apiUpdate={api.updateReport}
      apiDelete={api.deleteReport}
      columns={[
        { key: 'report_id', label: 'Report ID' },
        { key: 'patient_id', label: 'Patient' },
        { key: 'slide_id', label: 'Slide' },
        { key: 'pathologist', label: 'Pathologist' },
        { key: 'diagnosis', label: 'Diagnosis' },
        { key: 'status', label: 'Status', type: 'status' },
      ]}
      formFields={[
        { key: 'report_id', label: 'Report ID', required: true },
        { key: 'patient_id', label: 'Patient ID (number)', type: 'number', required: true },
        { key: 'slide_id', label: 'Slide ID (number)', type: 'number', required: true },
        { key: 'pathologist', label: 'Pathologist', required: true },
        { key: 'diagnosis', label: 'Diagnosis', type: 'textarea' },
        { key: 'microscopic_findings', label: 'Microscopic Findings', type: 'textarea' },
        { key: 'gross_description', label: 'Gross Description', type: 'textarea' },
        { key: 'clinical_history', label: 'Clinical History', type: 'textarea' },
        { key: 'recommendations', label: 'Recommendations', type: 'textarea' },
        { key: 'status', label: 'Status', type: 'select', options: ['draft', 'review', 'signed', 'amended'] },
      ]}
      detailFields={[
        { key: 'report_id', label: 'Report ID' },
        { key: 'patient_id', label: 'Patient ID' },
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'pathologist', label: 'Pathologist' },
        { key: 'diagnosis', label: 'Diagnosis' },
        { key: 'microscopic_findings', label: 'Microscopic Findings' },
        { key: 'gross_description', label: 'Gross Description' },
        { key: 'clinical_history', label: 'Clinical History' },
        { key: 'recommendations', label: 'Recommendations' },
        { key: 'status', label: 'Status' },
        { key: 'signed_date', label: 'Signed Date' },
        { key: 'created_at', label: 'Created' },
      ]}
      aiFields={['microscopic_findings', 'recommendations']}
      aiActions={[
        {
          label: 'AI Generate Report',
          handler: async (item) => {
            const result = await api.generateReport(item.slide_id);
            return result;
          },
          refresh: true,
          successMsg: 'AI report generated',
        },
      ]}
      newItemDefaults={{ report_id: `RPT-${Date.now().toString(36).toUpperCase()}`, status: 'draft' }}
    />
  );
}
