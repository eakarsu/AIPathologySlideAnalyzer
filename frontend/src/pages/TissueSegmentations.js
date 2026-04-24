import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function TissueSegmentations() {
  return (
    <CrudPage
      title="Tissue Segmentations"
      icon={'\u{1F4DA}'}
      apiGet={api.getTissueSegmentations}
      apiGetOne={api.getTissueSegmentation}
      apiCreate={async (data) => api.runTissueSegmentation(data.slide_id)}
      apiUpdate={api.updateTissueSegmentation}
      apiDelete={api.deleteTissueSegmentation}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'slide_id', label: 'Slide' },
        { key: 'segment_type', label: 'Segment Type' },
        { key: 'area_percentage', label: 'Area %', render: v => v ? `${v}%` : '-' },
        { key: 'tissue_class', label: 'Tissue Class' },
        { key: 'health_status', label: 'Health', type: 'status' },
        { key: 'density_score', label: 'Density' },
      ]}
      formFields={[
        { key: 'slide_id', label: 'Slide ID (number) - AI will segment', type: 'number', required: true },
      ]}
      detailFields={[
        { key: 'id', label: 'Segmentation ID' },
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'segment_type', label: 'Segment Type' },
        { key: 'area_percentage', label: 'Area Percentage' },
        { key: 'tissue_class', label: 'Tissue Class' },
        { key: 'health_status', label: 'Health Status' },
        { key: 'density_score', label: 'Density Score' },
        { key: 'boundary_data', label: 'Boundary Data' },
        { key: 'notes', label: 'AI Segmentation Notes' },
        { key: 'created_at', label: 'Created' },
      ]}
      aiFields={['notes']}
      aiActions={[
        {
          label: 'Run AI Tissue Segmentation',
          handler: async (item) => {
            const result = await api.runTissueSegmentation(item.slide_id);
            return result;
          },
          refresh: true,
          successMsg: 'Tissue segmentation complete',
        },
      ]}
      newItemDefaults={{}}
    />
  );
}
