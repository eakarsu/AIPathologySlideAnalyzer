import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function QualityControls() {
  return (
    <CrudPage
      title="Quality Controls"
      icon={'\u2705'}
      apiGet={api.getQualityControls}
      apiGetOne={api.getQualityControl}
      apiCreate={api.createQualityControl}
      apiUpdate={api.updateQualityControl}
      apiDelete={api.deleteQualityControl}
      columns={[
        { key: 'qc_id', label: 'QC ID' },
        { key: 'slide_id', label: 'Slide' },
        { key: 'inspector', label: 'Inspector' },
        { key: 'stain_quality', label: 'Stain', type: 'status' },
        { key: 'tissue_integrity', label: 'Tissue', type: 'status' },
        { key: 'overall_score', label: 'Score', render: v => v ? `${v}/10` : '-' },
        { key: 'pass_fail', label: 'Result', type: 'status' },
      ]}
      formFields={[
        { key: 'qc_id', label: 'QC ID', required: true },
        { key: 'slide_id', label: 'Slide ID (number)', type: 'number', required: true },
        { key: 'inspector', label: 'Inspector', required: true },
        { key: 'stain_quality', label: 'Stain Quality', type: 'select', options: ['excellent', 'good', 'fair', 'poor'], required: true },
        { key: 'tissue_integrity', label: 'Tissue Integrity', type: 'select', options: ['excellent', 'good', 'fair', 'poor'], required: true },
        { key: 'scan_quality', label: 'Scan Quality', type: 'select', options: ['excellent', 'good', 'fair', 'poor'], required: true },
        { key: 'overall_score', label: 'Overall Score (0-10)', type: 'number' },
        { key: 'pass_fail', label: 'Pass/Fail', type: 'select', options: ['pass', 'fail'], required: true },
        { key: 'issues', label: 'Issues', type: 'textarea' },
        { key: 'corrective_action', label: 'Corrective Action', type: 'textarea' },
      ]}
      detailFields={[
        { key: 'qc_id', label: 'QC ID' },
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'inspector', label: 'Inspector' },
        { key: 'stain_quality', label: 'Stain Quality' },
        { key: 'tissue_integrity', label: 'Tissue Integrity' },
        { key: 'scan_quality', label: 'Scan Quality' },
        { key: 'overall_score', label: 'Overall Score' },
        { key: 'pass_fail', label: 'Pass/Fail' },
        { key: 'issues', label: 'Issues' },
        { key: 'corrective_action', label: 'Corrective Action' },
        { key: 'created_at', label: 'Created' },
      ]}
      aiActions={[
        {
          label: 'AI Quality Assessment',
          handler: async (item) => {
            const result = await api.aiQCAssess(item.slide_id);
            return result;
          },
          successMsg: 'AI quality assessment complete',
        },
      ]}
      aiFields={['corrective_action']}
      newItemDefaults={{ qc_id: `QC-${Date.now().toString(36).toUpperCase()}`, pass_fail: 'pass' }}
    />
  );
}
