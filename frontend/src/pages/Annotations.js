import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Annotations() {
  return (
    <CrudPage
      title="Annotations"
      icon={'\u{1F58A}\uFE0F'}
      apiGet={api.getAnnotations}
      apiGetOne={api.getAnnotation}
      apiCreate={api.createAnnotation}
      apiUpdate={api.updateAnnotation}
      apiDelete={api.deleteAnnotation}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'slide_id', label: 'Slide' },
        { key: 'annotator', label: 'Annotator' },
        { key: 'annotation_type', label: 'Type' },
        { key: 'label', label: 'Label' },
        { key: 'is_ai_generated', label: 'AI', type: 'boolean' },
        { key: 'color', label: 'Color', render: (v) => v ? <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: v, verticalAlign: 'middle' }} /> : '-' },
      ]}
      formFields={[
        { key: 'slide_id', label: 'Slide ID (number)', type: 'number', required: true },
        { key: 'annotator', label: 'Annotator', required: true },
        { key: 'annotation_type', label: 'Type', type: 'select', options: ['region', 'point', 'measurement', 'freehand'], required: true },
        { key: 'label', label: 'Label', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'color', label: 'Color (hex)', },
      ]}
      detailFields={[
        { key: 'id', label: 'Annotation ID' },
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'annotator', label: 'Annotator' },
        { key: 'annotation_type', label: 'Type' },
        { key: 'label', label: 'Label' },
        { key: 'description', label: 'Description' },
        { key: 'coordinates', label: 'Coordinates' },
        { key: 'color', label: 'Color' },
        { key: 'is_ai_generated', label: 'AI Generated' },
        { key: 'created_at', label: 'Created' },
      ]}
      newItemDefaults={{ annotation_type: 'region', color: '#FF4444' }}
    />
  );
}
