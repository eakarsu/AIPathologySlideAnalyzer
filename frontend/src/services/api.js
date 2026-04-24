const API_BASE = 'http://localhost:3001/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: getHeaders(),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getDashboardStats: () => request('/dashboard/stats'),

  getPatients: () => request('/patients'),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  getSlides: () => request('/slides'),
  getSlide: (id) => request(`/slides/${id}`),
  createSlide: (data) => request('/slides', { method: 'POST', body: JSON.stringify(data) }),
  updateSlide: (id, data) => request(`/slides/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSlide: (id) => request(`/slides/${id}`, { method: 'DELETE' }),

  getAnalyses: () => request('/analyses'),
  getAnalysis: (id) => request(`/analyses/${id}`),
  runAnalysis: (slideId) => request(`/analyses/run/${slideId}`, { method: 'POST' }),
  deleteAnalysis: (id) => request(`/analyses/${id}`, { method: 'DELETE' }),

  getCancerDetections: () => request('/cancer-detections'),
  getCancerDetection: (id) => request(`/cancer-detections/${id}`),
  runCancerDetection: (slideId) => request(`/cancer-detections/run/${slideId}`, { method: 'POST' }),
  updateCancerDetection: (id, data) => request(`/cancer-detections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCancerDetection: (id) => request(`/cancer-detections/${id}`, { method: 'DELETE' }),

  getCellClassifications: () => request('/cell-classifications'),
  getCellClassification: (id) => request(`/cell-classifications/${id}`),
  runCellClassification: (slideId) => request(`/cell-classifications/run/${slideId}`, { method: 'POST' }),
  updateCellClassification: (id, data) => request(`/cell-classifications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCellClassification: (id) => request(`/cell-classifications/${id}`, { method: 'DELETE' }),

  getTissueSegmentations: () => request('/tissue-segmentations'),
  getTissueSegmentation: (id) => request(`/tissue-segmentations/${id}`),
  runTissueSegmentation: (slideId) => request(`/tissue-segmentations/run/${slideId}`, { method: 'POST' }),
  updateTissueSegmentation: (id, data) => request(`/tissue-segmentations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTissueSegmentation: (id) => request(`/tissue-segmentations/${id}`, { method: 'DELETE' }),

  getReports: () => request('/reports'),
  getReport: (id) => request(`/reports/${id}`),
  createReport: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  updateReport: (id, data) => request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReport: (id) => request(`/reports/${id}`, { method: 'DELETE' }),
  generateReport: (slideId) => request(`/reports/generate/${slideId}`, { method: 'POST' }),

  getCases: () => request('/cases'),
  getCase: (id) => request(`/cases/${id}`),
  createCase: (data) => request('/cases', { method: 'POST', body: JSON.stringify(data) }),
  updateCase: (id, data) => request(`/cases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCase: (id) => request(`/cases/${id}`, { method: 'DELETE' }),

  getQualityControls: () => request('/quality-controls'),
  getQualityControl: (id) => request(`/quality-controls/${id}`),
  createQualityControl: (data) => request('/quality-controls', { method: 'POST', body: JSON.stringify(data) }),
  updateQualityControl: (id, data) => request(`/quality-controls/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQualityControl: (id) => request(`/quality-controls/${id}`, { method: 'DELETE' }),
  aiQCAssess: (slideId) => request(`/quality-controls/ai-assess/${slideId}`, { method: 'POST' }),

  getAnnotations: () => request('/annotations'),
  getAnnotation: (id) => request(`/annotations/${id}`),
  getSlideAnnotations: (slideId) => request(`/annotations/slide/${slideId}`),
  createAnnotation: (data) => request('/annotations', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnotation: (id, data) => request(`/annotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnotation: (id) => request(`/annotations/${id}`, { method: 'DELETE' }),

  getBilling: () => request('/billing'),
  getBillingRecord: (id) => request(`/billing/${id}`),
  createBilling: (data) => request('/billing', { method: 'POST', body: JSON.stringify(data) }),
  updateBilling: (id, data) => request(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBilling: (id) => request(`/billing/${id}`, { method: 'DELETE' }),

  getEquipment: () => request('/equipment'),
  getEquipmentItem: (id) => request(`/equipment/${id}`),
  createEquipment: (data) => request('/equipment', { method: 'POST', body: JSON.stringify(data) }),
  updateEquipment: (id, data) => request(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEquipment: (id) => request(`/equipment/${id}`, { method: 'DELETE' }),

  getAuditLogs: () => request('/audit-logs'),
  getAuditLog: (id) => request(`/audit-logs/${id}`),

  getSettings: () => request('/settings'),
  getSetting: (id) => request(`/settings/${id}`),
  updateSetting: (id, value) => request(`/settings/${id}`, { method: 'PUT', body: JSON.stringify({ value }) }),
};

export default api;
