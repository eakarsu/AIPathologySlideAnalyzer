import React from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Slides() {
  return (
    <CrudPage
      title="Slides"
      icon={'\u{1F52C}'}
      apiGet={api.getSlides}
      apiGetOne={api.getSlide}
      apiCreate={api.createSlide}
      apiUpdate={api.updateSlide}
      apiDelete={api.deleteSlide}
      columns={[
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'tissue_type', label: 'Tissue Type' },
        { key: 'stain_type', label: 'Stain' },
        { key: 'organ', label: 'Organ' },
        { key: 'magnification', label: 'Mag' },
        { key: 'lab_technician', label: 'Technician' },
        { key: 'status', label: 'Status', type: 'status' },
      ]}
      formFields={[
        { key: 'slide_id', label: 'Slide ID', required: true },
        { key: 'patient_id', label: 'Patient ID (number)', type: 'number', required: true },
        { key: 'tissue_type', label: 'Tissue Type', required: true, type: 'select', options: ['Epithelial', 'Glandular', 'Mucosal', 'Connective', 'Hepatic', 'Cutaneous', 'Lymphoid', 'Urothelial'] },
        { key: 'stain_type', label: 'Stain Type', required: true, type: 'select', options: ['H&E', 'PAS', 'Pap', 'Trichrome', 'IHC-ER/PR', 'IHC-TTF1', 'IHC-PSA', 'Giemsa', 'Silver'] },
        { key: 'organ', label: 'Organ', required: true },
        { key: 'collection_date', label: 'Collection Date', type: 'date' },
        { key: 'lab_technician', label: 'Lab Technician' },
        { key: 'scanner_model', label: 'Scanner Model', type: 'select', options: ['Aperio AT2', 'Leica SCN400', 'Hamamatsu NanoZoomer', 'Philips UFS'] },
        { key: 'magnification', label: 'Magnification', type: 'select', options: ['10x', '20x', '40x', '60x', '100x'] },
        { key: 'status', label: 'Status', type: 'select', options: ['pending', 'scanning', 'analyzed', 'archived'] },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      detailFields={[
        { key: 'slide_id', label: 'Slide ID' },
        { key: 'patient_id', label: 'Patient ID' },
        { key: 'tissue_type', label: 'Tissue Type' },
        { key: 'stain_type', label: 'Stain Type' },
        { key: 'organ', label: 'Organ' },
        { key: 'collection_date', label: 'Collection Date' },
        { key: 'lab_technician', label: 'Lab Technician' },
        { key: 'scanner_model', label: 'Scanner Model' },
        { key: 'magnification', label: 'Magnification' },
        { key: 'status', label: 'Status' },
        { key: 'notes', label: 'Notes' },
        { key: 'created_at', label: 'Created' },
      ]}
      newItemDefaults={{ slide_id: `SLD-${Date.now().toString(36).toUpperCase()}`, status: 'pending', magnification: '40x' }}
    />
  );
}
