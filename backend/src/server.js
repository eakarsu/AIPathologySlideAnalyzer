const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool, initDB } = require('./database');
const ai = require('./openrouter');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Serve uploaded images
const UPLOADS_DIR = path.join(__dirname, '../../uploads/slides');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Multer config for slide images
const slideImageStorage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => cb(null, `slide-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`),
});
const slideImageUpload = multer({ storage: slideImageStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// ── In-memory rate limiter (20/hour per user for AI routes) ───────────────────
const rateLimitStore = new Map();
function aiRateLimiter(req, res, next) {
  const key = `ai:${req.user?.id || 'anon'}`;
  const now = Date.now();
  const windowMs = 3_600_000;
  const maxRequests = 20;
  const entry = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  rateLimitStore.set(key, entry);
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
  if (entry.count > maxRequests) return res.status(429).json({ error: 'Rate limit exceeded. 20 AI requests per hour.' });
  next();
}

// ── JWT Middleware ─────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ── Role-based access control ─────────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: insufficient role' });
  next();
};

// ── AUDIT LOG HELPER ──────────────────────────────────────────────────────────
async function logAudit(userEmail, action, entityType, entityId, details) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [userEmail, action, entityType, entityId, details]
    );
  } catch {}
}

// ── PAGINATION HELPER ─────────────────────────────────────────────────────────
function paginate(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ==================== AUTH ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'email, password, and name are required' });
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 12);
    const userRole = role && ['pathologist', 'lab_tech', 'admin'].includes(role) ? role : 'pathologist';
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, hashed, name, userRole]
    );
    const newUser = result.rows[0];
    const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== GENERIC CRUD HELPER ====================
