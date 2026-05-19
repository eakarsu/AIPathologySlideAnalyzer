// Custom Views — 4 endpoints for pathology slide analysis
//   VIZ 1:    GET  /api/custom-views/cell-distribution
//   VIZ 2:    GET  /api/custom-views/tissue-heatmap
//   NON-VIZ 1: GET  /api/custom-views/report-pdf/:slideId
//   NON-VIZ 2: full CRUD /api/custom-views/diagnostic-rules
const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');

const router = express.Router();

// ── lightweight JWT auth, mirrors host server ────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (_) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── ensure diagnostic_rules table exists ─────────────────────────────────────
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS diagnostic_rules (
        id SERIAL PRIMARY KEY,
        tissue_type VARCHAR(100) NOT NULL,
        criterion VARCHAR(200) NOT NULL,
        threshold VARCHAR(120),
        severity VARCHAR(40) DEFAULT 'medium',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM diagnostic_rules');
    if (rows[0].c === 0) {
      await pool.query(`
        INSERT INTO diagnostic_rules (tissue_type, criterion, threshold, severity, notes) VALUES
        ('Breast','Nuclear pleomorphism','>3 score','high','Bloom-Richardson grading'),
        ('Breast','Mitotic count','>10/10 HPF','high','Per 10 high-power fields'),
        ('Colon','Glandular architecture distortion','>30%','medium','Tubular vs villous'),
        ('Lung','Necrosis percentage','>20%','high','Indicator of high-grade tumour'),
        ('Prostate','Gleason pattern','>=4','high','Combined score 7+'),
        ('Skin','Breslow thickness','>1mm','medium','Melanoma depth'),
        ('Liver','Steatosis percentage','>33%','medium','Macrovesicular'),
        ('Thyroid','Capsular invasion','present','high','Follicular carcinoma marker')
      `);
    }
  } catch (e) { console.warn('diagnostic_rules ensure failed:', e.message); }
})();

