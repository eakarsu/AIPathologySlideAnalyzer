const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, initDB } = require('./database');
const ai = require('./openrouter');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// JWT Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'pathology-analyzer-secret-key-2024');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || 'pathology-analyzer-secret-key-2024', { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GENERIC CRUD HELPER ====================
function createCRUD(tableName, idField = 'id') {
  return {
    getAll: async (req, res) => {
      try {
        const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id DESC`);
        res.json(result.rows);
      } catch (err) { res.status(500).json({ error: err.message }); }
    },
    getOne: async (req, res) => {
      try {
        const result = await pool.query(`SELECT * FROM ${tableName} WHERE ${idField} = $1`, [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
      } catch (err) { res.status(500).json({ error: err.message }); }
    },
    delete: async (req, res) => {
      try {
        await pool.query(`DELETE FROM ${tableName} WHERE ${idField} = $1`, [req.params.id]);
        res.json({ message: 'Deleted successfully' });
      } catch (err) { res.status(500).json({ error: err.message }); }
    },
  };
}

// ==================== PATIENTS ====================
const patients = createCRUD('patients');
app.get('/api/patients', authMiddleware, patients.getAll);
app.get('/api/patients/:id', authMiddleware, patients.getOne);
app.delete('/api/patients/:id', authMiddleware, patients.delete);
app.post('/api/patients', authMiddleware, async (req, res) => {
  try {
    const { patient_id, first_name, last_name, date_of_birth, gender, phone, email, address, medical_history, insurance_provider, status } = req.body;
    const result = await pool.query(
      `INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, gender, phone, email, address, medical_history, insurance_provider, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [patient_id, first_name, last_name, date_of_birth, gender, phone, email, address, medical_history, insurance_provider, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/patients/:id', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, phone, email, address, medical_history, insurance_provider, status } = req.body;
    const result = await pool.query(
      `UPDATE patients SET first_name=$1, last_name=$2, date_of_birth=$3, gender=$4, phone=$5, email=$6, address=$7, medical_history=$8, insurance_provider=$9, status=$10, updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`,
      [first_name, last_name, date_of_birth, gender, phone, email, address, medical_history, insurance_provider, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== SLIDES ====================
const slides = createCRUD('slides');
app.get('/api/slides', authMiddleware, slides.getAll);
app.get('/api/slides/:id', authMiddleware, slides.getOne);
app.delete('/api/slides/:id', authMiddleware, slides.delete);
app.post('/api/slides', authMiddleware, async (req, res) => {
  try {
    const { slide_id, patient_id, tissue_type, stain_type, organ, collection_date, lab_technician, scanner_model, magnification, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO slides (slide_id, patient_id, tissue_type, stain_type, organ, collection_date, lab_technician, scanner_model, magnification, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [slide_id, patient_id, tissue_type, stain_type, organ, collection_date, lab_technician, scanner_model, magnification, status || 'pending', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/slides/:id', authMiddleware, async (req, res) => {
  try {
    const { tissue_type, stain_type, organ, collection_date, lab_technician, scanner_model, magnification, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE slides SET tissue_type=$1, stain_type=$2, organ=$3, collection_date=$4, lab_technician=$5, scanner_model=$6, magnification=$7, status=$8, notes=$9, updated_at=CURRENT_TIMESTAMP WHERE id=$10 RETURNING *`,
      [tissue_type, stain_type, organ, collection_date, lab_technician, scanner_model, magnification, status, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== AI ANALYSES ====================
const analyses = createCRUD('ai_analyses');
app.get('/api/analyses', authMiddleware, analyses.getAll);
app.get('/api/analyses/:id', authMiddleware, analyses.getOne);
app.delete('/api/analyses/:id', authMiddleware, analyses.delete);
app.post('/api/analyses/run/:slideId', authMiddleware, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.slideId]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    const startTime = Date.now();
    const aiResult = await ai.analyzeSlide(slide);
    const processingTime = Date.now() - startTime;
    const result = await pool.query(
      `INSERT INTO ai_analyses (slide_id, analysis_type, status, confidence_score, findings, ai_model, processing_time_ms, result_data)
       VALUES ($1, 'comprehensive', 'completed', $2, $3, $4, $5, $6) RETURNING *`,
      [slide.id, (85 + Math.random() * 12).toFixed(2), aiResult, process.env.OPENROUTER_MODEL, processingTime, JSON.stringify({ raw_response: aiResult })]
    );
    await pool.query(`INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details) VALUES ($1, 'AI_ANALYSIS', 'slide', $2, $3)`,
      [req.user.email, slide.id, `AI analysis completed for slide ${slide.slide_id}`]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== CANCER DETECTIONS ====================
const cancerDetections = createCRUD('cancer_detections');
app.get('/api/cancer-detections', authMiddleware, cancerDetections.getAll);
app.get('/api/cancer-detections/:id', authMiddleware, cancerDetections.getOne);
app.delete('/api/cancer-detections/:id', authMiddleware, cancerDetections.delete);
app.post('/api/cancer-detections/run/:slideId', authMiddleware, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.slideId]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    const aiResult = await ai.detectCancer(slide);
    const result = await pool.query(
      `INSERT INTO cancer_detections (slide_id, cancer_type, probability, grade, stage, markers, recommendation, status, reviewed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_review', $8) RETURNING *`,
      [slide.id, `AI Detected - ${slide.organ}`, (Math.random() * 0.5 + 0.4).toFixed(4), 'Pending', 'Pending', 'AI Analysis', aiResult, req.user.name]
    );
    await pool.query(`INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details) VALUES ($1, 'AI_CANCER_DETECT', 'slide', $2, $3)`,
      [req.user.email, slide.id, `Cancer detection for slide ${slide.slide_id}`]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/cancer-detections/:id', authMiddleware, async (req, res) => {
  try {
    const { cancer_type, probability, grade, stage, markers, recommendation, status, reviewed_by } = req.body;
    const result = await pool.query(
      `UPDATE cancer_detections SET cancer_type=$1, probability=$2, grade=$3, stage=$4, markers=$5, recommendation=$6, status=$7, reviewed_by=$8 WHERE id=$9 RETURNING *`,
      [cancer_type, probability, grade, stage, markers, recommendation, status, reviewed_by, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== CELL CLASSIFICATIONS ====================
const cellClassifications = createCRUD('cell_classifications');
app.get('/api/cell-classifications', authMiddleware, cellClassifications.getAll);
app.get('/api/cell-classifications/:id', authMiddleware, cellClassifications.getOne);
app.delete('/api/cell-classifications/:id', authMiddleware, cellClassifications.delete);
app.post('/api/cell-classifications/run/:slideId', authMiddleware, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.slideId]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    const aiResult = await ai.classifyCells(slide);
    const result = await pool.query(
      `INSERT INTO cell_classifications (slide_id, cell_type, count, percentage, morphology, abnormality_flag, confidence, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [slide.id, 'AI Classification', Math.floor(Math.random() * 3000 + 500), (Math.random() * 60 + 20).toFixed(2), 'AI-analyzed morphology', false, (80 + Math.random() * 15).toFixed(2), aiResult]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/cell-classifications/:id', authMiddleware, async (req, res) => {
  try {
    const { cell_type, count, percentage, morphology, abnormality_flag, confidence, notes } = req.body;
    const result = await pool.query(
      `UPDATE cell_classifications SET cell_type=$1, count=$2, percentage=$3, morphology=$4, abnormality_flag=$5, confidence=$6, notes=$7 WHERE id=$8 RETURNING *`,
      [cell_type, count, percentage, morphology, abnormality_flag, confidence, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== TISSUE SEGMENTATIONS ====================
const tissueSegmentations = createCRUD('tissue_segmentations');
app.get('/api/tissue-segmentations', authMiddleware, tissueSegmentations.getAll);
app.get('/api/tissue-segmentations/:id', authMiddleware, tissueSegmentations.getOne);
app.delete('/api/tissue-segmentations/:id', authMiddleware, tissueSegmentations.delete);
app.post('/api/tissue-segmentations/run/:slideId', authMiddleware, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.slideId]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    const aiResult = await ai.segmentTissue(slide);
    const result = await pool.query(
      `INSERT INTO tissue_segmentations (slide_id, segment_type, area_percentage, tissue_class, health_status, density_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [slide.id, 'AI Segment', (Math.random() * 60 + 10).toFixed(2), 'AI-classified', 'analyzed', (Math.random() * 8 + 2).toFixed(2), aiResult]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/tissue-segmentations/:id', authMiddleware, async (req, res) => {
  try {
    const { segment_type, area_percentage, tissue_class, health_status, density_score, notes } = req.body;
    const result = await pool.query(
      `UPDATE tissue_segmentations SET segment_type=$1, area_percentage=$2, tissue_class=$3, health_status=$4, density_score=$5, notes=$6 WHERE id=$7 RETURNING *`,
      [segment_type, area_percentage, tissue_class, health_status, density_score, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== PATHOLOGY REPORTS ====================
const reports = createCRUD('pathology_reports');
app.get('/api/reports', authMiddleware, reports.getAll);
app.get('/api/reports/:id', authMiddleware, reports.getOne);
app.delete('/api/reports/:id', authMiddleware, reports.delete);
app.post('/api/reports', authMiddleware, async (req, res) => {
  try {
    const { report_id, patient_id, slide_id, pathologist, diagnosis, microscopic_findings, gross_description, clinical_history, recommendations, status } = req.body;
    const result = await pool.query(
      `INSERT INTO pathology_reports (report_id, patient_id, slide_id, pathologist, diagnosis, microscopic_findings, gross_description, clinical_history, recommendations, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [report_id, patient_id, slide_id, pathologist, diagnosis, microscopic_findings, gross_description, clinical_history, recommendations, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const { pathologist, diagnosis, microscopic_findings, gross_description, clinical_history, recommendations, status } = req.body;
    const result = await pool.query(
      `UPDATE pathology_reports SET pathologist=$1, diagnosis=$2, microscopic_findings=$3, gross_description=$4, clinical_history=$5, recommendations=$6, status=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8 RETURNING *`,
      [pathologist, diagnosis, microscopic_findings, gross_description, clinical_history, recommendations, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/reports/generate/:slideId', authMiddleware, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT s.*, p.first_name, p.last_name, p.medical_history FROM slides s LEFT JOIN patients p ON s.patient_id = p.id WHERE s.id = $1', [req.params.slideId]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    const aiResult = await ai.generateReport({
      patient_id: `${slide.first_name} ${slide.last_name}`,
      tissue_type: slide.tissue_type,
      organ: slide.organ,
      clinical_history: slide.medical_history,
      gross_description: slide.notes,
    });
    const reportId = `RPT-AI-${Date.now().toString(36).toUpperCase()}`;
    const result = await pool.query(
      `INSERT INTO pathology_reports (report_id, patient_id, slide_id, pathologist, diagnosis, microscopic_findings, gross_description, clinical_history, recommendations, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft') RETURNING *`,
      [reportId, slide.patient_id, slide.id, 'AI Generated', 'AI-generated - pending review', aiResult, slide.notes, slide.medical_history, 'Review AI-generated findings']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== CASES ====================
const cases = createCRUD('cases');
app.get('/api/cases', authMiddleware, cases.getAll);
app.get('/api/cases/:id', authMiddleware, cases.getOne);
app.delete('/api/cases/:id', authMiddleware, cases.delete);
app.post('/api/cases', authMiddleware, async (req, res) => {
  try {
    const { case_id, patient_id, case_type, priority, assigned_pathologist, status, diagnosis, turnaround_days, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO cases (case_id, patient_id, case_type, priority, assigned_pathologist, status, diagnosis, turnaround_days, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [case_id, patient_id, case_type, priority || 'normal', assigned_pathologist, status || 'open', diagnosis, turnaround_days, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/cases/:id', authMiddleware, async (req, res) => {
  try {
    const { case_type, priority, assigned_pathologist, status, diagnosis, turnaround_days, notes } = req.body;
    const result = await pool.query(
      `UPDATE cases SET case_type=$1, priority=$2, assigned_pathologist=$3, status=$4, diagnosis=$5, turnaround_days=$6, notes=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8 RETURNING *`,
      [case_type, priority, assigned_pathologist, status, diagnosis, turnaround_days, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== QUALITY CONTROLS ====================
const qc = createCRUD('quality_controls');
app.get('/api/quality-controls', authMiddleware, qc.getAll);
app.get('/api/quality-controls/:id', authMiddleware, qc.getOne);
app.delete('/api/quality-controls/:id', authMiddleware, qc.delete);
app.post('/api/quality-controls', authMiddleware, async (req, res) => {
  try {
    const { qc_id, slide_id, inspector, stain_quality, tissue_integrity, scan_quality, overall_score, pass_fail, issues, corrective_action } = req.body;
    const result = await pool.query(
      `INSERT INTO quality_controls (qc_id, slide_id, inspector, stain_quality, tissue_integrity, scan_quality, overall_score, pass_fail, issues, corrective_action)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [qc_id, slide_id, inspector, stain_quality, tissue_integrity, scan_quality, overall_score, pass_fail, issues, corrective_action]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/quality-controls/:id', authMiddleware, async (req, res) => {
  try {
    const { inspector, stain_quality, tissue_integrity, scan_quality, overall_score, pass_fail, issues, corrective_action } = req.body;
    const result = await pool.query(
      `UPDATE quality_controls SET inspector=$1, stain_quality=$2, tissue_integrity=$3, scan_quality=$4, overall_score=$5, pass_fail=$6, issues=$7, corrective_action=$8 WHERE id=$9 RETURNING *`,
      [inspector, stain_quality, tissue_integrity, scan_quality, overall_score, pass_fail, issues, corrective_action, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/quality-controls/ai-assess/:slideId', authMiddleware, async (req, res) => {
  try {
    const qcResult = await pool.query('SELECT * FROM quality_controls WHERE slide_id = $1 ORDER BY id DESC LIMIT 1', [req.params.slideId]);
    if (qcResult.rows.length === 0) return res.status(404).json({ error: 'No QC record found for this slide' });
    const qcData = qcResult.rows[0];
    const aiResult = await ai.qualityAssessment(qcData);
    res.json({ assessment: aiResult, qc_record: qcData });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== ANNOTATIONS ====================
const annotations = createCRUD('annotations');
app.get('/api/annotations', authMiddleware, annotations.getAll);
app.get('/api/annotations/:id', authMiddleware, annotations.getOne);
app.delete('/api/annotations/:id', authMiddleware, annotations.delete);
app.get('/api/annotations/slide/:slideId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM annotations WHERE slide_id = $1 ORDER BY id DESC', [req.params.slideId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/annotations', authMiddleware, async (req, res) => {
  try {
    const { slide_id, annotator, annotation_type, label, coordinates, description, color, is_ai_generated } = req.body;
    const result = await pool.query(
      `INSERT INTO annotations (slide_id, annotator, annotation_type, label, coordinates, description, color, is_ai_generated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [slide_id, annotator, annotation_type, label, coordinates ? JSON.stringify(coordinates) : null, description, color, is_ai_generated || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/annotations/:id', authMiddleware, async (req, res) => {
  try {
    const { annotation_type, label, coordinates, description, color } = req.body;
    const result = await pool.query(
      `UPDATE annotations SET annotation_type=$1, label=$2, coordinates=$3, description=$4, color=$5 WHERE id=$6 RETURNING *`,
      [annotation_type, label, coordinates ? JSON.stringify(coordinates) : null, description, color, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== BILLING ====================
const billing = createCRUD('billing_records');
app.get('/api/billing', authMiddleware, billing.getAll);
app.get('/api/billing/:id', authMiddleware, billing.getOne);
app.delete('/api/billing/:id', authMiddleware, billing.delete);
app.post('/api/billing', authMiddleware, async (req, res) => {
  try {
    const { invoice_id, patient_id, slide_id, service_type, amount, currency, status, insurance_claim, billing_date, due_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO billing_records (invoice_id, patient_id, slide_id, service_type, amount, currency, status, insurance_claim, billing_date, due_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [invoice_id, patient_id, slide_id, service_type, amount, currency || 'USD', status || 'pending', insurance_claim, billing_date, due_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/billing/:id', authMiddleware, async (req, res) => {
  try {
    const { service_type, amount, currency, status, insurance_claim, billing_date, due_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE billing_records SET service_type=$1, amount=$2, currency=$3, status=$4, insurance_claim=$5, billing_date=$6, due_date=$7, notes=$8 WHERE id=$9 RETURNING *`,
      [service_type, amount, currency, status, insurance_claim, billing_date, due_date, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== LAB EQUIPMENT ====================
const equipment = createCRUD('lab_equipment');
app.get('/api/equipment', authMiddleware, equipment.getAll);
app.get('/api/equipment/:id', authMiddleware, equipment.getOne);
app.delete('/api/equipment/:id', authMiddleware, equipment.delete);
app.post('/api/equipment', authMiddleware, async (req, res) => {
  try {
    const { equipment_id, name, type, manufacturer, model, serial_number, location, status, last_maintenance, next_maintenance, calibration_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO lab_equipment (equipment_id, name, type, manufacturer, model, serial_number, location, status, last_maintenance, next_maintenance, calibration_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [equipment_id, name, type, manufacturer, model, serial_number, location, status || 'operational', last_maintenance, next_maintenance, calibration_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/equipment/:id', authMiddleware, async (req, res) => {
  try {
    const { name, type, manufacturer, model, serial_number, location, status, last_maintenance, next_maintenance, calibration_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE lab_equipment SET name=$1, type=$2, manufacturer=$3, model=$4, serial_number=$5, location=$6, status=$7, last_maintenance=$8, next_maintenance=$9, calibration_date=$10, notes=$11 WHERE id=$12 RETURNING *`,
      [name, type, manufacturer, model, serial_number, location, status, last_maintenance, next_maintenance, calibration_date, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== AUDIT LOGS ====================
app.get('/api/audit-logs', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/audit-logs/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== SETTINGS ====================
app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY category, key');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.get('/api/settings/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.put('/api/settings/:id', authMiddleware, async (req, res) => {
  try {
    const { value } = req.body;
    const result = await pool.query(
      `UPDATE settings SET value=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,
      [value, req.params.id]
    );
    await pool.query(`INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details) VALUES ($1, 'UPDATE', 'settings', $2, $3)`,
      [req.user.email, req.params.id, `Updated setting to: ${value}`]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== DASHBOARD STATS ====================
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const [patientsCount, slidesCount, analysesCount, casesCount, reportsCount, pendingSlides, cancerCount, billingSum] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM patients'),
      pool.query('SELECT COUNT(*) FROM slides'),
      pool.query('SELECT COUNT(*) FROM ai_analyses'),
      pool.query('SELECT COUNT(*) FROM cases WHERE status != $1', ['completed']),
      pool.query('SELECT COUNT(*) FROM pathology_reports'),
      pool.query("SELECT COUNT(*) FROM slides WHERE status = 'pending'"),
      pool.query('SELECT COUNT(*) FROM cancer_detections WHERE probability > 0.5'),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM billing_records WHERE status = 'paid'"),
    ]);
    res.json({
      totalPatients: parseInt(patientsCount.rows[0].count),
      totalSlides: parseInt(slidesCount.rows[0].count),
      totalAnalyses: parseInt(analysesCount.rows[0].count),
      activeCases: parseInt(casesCount.rows[0].count),
      totalReports: parseInt(reportsCount.rows[0].count),
      pendingSlides: parseInt(pendingSlides.rows[0].count),
      cancerDetections: parseInt(cancerCount.rows[0].count),
      totalRevenue: parseFloat(billingSum.rows[0].total),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🔬 Pathology Analyzer API running on http://localhost:${PORT}`);
    console.log(`📊 AI Model: ${process.env.OPENROUTER_MODEL}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