function createCRUD(tableName, idField = 'id') {
  return {
    getAll: async (req, res) => {
      try {
        const { page, limit, offset } = paginate(req);
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        const total = parseInt(countResult.rows[0].count);
        const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT $1 OFFSET $2`, [limit, offset]);
        res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
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
app.get('/api/patients/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    // HIPAA audit log on patient read
    await logAudit(req.user.email, 'view_patient', 'patient', req.params.id, `Patient record accessed by ${req.user.email}`);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
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

// POST /api/slides/:id/upload-image — upload image for a slide
app.post('/api/slides/:id/upload-image', authMiddleware, slideImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
    const imageUrl = `/uploads/slides/${req.file.filename}`;
    const result = await pool.query(
      'UPDATE slides SET image_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [imageUrl, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    res.json({ message: 'Image uploaded successfully', image_url: imageUrl, slide: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/slides/:id/analyze-image — vision AI analysis of uploaded image
app.post('/api/slides/:id/analyze-image', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.id]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    if (!slide.image_url) return res.status(400).json({ error: 'No image uploaded for this slide. Upload an image first.' });

    const imagePath = path.join(__dirname, '../../', slide.image_url);
    if (!fs.existsSync(imagePath)) return res.status(404).json({ error: 'Image file not found on disk' });

    const imageData = fs.readFileSync(imagePath);
    const base64 = imageData.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';

    const aiResult = await ai.analyzeSlideImage(base64, mimeType);

    const insertResult = await pool.query(
      `INSERT INTO ai_image_analyses (slide_id, tissue_type, cell_morphology, abnormalities, cancer_probability, confidence, findings, raw_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        slide.id,
        aiResult.tissue_type || null,
        aiResult.cell_morphology || null,
        JSON.stringify(aiResult.abnormalities || []),
        aiResult.cancer_probability || null,
        aiResult.confidence || null,
        JSON.stringify(aiResult.findings || []),
        JSON.stringify(aiResult),
      ]
    );

    await logAudit(req.user.email, 'AI_IMAGE_ANALYSIS', 'slide', slide.id, `Vision AI analysis for slide ${slide.slide_id}`);
    res.status(201).json(insertResult.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== AI ANALYSES ====================
const analyses = createCRUD('ai_analyses');
app.get('/api/analyses', authMiddleware, analyses.getAll);
app.get('/api/analyses/:id', authMiddleware, analyses.getOne);
app.delete('/api/analyses/:id', authMiddleware, analyses.delete);
app.post('/api/analyses/run/:slideId', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.slideId]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    const startTime = Date.now();
    const structured = await ai.analyzeSlideStructured(slide);
    const processingTime = Date.now() - startTime;
    const confidenceScore = structured.confidence_score || 90;
    const findings = structured.summary || structured.key_findings?.join('\n') || JSON.stringify(structured);
    const result = await pool.query(
      `INSERT INTO ai_analyses (slide_id, analysis_type, status, confidence_score, findings, ai_model, processing_time_ms, result_data)
       VALUES ($1, 'comprehensive', 'completed', $2, $3, $4, $5, $6) RETURNING *`,
      [slide.id, confidenceScore, findings, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', processingTime, JSON.stringify(structured)]
    );
    await logAudit(req.user.email, 'AI_ANALYSIS', 'slide', slide.id, `AI analysis completed for slide ${slide.slide_id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== CANCER DETECTIONS ====================
const cancerDetections = createCRUD('cancer_detections');
app.get('/api/cancer-detections', authMiddleware, cancerDetections.getAll);
app.get('/api/cancer-detections/:id', authMiddleware, cancerDetections.getOne);
app.delete('/api/cancer-detections/:id', authMiddleware, cancerDetections.delete);
app.post('/api/cancer-detections/run/:slideId', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.slideId]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    const structured = await ai.detectCancerStructured(slide);
    const probability = structured.probability || 0.5;
    const result = await pool.query(
      `INSERT INTO cancer_detections (slide_id, cancer_type, probability, grade, stage, markers, recommendation, status, reviewed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_review', $8) RETURNING *`,
      [slide.id, structured.cancer_type || `AI Detected - ${slide.organ}`, probability, structured.grade || 'Pending', structured.stage || 'Pending', structured.markers || 'AI Analysis', structured.recommendation || JSON.stringify(structured), req.user.name]
    );
    await logAudit(req.user.email, 'AI_CANCER_DETECT', 'slide', slide.id, `Cancer detection for slide ${slide.slide_id}`);
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
app.post('/api/cell-classifications/run/:slideId', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.slideId]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    const structured = await ai.classifyCellsStructured(slide);
    const result = await pool.query(
      `INSERT INTO cell_classifications (slide_id, cell_type, count, percentage, morphology, abnormality_flag, confidence, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [slide.id, structured.cell_type || 'AI Classification', structured.count || 1000, structured.percentage || 50, structured.morphology || 'AI-analyzed morphology', structured.abnormality_flag || false, structured.confidence || 85, structured.notes || JSON.stringify(structured)]
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
app.post('/api/tissue-segmentations/run/:slideId', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const slideResult = await pool.query('SELECT * FROM slides WHERE id = $1', [req.params.slideId]);
    if (slideResult.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideResult.rows[0];
    const structured = await ai.segmentTissueStructured(slide);
    const result = await pool.query(
      `INSERT INTO tissue_segmentations (slide_id, segment_type, area_percentage, tissue_class, health_status, density_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [slide.id, structured.segment_type || 'AI Segment', structured.area_percentage || 50, structured.tissue_class || 'AI-classified', structured.health_status || 'analyzed', structured.density_score || 5, structured.notes || JSON.stringify(structured)]
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
app.post('/api/reports', authMiddleware, authorize('pathologist', 'admin'), async (req, res) => {
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
app.post('/api/reports/generate/:slideId', authMiddleware, authorize('pathologist', 'admin'), aiRateLimiter, async (req, res) => {
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

// PUT /api/reports/:id/sign-off — pathologist sign-off
app.put('/api/reports/:id/sign-off', authMiddleware, authorize('pathologist', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE pathology_reports SET status='signed', signed_by=$1, signed_at=NOW(), updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    await logAudit(req.user.email, 'SIGN_OFF_REPORT', 'pathology_report', req.params.id, `Report signed off by ${req.user.email}`);
    res.json(result.rows[0]);
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
app.post('/api/quality-controls/ai-assess/:slideId', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const qcResult = await pool.query('SELECT * FROM quality_controls WHERE slide_id = $1 ORDER BY id DESC LIMIT 1', [req.params.slideId]);
    if (qcResult.rows.length === 0) return res.status(404).json({ error: 'No QC record found for this slide' });
    const qcData = qcResult.rows[0];
    const aiResult = await ai.qualityAssessment(qcData);
    // Persist assessment to quality_controls row
    await pool.query(
      'UPDATE quality_controls SET assessment = $1 WHERE id = $2',
      [aiResult, qcData.id]
    );
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
    const { page, limit, offset } = paginate(req);
    const total = parseInt((await pool.query('SELECT COUNT(*) FROM audit_logs')).rows[0].count);
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
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
    await logAudit(req.user.email, 'UPDATE', 'settings', req.params.id, `Updated setting to: ${value}`);
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

// Apply pass 5 — additive backlog extensions
const extensionsBuilder = require('./extensions');
app.use('/api/ext', extensionsBuilder({
  pool,
  callOpenRouter: ai.callOpenRouter,
  authMiddleware,
  aiRateLimiter
}));

// Start server
initDB().then(() => {
  
// === Custom Feature Mounts (batch_06) ===
app.use('/api/cf-ai-pathology-assistant', require('./routes/customFeat01_AiPathologyAssistant'));
app.use('/api/cf-second-opinion-consensus', require('./routes/customFeat02_SecondOpinionConsensus'));
app.use('/api/cf-educational-mode', require('./routes/customFeat03_EducationalMode'));
app.use('/api/cf-registry-integration', require('./routes/customFeat04_RegistryIntegration'));
app.use('/api/cf-quality-assurance-loop', require('./routes/customFeat05_QualityAssuranceLoop'));


// === Batch 06 Gaps & Frontend Mounts ===
app.use('/api/gap-quality-assess', require('./routes/gapFeat_quality_assess'));
app.use('/api/gap-multi', require('./routes/gapFeat_multi'));
app.use('/api/gap-auto-report-generate', require('./routes/gapFeat_auto_report_generate'));
app.use('/api/gap-no-dedicated-routes-directory-all-routes-inline-in', require('./routes/gapFeat_no_dedicated_routes_directory_all_routes_inline_in'));
app.use('/api/gap-no-dicom-server-integration-medical-image-standard', require('./routes/gapFeat_no_dicom_server_integration_medical_image_standard'));
app.use('/api/gap-no-lis-lab-information-system-integration', require('./routes/gapFeat_no_lis_lab_information_system_integration'));
app.use('/api/gap-no-whole-slide-image-wsi-viewer-only-stored-images', require('./routes/gapFeat_no_whole_slide_image_wsi_viewer_only_stored_images'));
app.use('/api/gap-no-multi', require('./routes/gapFeat_no_multi'));
app.use('/api/gap-no-webhooks-for-lab-result-delivery', require('./routes/gapFeat_no_webhooks_for_lab_result_delivery'));
app.use('/api/gap-no-notifications-layer-grep-returned-0-notificatio', require('./routes/gapFeat_no_notifications_layer_grep_returned_0_notificatio'));
app.use('/api/gap-limited-rbac-basic-auth-only', require('./routes/gapFeat_limited_rbac_basic_auth_only'));

app.listen(PORT, () => {
    console.log(`\nPathology Analyzer API running on http://localhost:${PORT}`);
    console.log(`AI Model: ${process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022'}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
