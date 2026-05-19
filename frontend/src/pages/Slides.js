import React, { useState, useRef } from 'react';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Slides() {
  const [uploadingId, setUploadingId] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const [uploadMsg, setUploadMsg] = useState(null);
  const fileRef = useRef(null);
  const pendingSlideId = useRef(null);

  const handleUploadClick = (slideId) => {
    pendingSlideId.current = slideId;
    if (fileRef.current) fileRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingSlideId.current) return;
    const slideId = pendingSlideId.current;
    setUploadingId(slideId);
    setUploadMsg(null);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.uploadSlideImage(slideId, fd);
      if (res.error) setUploadMsg({ error: res.error });
      else setUploadMsg({ success: `Image uploaded for slide ${slideId}` });
    } catch (err) {
      setUploadMsg({ error: err.message });
    }
    setUploadingId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAnalyzeImage = async (slideId) => {
    setAnalyzingId(slideId);
    setImageResult(null);
    try {
      const res = await api.analyzeSlideImage(slideId);
      setImageResult(res);
    } catch (err) {
      setImageResult({ error: err.message });
    }
    setAnalyzingId(null);
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {uploadMsg && (
        <div style={{ margin: '0 0 16px 0', padding: '10px 16px', borderRadius: 8, background: uploadMsg.error ? '#dc262620' : '#16a08520', color: uploadMsg.error ? '#f87171' : '#34d399', fontSize: 13 }}>
          {uploadMsg.error || uploadMsg.success}
        </div>
      )}

      {imageResult && (
        <div style={{ margin: '0 0 16px 0', padding: 16, background: '#1f2937', borderRadius: 8, border: '1px solid #374151' }}>
          <div style={{ color: '#60a5fa', fontWeight: 'bold', marginBottom: 8 }}>Image Analysis Result</div>
          {imageResult.error ? (
            <div style={{ color: '#f87171' }}>{imageResult.error}</div>
          ) : (
            <div style={{ fontSize: 13, color: '#d1d5db' }}>
              {imageResult.tissue_type && <div><strong>Tissue:</strong> {imageResult.tissue_type}</div>}
              {imageResult.cell_morphology && <div><strong>Cell Morphology:</strong> {imageResult.cell_morphology}</div>}
              {imageResult.cancer_probability != null && (
                <div><strong>Cancer Probability:</strong> <span style={{ color: imageResult.cancer_probability > 0.6 ? '#f87171' : '#34d399' }}>{(imageResult.cancer_probability * 100).toFixed(1)}%</span></div>
              )}
              {imageResult.confidence != null && <div><strong>Confidence:</strong> {(imageResult.confidence * 100).toFixed(1)}%</div>}
              {imageResult.findings && imageResult.findings.length > 0 && (
                <div><strong>Findings:</strong> {Array.isArray(imageResult.findings) ? imageResult.findings.join(', ') : imageResult.findings}</div>
              )}
            </div>
          )}
        </div>
      )}

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
          { key: 'image_url', label: 'Image', render: (v) => v ? <span style={{ color: '#34d399', fontSize: 11 }}>Uploaded</span> : <span style={{ color: '#9ca3af', fontSize: 11 }}>No image</span> },
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
          { key: 'image_url', label: 'Image URL' },
          { key: 'status', label: 'Status' },
          { key: 'notes', label: 'Notes' },
          { key: 'created_at', label: 'Created' },
        ]}
        aiActions={[
          {
            label: 'Upload Image',
            handler: async (item) => {
              handleUploadClick(item.id);
              return null;
            },
            successMsg: null,
          },
          {
            label: analyzingId ? 'Analyzing...' : 'Analyze Image',
            handler: async (item) => {
              const res = await api.analyzeSlideImage(item.id);
              setImageResult(res);
              return res;
            },
            successMsg: 'Image analysis complete',
          },
        ]}
        newItemDefaults={{ slide_id: `SLD-${Date.now().toString(36).toUpperCase()}`, status: 'pending', magnification: '40x' }}
      />
    </div>
  );
}
