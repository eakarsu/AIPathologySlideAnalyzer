import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function CellClassifications() {
  return (
    <CrudPage
      title="Cell Classifications"
      icon={'\u{1F9EC}'}
      apiGet={api.getCellClassifications}
      apiGetOne={api.getCellClassification}
      apiCreate={async (data) => api.runCellClassification(data.slide_id)}
      apiUpdate={api.updateCellClassification}
      apiDelete={api.deleteCellClassification}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'slide_id', label: 'Slide' },
        { key: 'cell_type', label: 'Cell Type' },
        { key: 'count', label: 'Count' },
        { key: 'percentage', label: '%', render: v => v ? `${v}%` : '-' },
        { key: 'abnormality_flag', label: 'Abnormal', type: 'boolean' },
        { key: 'confidence', label: 'Confidence', render: v => v ? `${v}%` : '-' },
      ]}
      formFields={[
        { key: 'slide_id', label: 'Slide ID (number) - AI will classify', type: 'number', required: true },
      ]}
      detailFields={[
        { key: 'id', label: 'Classification ID' },
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'cell_type', label: 'Cell Type' },
        { key: 'count', label: 'Cell Count' },
        { key: 'percentage', label: 'Percentage' },
        { key: 'morphology', label: 'Morphology' },
        { key: 'abnormality_flag', label: 'Abnormality Flag' },
        { key: 'confidence', label: 'Confidence' },
        { key: 'notes', label: 'AI Classification Notes' },
        { key: 'created_at', label: 'Created' },
      ]}
      aiFields={['notes']}
      aiActions={[
        {
          label: 'Run AI Cell Classification',
          handler: async (item) => {
            const result = await api.runCellClassification(item.slide_id);
            return result;
          },
          refresh: true,
          successMsg: 'Cell classification complete',
        },
      ]}
      newItemDefaults={{}}
    />
  );
}
