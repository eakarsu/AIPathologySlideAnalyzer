import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function CancerDetections() {
  return (
    <CrudPage
      title="Cancer Detections"
      icon={'\u{1F3AF}'}
      apiGet={api.getCancerDetections}
      apiGetOne={api.getCancerDetection}
      apiCreate={async (data) => api.runCancerDetection(data.slide_id)}
      apiUpdate={api.updateCancerDetection}
      apiDelete={api.deleteCancerDetection}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'slide_id', label: 'Slide' },
        { key: 'cancer_type', label: 'Cancer Type' },
        { key: 'probability', label: 'Probability', type: 'probability' },
        { key: 'grade', label: 'Grade' },
        { key: 'stage', label: 'Stage' },
        { key: 'status', label: 'Status', type: 'status' },
      ]}
      formFields={[
        { key: 'slide_id', label: 'Slide ID (number) - AI will analyze', type: 'number', required: true },
      ]}
      detailFields={[
        { key: 'id', label: 'Detection ID' },
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'cancer_type', label: 'Cancer Type' },
        { key: 'probability', label: 'Probability' },
        { key: 'grade', label: 'Grade' },
        { key: 'stage', label: 'Stage' },
        { key: 'markers', label: 'Markers' },
        { key: 'recommendation', label: 'AI Recommendation' },
        { key: 'status', label: 'Status' },
        { key: 'reviewed_by', label: 'Reviewed By' },
        { key: 'location_data', label: 'Location Data' },
        { key: 'created_at', label: 'Created' },
      ]}
      aiFields={['recommendation']}
      aiActions={[
        {
          label: 'Run AI Cancer Detection',
          handler: async (item) => {
            const result = await api.runCancerDetection(item.slide_id);
            return result;
          },
          refresh: true,
          successMsg: 'Cancer detection analysis complete',
        },
      ]}
      newItemDefaults={{}}
    />
  );
}
