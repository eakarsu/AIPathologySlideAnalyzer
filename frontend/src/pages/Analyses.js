import React, { useState } from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Analyses() {
  return (
    <CrudPage
      title="AI Analyses"
      icon={'\u{1F9E0}'}
      apiGet={api.getAnalyses}
      apiGetOne={api.getAnalysis}
      apiDelete={api.deleteAnalysis}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'analysis_type', label: 'Type' },
        { key: 'confidence_score', label: 'Confidence', render: (v) => v ? `${v}%` : '-' },
        { key: 'ai_model', label: 'Model' },
        { key: 'processing_time_ms', label: 'Time (ms)' },
        { key: 'status', label: 'Status', type: 'status' },
      ]}
      formFields={[
        { key: 'slide_id', label: 'Slide ID (select slide number to analyze)', type: 'number', required: true },
      ]}
      apiCreate={async (data) => api.runAnalysis(data.slide_id)}
      detailFields={[
        { key: 'id', label: 'Analysis ID' },
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'analysis_type', label: 'Analysis Type' },
        { key: 'confidence_score', label: 'Confidence Score' },
        { key: 'ai_model', label: 'AI Model' },
        { key: 'processing_time_ms', label: 'Processing Time (ms)' },
        { key: 'status', label: 'Status' },
        { key: 'findings', label: 'AI Findings' },
        { key: 'result_data', label: 'Result Data' },
        { key: 'created_at', label: 'Created' },
      ]}
      aiFields={['findings']}
      aiActions={[
        {
          label: 'Re-run AI Analysis',
          handler: async (item) => {
            const result = await api.runAnalysis(item.slide_id);
            return result;
          },
          refresh: true,
          successMsg: 'AI analysis completed successfully',
        },
      ]}
      newItemDefaults={{}}
    />
  );
}