// ──────────────────────────────────────────────────────────────────────────────
// VIZ 1 — cell count distribution chart data
// GET /api/custom-views/cell-distribution
// returns { labels:[], counts:[], percentages:[], total }
// ──────────────────────────────────────────────────────────────────────────────
router.get('/cell-distribution', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cell_type,
             COALESCE(SUM(count),0)::int AS total_count,
             COALESCE(AVG(percentage),0)::float AS avg_pct,
             COUNT(*)::int AS samples
      FROM cell_classifications
      GROUP BY cell_type
      ORDER BY total_count DESC
      LIMIT 12
    `);
    const labels = result.rows.map(r => r.cell_type);
    const counts = result.rows.map(r => r.total_count);
    const percentages = result.rows.map(r => Math.round(r.avg_pct * 100) / 100);
    const samples = result.rows.map(r => r.samples);
    const total = counts.reduce((a, b) => a + b, 0);
    res.json({ ok: true, labels, counts, percentages, samples, total, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// VIZ 2 — tissue region heatmap grid
// GET /api/custom-views/tissue-heatmap
// returns { tissues:[], statuses:[], matrix: number[][] }
// ──────────────────────────────────────────────────────────────────────────────
router.get('/tissue-heatmap', auth, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT COALESCE(tissue_class,'unclassified') AS tissue_class,
             COALESCE(health_status,'unknown')      AS health_status,
             COUNT(*)::int                          AS n,
             COALESCE(AVG(area_percentage),0)::float AS avg_area,
             COALESCE(AVG(density_score),0)::float   AS avg_density
      FROM tissue_segmentations
      GROUP BY tissue_class, health_status
    `);
    const tissues = Array.from(new Set(r.rows.map(x => x.tissue_class))).sort();
    const statuses = Array.from(new Set(r.rows.map(x => x.health_status))).sort();
    const lookup = new Map();
    r.rows.forEach(x => lookup.set(`${x.tissue_class}__${x.health_status}`, x));
    const matrix = tissues.map(t => statuses.map(s => {
      const cell = lookup.get(`${t}__${s}`);
      if (!cell) return { count: 0, area: 0, density: 0 };
      return {
        count: cell.n,
        area: Math.round(cell.avg_area * 100) / 100,
        density: Math.round(cell.avg_density * 100) / 100,
      };
    }));
    res.json({ ok: true, tissues, statuses, matrix, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// NON-VIZ 1 — pathology report as text/PDF-like document
// GET /api/custom-views/report-pdf/:slideId
//   ?format=pdf  → application/pdf bytes (simple PDF, no libs)
//   default      → application/json {report_text, ...}
// ──────────────────────────────────────────────────────────────────────────────
router.get('/report-pdf/:slideId', auth, async (req, res) => {
  try {
    const slideId = parseInt(req.params.slideId, 10);
    if (!slideId) return res.status(400).json({ error: 'Invalid slideId' });

    const slideQ = await pool.query(
      `SELECT s.*, p.first_name, p.last_name, p.patient_id AS patient_code, p.date_of_birth
       FROM slides s LEFT JOIN patients p ON s.patient_id = p.id
       WHERE s.id = $1`,
      [slideId]
    );
    if (slideQ.rows.length === 0) return res.status(404).json({ error: 'Slide not found' });
    const slide = slideQ.rows[0];

    const cellsQ = await pool.query(
      'SELECT cell_type, count, percentage FROM cell_classifications WHERE slide_id=$1 ORDER BY count DESC LIMIT 20',
      [slideId]
    );
    const tissueQ = await pool.query(
      'SELECT segment_type, tissue_class, health_status, area_percentage FROM tissue_segmentations WHERE slide_id=$1',
      [slideId]
    );
    const reportsQ = await pool.query(
      'SELECT report_id, diagnosis, microscopic_findings, recommendations, status, pathologist, created_at FROM pathology_reports WHERE slide_id=$1 ORDER BY created_at DESC LIMIT 1',
      [slideId]
    );
    const cancerQ = await pool.query(
      'SELECT cancer_type, probability, grade, stage, recommendation FROM cancer_detections WHERE slide_id=$1 ORDER BY id DESC LIMIT 1',
      [slideId]
    );

    const reportRow = reportsQ.rows[0] || {};
    const cancer = cancerQ.rows[0] || {};

    const lines = [];
    lines.push(`PATHOLOGY REPORT  -  ${reportRow.report_id || `RPT-${slide.id}`}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push(`Patient: ${slide.first_name || ''} ${slide.last_name || ''} (${slide.patient_code || 'unknown'})`);
    lines.push(`DOB: ${slide.date_of_birth || 'n/a'}`);
    lines.push(`Slide: ${slide.slide_id}   Organ: ${slide.organ || 'n/a'}   Tissue: ${slide.tissue_type || 'n/a'}`);
    lines.push(`Stain: ${slide.stain_type || 'n/a'}   Magnification: ${slide.magnification || 'n/a'}`);
    lines.push(`Pathologist: ${reportRow.pathologist || 'pending assignment'}`);
    lines.push(`Status: ${reportRow.status || slide.status || 'pending'}`);
    lines.push('');
    lines.push('--- DIAGNOSIS ---');
    lines.push((reportRow.diagnosis || 'No diagnosis recorded yet.').slice(0, 1200));
    lines.push('');
    lines.push('--- MICROSCOPIC FINDINGS ---');
    lines.push((reportRow.microscopic_findings || 'Pending microscopic review.').slice(0, 1200));
    lines.push('');
    lines.push('--- CANCER DETECTION ---');
    if (cancer.cancer_type) {
      lines.push(`Type: ${cancer.cancer_type}   Probability: ${cancer.probability}   Grade: ${cancer.grade || 'n/a'}   Stage: ${cancer.stage || 'n/a'}`);
      lines.push(`Recommendation: ${(cancer.recommendation || '').slice(0, 600)}`);
    } else {
      lines.push('No cancer detection record on file.');
    }
    lines.push('');
    lines.push('--- CELL CLASSIFICATIONS (top) ---');
    cellsQ.rows.forEach(c => lines.push(`  - ${c.cell_type}: count=${c.count}, pct=${c.percentage}`));
    if (!cellsQ.rows.length) lines.push('  (none)');
    lines.push('');
    lines.push('--- TISSUE SEGMENTATIONS ---');
    tissueQ.rows.forEach(t => lines.push(`  - ${t.segment_type} [${t.tissue_class}] status=${t.health_status} area=${t.area_percentage}%`));
    if (!tissueQ.rows.length) lines.push('  (none)');
    lines.push('');
    lines.push('--- RECOMMENDATIONS ---');
    lines.push((reportRow.recommendations || 'Continue clinical correlation. Re-review at next case conference.').slice(0, 800));
    lines.push('');
    lines.push('-- END OF REPORT --');

    const reportText = lines.join('\n');
    const format = (req.query.format || '').toLowerCase();

    if (format === 'pdf') {
      // Minimal hand-rolled single-page PDF — no external deps.
      const pdfLines = lines.map(escapePdfString);
      let stream = 'BT\n/F1 10 Tf\n50 760 Td\n12 TL\n';
      pdfLines.forEach((l, i) => {
        if (i === 0) stream += `(${l}) Tj\n`;
        else stream += `T* (${l}) Tj\n`;
      });
      stream += 'ET';
      const objects = [];
      objects.push('<< /Type /Catalog /Pages 2 0 R >>');
      objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
      objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>');
      objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
      objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
      let pdf = '%PDF-1.4\n';
      const offsets = [];
      objects.forEach((o, idx) => {
        offsets.push(Buffer.byteLength(pdf));
        pdf += `${idx + 1} 0 obj\n${o}\nendobj\n`;
      });
      const xrefOffset = Buffer.byteLength(pdf);
      pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      offsets.forEach(off => { pdf += String(off).padStart(10, '0') + ' 00000 n \n'; });
      pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="report-slide-${slideId}.pdf"`);
      return res.send(Buffer.from(pdf, 'binary'));
    }

    res.json({
      ok: true,
      slide_id: slideId,
      report_id: reportRow.report_id || null,
      report_text: reportText,
      sections: {
        diagnosis: reportRow.diagnosis || null,
        microscopic_findings: reportRow.microscopic_findings || null,
        recommendations: reportRow.recommendations || null,
        cancer: cancer || null,
        cells: cellsQ.rows,
        tissues: tissueQ.rows,
      },
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function escapePdfString(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

// ──────────────────────────────────────────────────────────────────────────────
// NON-VIZ 2 — diagnostic criteria rules editor (CRUD per tissue type)
// GET    /api/custom-views/diagnostic-rules            ?tissue=Breast
// POST   /api/custom-views/diagnostic-rules
// PUT    /api/custom-views/diagnostic-rules/:id
// DELETE /api/custom-views/diagnostic-rules/:id
// ──────────────────────────────────────────────────────────────────────────────
router.get('/diagnostic-rules', auth, async (req, res) => {
  try {
    const { tissue } = req.query;
    const result = tissue
      ? await pool.query('SELECT * FROM diagnostic_rules WHERE tissue_type=$1 ORDER BY id DESC', [tissue])
      : await pool.query('SELECT * FROM diagnostic_rules ORDER BY tissue_type ASC, id DESC');
    const grouped = {};
    result.rows.forEach(r => {
      grouped[r.tissue_type] = grouped[r.tissue_type] || [];
      grouped[r.tissue_type].push(r);
    });
    res.json({ ok: true, rules: result.rows, grouped, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/diagnostic-rules', auth, async (req, res) => {
  try {
    const { tissue_type, criterion, threshold, severity, notes } = req.body || {};
    if (!tissue_type || !criterion) return res.status(400).json({ error: 'tissue_type and criterion are required' });
    const result = await pool.query(
      `INSERT INTO diagnostic_rules (tissue_type, criterion, threshold, severity, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tissue_type, criterion, threshold || null, severity || 'medium', notes || null]
    );
    res.status(201).json({ ok: true, rule: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/diagnostic-rules/:id', auth, async (req, res) => {
  try {
    const { tissue_type, criterion, threshold, severity, notes } = req.body || {};
    const result = await pool.query(
      `UPDATE diagnostic_rules
         SET tissue_type=COALESCE($1,tissue_type),
             criterion  =COALESCE($2,criterion),
             threshold  =COALESCE($3,threshold),
             severity   =COALESCE($4,severity),
             notes      =COALESCE($5,notes),
             updated_at =CURRENT_TIMESTAMP
       WHERE id=$6 RETURNING *`,
      [tissue_type, criterion, threshold, severity, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json({ ok: true, rule: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/diagnostic-rules/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM diagnostic_rules WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json({ ok: true, deleted: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── health ──────────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => res.json({ ok: true, scope: 'custom-views', ts: Date.now() }));

module.exports = router;
