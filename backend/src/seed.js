const { pool, initDB } = require('./database');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await initDB();
    const client = await pool.connect();

    try {
      // Clear existing data
      await client.query(`
        TRUNCATE users, patients, slides, ai_analyses, cancer_detections,
        cell_classifications, tissue_segmentations, pathology_reports, cases,
        quality_controls, annotations, billing_records, lab_equipment,
        audit_logs, settings CASCADE;
      `);

      // Seed Users
      const hashedPassword = await bcrypt.hash('password123', 10);
      await client.query(`
        INSERT INTO users (email, password, name, role) VALUES
        ('admin@pathlab.com', $1, 'Dr. Sarah Chen', 'admin'),
        ('pathologist@pathlab.com', $1, 'Dr. James Wilson', 'pathologist'),
        ('technician@pathlab.com', $1, 'Emily Parker', 'technician'),
        ('reviewer@pathlab.com', $1, 'Dr. Maria Rodriguez', 'reviewer')
      `, [hashedPassword]);
      console.log('✓ Users seeded');

      // Seed Patients (18 items)
      await client.query(`
        INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, gender, phone, email, address, medical_history, insurance_provider, status) VALUES
        ('PAT-001', 'John', 'Smith', '1965-03-15', 'Male', '555-0101', 'john.smith@email.com', '123 Oak St, Boston, MA', 'History of smoking, hypertension', 'BlueCross BlueShield', 'active'),
        ('PAT-002', 'Mary', 'Johnson', '1978-07-22', 'Female', '555-0102', 'mary.j@email.com', '456 Elm St, Cambridge, MA', 'Family history of breast cancer', 'Aetna', 'active'),
        ('PAT-003', 'Robert', 'Williams', '1952-11-08', 'Male', '555-0103', 'rwilliams@email.com', '789 Pine Ave, Salem, MA', 'Type 2 diabetes, previous colonoscopy', 'United Healthcare', 'active'),
        ('PAT-004', 'Linda', 'Brown', '1990-01-30', 'Female', '555-0104', 'lbrown@email.com', '321 Maple Dr, Worcester, MA', 'No significant history', 'Cigna', 'active'),
        ('PAT-005', 'Michael', 'Davis', '1945-06-17', 'Male', '555-0105', 'mdavis@email.com', '654 Cedar Ln, Springfield, MA', 'Prostate enlargement, COPD', 'Medicare', 'active'),
        ('PAT-006', 'Jennifer', 'Miller', '1983-09-25', 'Female', '555-0106', 'jmiller@email.com', '987 Birch Ct, Lowell, MA', 'Previous thyroid nodule biopsy', 'Harvard Pilgrim', 'active'),
        ('PAT-007', 'David', 'Wilson', '1970-04-12', 'Male', '555-0107', 'dwilson@email.com', '147 Walnut St, Quincy, MA', 'Chronic gastritis', 'Tufts Health Plan', 'active'),
        ('PAT-008', 'Patricia', 'Moore', '1988-12-03', 'Female', '555-0108', 'pmoore@email.com', '258 Ash Rd, Brockton, MA', 'Cervical dysplasia history', 'BlueCross BlueShield', 'active'),
        ('PAT-009', 'James', 'Taylor', '1955-08-19', 'Male', '555-0109', 'jtaylor@email.com', '369 Spruce Way, Fall River, MA', 'Liver cirrhosis, hepatitis C', 'MassHealth', 'active'),
        ('PAT-010', 'Barbara', 'Anderson', '1962-02-28', 'Female', '555-0110', 'banderson@email.com', '741 Poplar Blvd, New Bedford, MA', 'Breast lump detected on mammogram', 'Aetna', 'active'),
        ('PAT-011', 'Richard', 'Thomas', '1975-10-14', 'Male', '555-0111', 'rthomas@email.com', '852 Willow Pl, Framingham, MA', 'Melanoma removed 2019', 'United Healthcare', 'active'),
        ('PAT-012', 'Susan', 'Jackson', '1998-05-07', 'Female', '555-0112', 'sjackson@email.com', '963 Hickory Dr, Haverhill, MA', 'No significant history', 'Cigna', 'active'),
        ('PAT-013', 'Charles', 'White', '1948-03-21', 'Male', '555-0113', 'cwhite@email.com', '159 Chestnut Ave, Pittsfield, MA', 'Bladder cancer treated 2020', 'Medicare', 'active'),
        ('PAT-014', 'Karen', 'Harris', '1981-11-16', 'Female', '555-0114', 'kharris@email.com', '267 Sycamore Rd, Taunton, MA', 'Ovarian cyst history', 'Harvard Pilgrim', 'active'),
        ('PAT-015', 'Daniel', 'Martin', '1959-07-09', 'Male', '555-0115', 'dmartin@email.com', '378 Magnolia St, Revere, MA', 'Lung nodule under observation', 'Tufts Health Plan', 'active'),
        ('PAT-016', 'Nancy', 'Garcia', '1973-04-02', 'Female', '555-0116', 'ngarcia@email.com', '489 Dogwood Ln, Malden, MA', 'Endometrial polyps', 'BlueCross BlueShield', 'active'),
        ('PAT-017', 'Thomas', 'Martinez', '1967-09-30', 'Male', '555-0117', 'tmartinez@email.com', '591 Laurel Ct, Medford, MA', 'Colon polyps removed 2022', 'Aetna', 'active'),
        ('PAT-018', 'Lisa', 'Robinson', '1986-06-18', 'Female', '555-0118', 'lrobinson@email.com', '602 Juniper Way, Waltham, MA', 'Thyroid cancer family history', 'United Healthcare', 'active')
      `);
      console.log('✓ Patients seeded');

      // Seed Slides (20 items)
      await client.query(`
        INSERT INTO slides (slide_id, patient_id, tissue_type, stain_type, organ, collection_date, lab_technician, scanner_model, magnification, status, notes) VALUES
        ('SLD-001', 1, 'Epithelial', 'H&E', 'Lung', '2024-01-15', 'Emily Parker', 'Aperio AT2', '40x', 'analyzed', 'Right upper lobe biopsy'),
        ('SLD-002', 2, 'Glandular', 'H&E', 'Breast', '2024-01-16', 'Mark Chen', 'Leica SCN400', '20x', 'analyzed', 'Left breast core biopsy'),
        ('SLD-003', 3, 'Mucosal', 'H&E', 'Colon', '2024-01-17', 'Emily Parker', 'Hamamatsu NanoZoomer', '40x', 'analyzed', 'Sigmoid colon polyp'),
        ('SLD-004', 4, 'Connective', 'PAS', 'Kidney', '2024-01-18', 'Sarah Liu', 'Aperio AT2', '20x', 'pending', 'Renal biopsy for proteinuria workup'),
        ('SLD-005', 5, 'Glandular', 'H&E', 'Prostate', '2024-01-19', 'Mark Chen', 'Philips UFS', '40x', 'analyzed', 'TRUS-guided prostate biopsy'),
        ('SLD-006', 6, 'Epithelial', 'H&E', 'Thyroid', '2024-01-20', 'Emily Parker', 'Leica SCN400', '20x', 'analyzed', 'Thyroid FNA, Bethesda IV'),
        ('SLD-007', 7, 'Mucosal', 'H&E', 'Stomach', '2024-01-21', 'Sarah Liu', 'Aperio AT2', '40x', 'pending', 'Gastric antral biopsy'),
        ('SLD-008', 8, 'Epithelial', 'Pap', 'Cervix', '2024-01-22', 'Mark Chen', 'Hamamatsu NanoZoomer', '20x', 'analyzed', 'Cervical smear, ASCUS history'),
        ('SLD-009', 9, 'Hepatic', 'Trichrome', 'Liver', '2024-01-23', 'Emily Parker', 'Philips UFS', '40x', 'analyzed', 'Liver core biopsy for staging'),
        ('SLD-010', 10, 'Glandular', 'IHC-ER/PR', 'Breast', '2024-01-24', 'Sarah Liu', 'Aperio AT2', '20x', 'analyzed', 'Breast excision specimen'),
        ('SLD-011', 11, 'Cutaneous', 'H&E', 'Skin', '2024-01-25', 'Mark Chen', 'Leica SCN400', '40x', 'analyzed', 'Pigmented lesion excision'),
        ('SLD-012', 12, 'Lymphoid', 'H&E', 'Lymph Node', '2024-01-26', 'Emily Parker', 'Hamamatsu NanoZoomer', '20x', 'pending', 'Cervical lymph node biopsy'),
        ('SLD-013', 13, 'Urothelial', 'H&E', 'Bladder', '2024-01-27', 'Sarah Liu', 'Aperio AT2', '40x', 'analyzed', 'Cystoscopy-guided biopsy'),
        ('SLD-014', 14, 'Glandular', 'H&E', 'Ovary', '2024-01-28', 'Mark Chen', 'Philips UFS', '20x', 'analyzed', 'Ovarian cyst excision'),
        ('SLD-015', 15, 'Epithelial', 'H&E', 'Lung', '2024-01-29', 'Emily Parker', 'Leica SCN400', '40x', 'analyzed', 'CT-guided lung biopsy'),
        ('SLD-016', 16, 'Glandular', 'H&E', 'Uterus', '2024-01-30', 'Sarah Liu', 'Hamamatsu NanoZoomer', '20x', 'pending', 'Endometrial curettage'),
        ('SLD-017', 17, 'Mucosal', 'H&E', 'Colon', '2024-01-31', 'Mark Chen', 'Aperio AT2', '40x', 'analyzed', 'Ascending colon polyp'),
        ('SLD-018', 18, 'Epithelial', 'H&E', 'Thyroid', '2024-02-01', 'Emily Parker', 'Philips UFS', '20x', 'pending', 'Thyroid lobectomy specimen'),
        ('SLD-019', 1, 'Epithelial', 'IHC-TTF1', 'Lung', '2024-02-02', 'Sarah Liu', 'Aperio AT2', '40x', 'analyzed', 'IHC staining for primary vs metastatic'),
        ('SLD-020', 5, 'Glandular', 'IHC-PSA', 'Prostate', '2024-02-03', 'Mark Chen', 'Leica SCN400', '20x', 'analyzed', 'PSA immunohistochemistry')
      `);
      console.log('✓ Slides seeded');

      // Seed AI Analyses (18 items)
      await client.query(`
        INSERT INTO ai_analyses (slide_id, analysis_type, status, confidence_score, findings, ai_model, processing_time_ms, result_data) VALUES
        (1, 'comprehensive', 'completed', 94.5, 'Non-small cell lung carcinoma features identified. Moderately differentiated adenocarcinoma pattern with glandular formation.', 'claude-haiku-4.5', 2340, '{"risk_level": "high", "follow_up": "immediate"}'),
        (2, 'comprehensive', 'completed', 91.2, 'Invasive ductal carcinoma, moderately differentiated. ER/PR positive pattern suggested.', 'claude-haiku-4.5', 1890, '{"risk_level": "high", "follow_up": "urgent"}'),
        (3, 'comprehensive', 'completed', 88.7, 'Tubular adenoma with low-grade dysplasia. No evidence of high-grade dysplasia or carcinoma.', 'claude-haiku-4.5', 1560, '{"risk_level": "low", "follow_up": "routine"}'),
        (5, 'comprehensive', 'completed', 92.3, 'Prostatic adenocarcinoma, Gleason score 3+4=7. Moderate volume disease.', 'claude-haiku-4.5', 2100, '{"risk_level": "moderate", "follow_up": "priority"}'),
        (6, 'comprehensive', 'completed', 85.6, 'Follicular neoplasm, cannot exclude follicular carcinoma. Lobectomy recommended.', 'claude-haiku-4.5', 1780, '{"risk_level": "moderate", "follow_up": "surgical"}'),
        (8, 'comprehensive', 'completed', 79.4, 'Low-grade squamous intraepithelial lesion (LSIL). HPV cytopathic changes present.', 'claude-haiku-4.5', 1450, '{"risk_level": "low", "follow_up": "6-month"}'),
        (9, 'comprehensive', 'completed', 96.1, 'Advanced fibrosis (Stage F3-F4). Bridging fibrosis with early nodule formation. Consistent with cirrhosis.', 'claude-haiku-4.5', 2560, '{"risk_level": "high", "follow_up": "immediate"}'),
        (10, 'comprehensive', 'completed', 93.8, 'Invasive ductal carcinoma, Grade 2. ER strongly positive, PR moderately positive, HER2 equivocal.', 'claude-haiku-4.5', 2200, '{"risk_level": "high", "follow_up": "oncology"}'),
        (11, 'comprehensive', 'completed', 90.5, 'Malignant melanoma, Breslow thickness 1.8mm. Clark level IV. Ulceration present.', 'claude-haiku-4.5', 1920, '{"risk_level": "high", "follow_up": "immediate"}'),
        (13, 'comprehensive', 'completed', 87.3, 'High-grade papillary urothelial carcinoma. Lamina propria invasion identified (pT1).', 'claude-haiku-4.5', 2050, '{"risk_level": "high", "follow_up": "urgent"}'),
        (14, 'comprehensive', 'completed', 82.1, 'Serous cystadenoma, benign. No evidence of borderline or malignant features.', 'claude-haiku-4.5', 1680, '{"risk_level": "low", "follow_up": "routine"}'),
        (15, 'comprehensive', 'completed', 95.7, 'Squamous cell carcinoma, moderately differentiated. Keratinization present.', 'claude-haiku-4.5', 2380, '{"risk_level": "high", "follow_up": "immediate"}'),
        (17, 'comprehensive', 'completed', 86.4, 'Tubulovillous adenoma with focal high-grade dysplasia. Margins clear.', 'claude-haiku-4.5', 1750, '{"risk_level": "moderate", "follow_up": "surveillance"}'),
        (19, 'comprehensive', 'completed', 91.9, 'TTF-1 positive, confirming primary lung origin. CK7 positive, CK20 negative pattern.', 'claude-haiku-4.5', 1580, '{"risk_level": "high", "follow_up": "treatment"}'),
        (20, 'comprehensive', 'completed', 89.6, 'PSA strongly positive. Confirms prostatic origin. AMACR positive in atypical glands.', 'claude-haiku-4.5', 1420, '{"risk_level": "moderate", "follow_up": "staging"}'),
        (1, 'rapid', 'completed', 88.2, 'Rapid screening: malignant features detected. Full analysis recommended.', 'claude-haiku-4.5', 890, '{"screening": "positive", "priority": "high"}'),
        (2, 'rapid', 'completed', 85.7, 'Rapid screening: suspicious for malignancy. Detailed review required.', 'claude-haiku-4.5', 920, '{"screening": "positive", "priority": "high"}'),
        (3, 'rapid', 'completed', 72.3, 'Rapid screening: benign features predominate. Standard review timeline.', 'claude-haiku-4.5', 780, '{"screening": "negative", "priority": "routine"}')
      `);
      console.log('✓ AI Analyses seeded');

      // Seed Cancer Detections (16 items)
      await client.query(`
        INSERT INTO cancer_detections (slide_id, cancer_type, probability, grade, stage, location_data, markers, recommendation, status, reviewed_by) VALUES
        (1, 'Non-Small Cell Lung Carcinoma - Adenocarcinoma', 0.9450, 'G2', 'IIA', '{"quadrant": "upper_right", "size_mm": 28}', 'TTF-1+, CK7+, Napsin-A+', 'Recommend staging CT and PET scan. Consider molecular testing for EGFR, ALK, ROS1.', 'confirmed', 'Dr. James Wilson'),
        (2, 'Invasive Ductal Carcinoma', 0.9120, 'G2', 'IIB', '{"quadrant": "upper_outer", "size_mm": 22}', 'ER+, PR+, HER2 equivocal', 'Recommend Oncotype DX testing. Consider neoadjuvant chemotherapy.', 'confirmed', 'Dr. Maria Rodriguez'),
        (5, 'Prostatic Adenocarcinoma', 0.9230, 'Gleason 7', 'II', '{"zone": "peripheral", "cores_positive": "4/12"}', 'PSA elevated, AMACR+', 'Recommend MRI staging. Discuss active surveillance vs treatment options.', 'confirmed', 'Dr. James Wilson'),
        (9, 'Hepatocellular Carcinoma Risk', 0.6500, 'N/A', 'Cirrhosis', '{"lobe": "right", "nodules": 2}', 'AFP pending', 'High risk for HCC development. Recommend 6-month surveillance with imaging.', 'under_review', 'Dr. Sarah Chen'),
        (10, 'Invasive Ductal Carcinoma', 0.9380, 'G2', 'IIA', '{"quadrant": "central", "size_mm": 18}', 'ER strongly+, PR moderate+, HER2 2+', 'FISH testing for HER2 recommended. Sentinel lymph node biopsy indicated.', 'confirmed', 'Dr. Maria Rodriguez'),
        (11, 'Malignant Melanoma', 0.9050, 'Clark IV', 'IB', '{"location": "back", "breslow_mm": 1.8}', 'S100+, HMB-45+, Melan-A+', 'Wide local excision with 1cm margins. Sentinel lymph node biopsy recommended.', 'confirmed', 'Dr. James Wilson'),
        (13, 'Urothelial Carcinoma', 0.8730, 'High Grade', 'pT1', '{"location": "lateral_wall", "size_mm": 15}', 'CK20+, p53 mutant pattern', 'Recommend re-TURBT in 4-6 weeks. Consider intravesical BCG therapy.', 'confirmed', 'Dr. Sarah Chen'),
        (15, 'Squamous Cell Carcinoma', 0.9570, 'G2', 'IIB', '{"lobe": "left_lower", "size_mm": 35}', 'p40+, CK5/6+', 'Recommend PET-CT staging. Multidisciplinary tumor board review.', 'confirmed', 'Dr. James Wilson'),
        (17, 'Colorectal - High Grade Dysplasia', 0.4200, 'HGD', 'Tis', '{"location": "ascending", "size_mm": 12}', 'MLH1/MSH2 intact', 'Complete excision achieved. Recommend surveillance colonoscopy in 1 year.', 'confirmed', 'Dr. Maria Rodriguez'),
        (19, 'Non-Small Cell Lung Carcinoma', 0.9190, 'G2', 'IIA', '{"quadrant": "upper_right", "size_mm": 28}', 'TTF-1+, CK7+, CK20-', 'Confirms primary lung adenocarcinoma. Proceed with molecular profiling.', 'confirmed', 'Dr. James Wilson'),
        (3, 'Colorectal - Low Risk', 0.0800, 'LGD', 'N/A', '{"location": "sigmoid", "size_mm": 8}', 'N/A', 'Low-grade tubular adenoma. Routine surveillance per guidelines.', 'benign', 'Dr. Maria Rodriguez'),
        (6, 'Thyroid - Indeterminate', 0.5500, 'N/A', 'N/A', '{"lobe": "right", "size_mm": 15}', 'Pending molecular', 'Bethesda IV - recommend molecular testing (Afirma/ThyroSeq) or diagnostic lobectomy.', 'under_review', 'Dr. Sarah Chen'),
        (8, 'Cervical - Low Risk', 0.1200, 'LSIL', 'N/A', '{"location": "transformation_zone"}', 'HPV+', 'Low-grade lesion. Recommend repeat Pap in 12 months with HPV co-testing.', 'benign', 'Dr. Maria Rodriguez'),
        (14, 'Ovarian - Benign', 0.0500, 'N/A', 'N/A', '{"side": "left", "size_cm": 5}', 'CA-125 normal', 'Serous cystadenoma, benign. No further oncologic workup needed.', 'benign', 'Dr. James Wilson'),
        (20, 'Prostatic Adenocarcinoma', 0.8960, 'Gleason 7', 'II', '{"zone": "peripheral", "cores_positive": "4/12"}', 'PSA+, AMACR+, p63-', 'Confirms prostatic adenocarcinoma. Correlate with staging imaging.', 'confirmed', 'Dr. Sarah Chen'),
        (16, 'Endometrial - Pending', 0.3500, 'N/A', 'N/A', '{"location": "fundus"}', 'Pending IHC', 'Endometrial sampling shows complex hyperplasia. IHC for atypia assessment pending.', 'under_review', 'Dr. Maria Rodriguez')
      `);
      console.log('✓ Cancer Detections seeded');

      // Seed Cell Classifications (18 items)
      await client.query(`
        INSERT INTO cell_classifications (slide_id, cell_type, count, percentage, morphology, abnormality_flag, confidence, notes) VALUES
        (1, 'Adenocarcinoma Cells', 2450, 35.20, 'Large pleomorphic cells with prominent nucleoli', true, 94.5, 'Glandular differentiation pattern'),
        (1, 'Normal Pneumocytes', 2800, 40.20, 'Type I and II pneumocytes with normal morphology', false, 91.2, 'Background normal tissue'),
        (1, 'Inflammatory Cells', 1200, 17.20, 'Mixed lymphocytes and macrophages', false, 88.7, 'Reactive inflammatory infiltrate'),
        (1, 'Stromal Cells', 510, 7.40, 'Fibroblasts and endothelial cells', false, 85.3, 'Supporting stroma'),
        (2, 'Ductal Carcinoma Cells', 3100, 42.50, 'Pleomorphic cells with high N:C ratio', true, 93.8, 'Invasive growth pattern'),
        (2, 'Normal Ductal Epithelium', 1900, 26.00, 'Regular columnar cells with basal orientation', false, 90.1, 'Adjacent normal tissue'),
        (2, 'Myoepithelial Cells', 850, 11.60, 'Spindle-shaped cells at basement membrane', false, 87.4, 'Absent in invasive areas'),
        (2, 'Lymphocytes (TIL)', 1450, 19.90, 'Tumor-infiltrating lymphocytes, mixed T and B cells', false, 86.2, 'Moderate TIL density'),
        (5, 'Prostatic Adenocarcinoma', 1800, 28.50, 'Small acinar proliferation with prominent nucleoli', true, 92.3, 'Gleason pattern 3 predominant'),
        (5, 'Benign Prostatic Glands', 2500, 39.60, 'Two-cell layer architecture preserved', false, 89.7, 'Normal glandular tissue'),
        (5, 'Basal Cells', 900, 14.20, 'Flat cells at gland periphery', false, 85.1, 'Absent in malignant glands'),
        (5, 'Stromal/Smooth Muscle', 1120, 17.70, 'Fibromuscular stroma', false, 83.6, 'Normal prostatic stroma'),
        (9, 'Hepatocytes', 3200, 45.00, 'Ballooning degeneration, Mallory-Denk bodies', true, 96.1, 'Active hepatocyte injury'),
        (9, 'Stellate Cells', 1500, 21.10, 'Activated myofibroblast phenotype', true, 91.4, 'Driving fibrogenesis'),
        (9, 'Kupffer Cells', 950, 13.40, 'Enlarged, activated macrophages', false, 88.9, 'Reactive to injury'),
        (9, 'Inflammatory Infiltrate', 1050, 14.80, 'Portal and lobular lymphocytes', false, 87.2, 'Chronic inflammation'),
        (11, 'Melanoma Cells', 2800, 52.30, 'Epithelioid and spindle cells with melanin pigment', true, 90.5, 'Vertical growth phase'),
        (11, 'Normal Keratinocytes', 2550, 47.70, 'Stratified squamous epithelium', false, 88.3, 'Surrounding normal skin')
      `);
      console.log('✓ Cell Classifications seeded');

      // Seed Tissue Segmentations (16 items)
      await client.query(`
        INSERT INTO tissue_segmentations (slide_id, segment_type, area_percentage, boundary_data, tissue_class, health_status, density_score, notes) VALUES
        (1, 'Tumor Region', 35.20, '{"x": 120, "y": 80, "width": 450, "height": 380}', 'Malignant Epithelial', 'abnormal', 8.50, 'Primary adenocarcinoma mass'),
        (1, 'Normal Parenchyma', 40.10, '{"x": 0, "y": 0, "width": 800, "height": 200}', 'Normal Lung', 'healthy', 4.20, 'Preserved alveolar architecture'),
        (1, 'Inflammatory Zone', 15.30, '{"x": 580, "y": 300, "width": 220, "height": 200}', 'Reactive', 'inflamed', 6.80, 'Peritumoral inflammation'),
        (1, 'Necrotic Area', 9.40, '{"x": 250, "y": 200, "width": 150, "height": 120}', 'Necrotic', 'dead', 2.10, 'Central tumor necrosis'),
        (2, 'Invasive Carcinoma', 42.50, '{"x": 100, "y": 50, "width": 500, "height": 400}', 'Malignant Glandular', 'abnormal', 9.20, 'Invasive ductal carcinoma'),
        (2, 'In-situ Component', 12.30, '{"x": 610, "y": 100, "width": 180, "height": 150}', 'Pre-malignant', 'abnormal', 7.50, 'DCIS component'),
        (2, 'Normal Breast Tissue', 30.80, '{"x": 0, "y": 460, "width": 800, "height": 140}', 'Normal Glandular', 'healthy', 3.80, 'Terminal duct lobular units'),
        (2, 'Stroma/Desmoplasia', 14.40, '{"x": 300, "y": 200, "width": 200, "height": 250}', 'Reactive Stroma', 'reactive', 5.60, 'Desmoplastic reaction'),
        (9, 'Fibrotic Septa', 38.50, '{"x": 0, "y": 0, "width": 800, "height": 600}', 'Fibrotic', 'abnormal', 9.50, 'Bridging fibrosis'),
        (9, 'Regenerative Nodules', 32.20, '{"x": 200, "y": 150, "width": 400, "height": 300}', 'Regenerative', 'compensating', 7.80, 'Hepatocyte regeneration'),
        (9, 'Portal Tracts', 15.80, '{"x": 50, "y": 50, "width": 150, "height": 150}', 'Portal', 'inflamed', 6.20, 'Chronic portal inflammation'),
        (9, 'Bile Duct Proliferation', 13.50, '{"x": 400, "y": 400, "width": 200, "height": 150}', 'Biliary', 'reactive', 5.90, 'Ductular reaction'),
        (11, 'Melanoma - Vertical Growth', 52.30, '{"x": 150, "y": 100, "width": 500, "height": 350}', 'Malignant Melanocytic', 'abnormal', 8.90, 'Deep dermal invasion'),
        (11, 'Normal Epidermis', 25.40, '{"x": 0, "y": 0, "width": 800, "height": 80}', 'Normal Epithelial', 'healthy', 3.50, 'Intact epidermis at margins'),
        (11, 'Inflammatory Band', 15.80, '{"x": 100, "y": 460, "width": 600, "height": 100}', 'Inflammatory', 'reactive', 7.20, 'Brisk lymphocytic response'),
        (11, 'Normal Dermis', 6.50, '{"x": 0, "y": 560, "width": 800, "height": 40}', 'Normal Connective', 'healthy', 2.80, 'Deep dermis uninvolved')
      `);
      console.log('✓ Tissue Segmentations seeded');

      // Seed Pathology Reports (16 items)
      await client.query(`
        INSERT INTO pathology_reports (report_id, patient_id, slide_id, pathologist, diagnosis, microscopic_findings, gross_description, clinical_history, recommendations, status, signed_date) VALUES
        ('RPT-001', 1, 1, 'Dr. James Wilson', 'Non-small cell lung carcinoma, adenocarcinoma subtype', 'Sections show moderately differentiated adenocarcinoma with glandular and acinar patterns. Tumor cells show enlarged nuclei with prominent nucleoli.', 'Core biopsy specimen, 1.2 cm in length, tan-white, firm', 'Heavy smoker, persistent cough, CT showing RUL mass', 'Recommend staging workup including PET-CT and molecular testing', 'signed', '2024-01-20'),
        ('RPT-002', 2, 2, 'Dr. Maria Rodriguez', 'Invasive ductal carcinoma, Grade 2', 'Invasive carcinoma with tubule formation (score 2), moderate nuclear pleomorphism (score 2), and moderate mitotic rate (score 2). Total Nottingham score 6/9.', 'Core biopsy x4, largest 1.5 cm, tan-pink, firm', 'Palpable left breast mass, suspicious on mammography', 'ER/PR and HER2 testing completed. Oncotype DX recommended.', 'signed', '2024-01-21'),
        ('RPT-003', 3, 3, 'Dr. Maria Rodriguez', 'Tubular adenoma with low-grade dysplasia', 'Polypoid fragment showing tubular adenomatous architecture with low-grade dysplasia. No high-grade dysplasia or invasive carcinoma identified.', 'Polypectomy specimen, 0.8 cm, tan, pedunculated', 'Routine screening colonoscopy', 'Surveillance colonoscopy in 5-10 years per guidelines', 'signed', '2024-01-22'),
        ('RPT-004', 5, 5, 'Dr. James Wilson', 'Prostatic adenocarcinoma, Gleason 3+4=7, Grade Group 2', 'Twelve core biopsies examined. Four cores positive for adenocarcinoma. Predominant Gleason pattern 3 with secondary pattern 4 (cribriform).', 'Prostate needle biopsies x12, 1.0-1.5 cm each', 'Elevated PSA (8.2 ng/mL), abnormal DRE', 'Recommend staging MRI. Discuss treatment options: active surveillance, surgery, or radiation.', 'signed', '2024-01-24'),
        ('RPT-005', 6, 6, 'Dr. Sarah Chen', 'Follicular neoplasm, Bethesda Category IV', 'FNA shows microfollicular architecture with scant colloid. Follicular cells show mild nuclear atypia. Cannot distinguish adenoma from carcinoma on cytology.', 'FNA aspirate, cellular specimen', 'Enlarging thyroid nodule, 1.5 cm on ultrasound', 'Recommend molecular testing or diagnostic thyroid lobectomy', 'signed', '2024-01-25'),
        ('RPT-006', 8, 8, 'Dr. Maria Rodriguez', 'Low-grade squamous intraepithelial lesion (LSIL)', 'Cervical smear shows koilocytic changes consistent with HPV effect. Mild nuclear enlargement in superficial cells.', 'Cervical smear, satisfactory for evaluation', 'Previous ASCUS, HPV positive', 'Repeat Pap smear with HPV co-testing in 12 months', 'signed', '2024-01-27'),
        ('RPT-007', 9, 9, 'Dr. James Wilson', 'Chronic hepatitis with advanced fibrosis (Stage F3-F4)', 'Liver core shows bridging fibrosis with early nodule formation. Portal tracts expanded with chronic inflammatory infiltrate. Hepatocytes show ballooning degeneration.', 'Liver core biopsy, 2.0 cm, tan-brown, firm', 'Hepatitis C, elevated liver enzymes', 'Consistent with cirrhosis. Recommend HCC surveillance and hepatology follow-up.', 'signed', '2024-01-28'),
        ('RPT-008', 10, 10, 'Dr. Maria Rodriguez', 'Invasive ductal carcinoma with IHC profile', 'ER strongly positive (Allred 8/8), PR moderately positive (Allred 6/8), HER2 score 2+ (equivocal). Ki-67 index 25%.', 'Breast excision, 3.2 x 2.8 x 2.1 cm, tan-white mass', 'Core biopsy proven IDC', 'HER2 FISH recommended. Refer to tumor board for treatment planning.', 'signed', '2024-01-29'),
        ('RPT-009', 11, 11, 'Dr. James Wilson', 'Malignant melanoma, pT2a', 'Sections show malignant melanoma with epithelioid and spindle cell morphology. Breslow thickness 1.8 mm. Clark level IV. No ulceration. Mitotic rate 3/mm2.', 'Elliptical excision, 3.5 x 2.0 cm, pigmented lesion', 'Changing pigmented lesion on back', 'Wide local excision with 1 cm margins. Sentinel lymph node biopsy recommended.', 'signed', '2024-01-30'),
        ('RPT-010', 13, 13, 'Dr. Sarah Chen', 'High-grade papillary urothelial carcinoma, pT1', 'Papillary urothelial neoplasm with high-grade cytology. Lamina propria invasion identified. Muscularis propria not present in specimen.', 'TURBT specimen, multiple fragments, tan-pink', 'Hematuria, cystoscopy showing papillary lesion', 'Re-TURBT recommended in 4-6 weeks to ensure complete resection and assess for muscle invasion.', 'signed', '2024-01-31'),
        ('RPT-011', 14, 14, 'Dr. James Wilson', 'Serous cystadenoma, benign', 'Ovarian cyst lined by single layer of ciliated columnar epithelium. No atypia or papillary proliferation. Stroma is unremarkable.', 'Ovarian cyst, 5 cm diameter, smooth-walled, clear fluid', 'Left ovarian cyst on ultrasound', 'Benign lesion. No further oncologic workup required.', 'signed', '2024-02-01'),
        ('RPT-012', 15, 15, 'Dr. James Wilson', 'Squamous cell carcinoma, moderately differentiated', 'Invasive squamous cell carcinoma with keratinization and intercellular bridges. Tumor cells show moderate pleomorphism.', 'CT-guided core biopsy, 1.3 cm, tan-white', 'Persistent LLL mass on imaging, 3.5 cm', 'Recommend PET-CT staging. Multidisciplinary tumor board discussion.', 'signed', '2024-02-02'),
        ('RPT-013', 17, 17, 'Dr. Maria Rodriguez', 'Tubulovillous adenoma with focal high-grade dysplasia', 'Polypoid lesion with tubulovillous architecture. Focal area of high-grade dysplasia identified. No invasive carcinoma. Margins clear.', 'Polypectomy, 1.2 cm, villous surface', 'Surveillance colonoscopy, history of polyps', 'Recommend follow-up colonoscopy in 3 years due to HGD focus.', 'signed', '2024-02-03'),
        ('RPT-014', 4, 4, 'Dr. Sarah Chen', 'Pending - Renal biopsy', 'Pending processing', 'Renal core biopsy, 1.0 cm', 'Proteinuria workup', 'Pending IF and EM studies', 'draft', NULL),
        ('RPT-015', 7, 7, 'Dr. James Wilson', 'Pending - Gastric biopsy', 'Pending processing', 'Gastric antral biopsies x4', 'Dyspepsia, rule out H. pylori', 'Pending special stains', 'draft', NULL),
        ('RPT-016', 18, 18, 'Dr. Sarah Chen', 'Pending - Thyroid lobectomy', 'Pending processing', 'Thyroid lobectomy, 4.5 x 3.2 x 2.8 cm', 'Bethesda IV on FNA', 'Pending complete sectioning', 'draft', NULL)
      `);
      console.log('✓ Pathology Reports seeded');

      // Seed Cases (16 items)
      await client.query(`
        INSERT INTO cases (case_id, patient_id, case_type, priority, assigned_pathologist, status, diagnosis, turnaround_days, notes) VALUES
        ('CASE-001', 1, 'Surgical Pathology', 'urgent', 'Dr. James Wilson', 'completed', 'Lung adenocarcinoma', 2, 'Rush case - patient scheduled for surgery'),
        ('CASE-002', 2, 'Surgical Pathology', 'urgent', 'Dr. Maria Rodriguez', 'completed', 'Invasive ductal carcinoma', 2, 'Oncology referral pending results'),
        ('CASE-003', 3, 'Surgical Pathology', 'normal', 'Dr. Maria Rodriguez', 'completed', 'Tubular adenoma, LGD', 5, 'Routine screening finding'),
        ('CASE-004', 4, 'Renal Pathology', 'high', 'Dr. Sarah Chen', 'in_progress', NULL, NULL, 'Awaiting IF and EM results'),
        ('CASE-005', 5, 'Surgical Pathology', 'high', 'Dr. James Wilson', 'completed', 'Prostatic adenocarcinoma', 3, 'Multiple positive cores'),
        ('CASE-006', 6, 'Cytopathology', 'normal', 'Dr. Sarah Chen', 'completed', 'Follicular neoplasm', 4, 'FNA with molecular testing pending'),
        ('CASE-007', 7, 'GI Pathology', 'normal', 'Dr. James Wilson', 'in_progress', NULL, NULL, 'Awaiting H. pylori special stains'),
        ('CASE-008', 8, 'Cytopathology', 'normal', 'Dr. Maria Rodriguez', 'completed', 'LSIL', 3, 'Routine Pap smear'),
        ('CASE-009', 9, 'Hepatopathology', 'urgent', 'Dr. James Wilson', 'completed', 'Cirrhosis F3-F4', 2, 'Urgent staging for treatment planning'),
        ('CASE-010', 10, 'Surgical Pathology', 'urgent', 'Dr. Maria Rodriguez', 'completed', 'IDC with IHC', 2, 'ER/PR/HER2 results critical for treatment'),
        ('CASE-011', 11, 'Dermatopathology', 'high', 'Dr. James Wilson', 'completed', 'Malignant melanoma', 2, 'Breslow and staging critical'),
        ('CASE-012', 12, 'Surgical Pathology', 'normal', 'Dr. Sarah Chen', 'open', NULL, NULL, 'Lymph node biopsy pending processing'),
        ('CASE-013', 13, 'Surgical Pathology', 'high', 'Dr. Sarah Chen', 'completed', 'Urothelial carcinoma pT1', 3, 'Re-TURBT planning dependent on results'),
        ('CASE-014', 14, 'Surgical Pathology', 'normal', 'Dr. James Wilson', 'completed', 'Serous cystadenoma', 5, 'Routine ovarian cyst'),
        ('CASE-015', 15, 'Surgical Pathology', 'urgent', 'Dr. James Wilson', 'completed', 'Squamous cell carcinoma', 1, 'Expedited for treatment planning'),
        ('CASE-016', 16, 'Gynecologic Pathology', 'high', 'Dr. Maria Rodriguez', 'in_progress', NULL, NULL, 'Awaiting IHC for atypia assessment')
      `);
      console.log('✓ Cases seeded');

      // Seed Quality Controls (16 items)
      await client.query(`
        INSERT INTO quality_controls (qc_id, slide_id, inspector, stain_quality, tissue_integrity, scan_quality, overall_score, pass_fail, issues, corrective_action) VALUES
        ('QC-001', 1, 'Emily Parker', 'excellent', 'good', 'excellent', 9.2, 'pass', 'None', 'No action required'),
        ('QC-002', 2, 'Mark Chen', 'good', 'excellent', 'good', 8.5, 'pass', 'Minor stain variation at edges', 'Monitor staining protocol'),
        ('QC-003', 3, 'Emily Parker', 'excellent', 'excellent', 'excellent', 9.8, 'pass', 'None', 'No action required'),
        ('QC-004', 4, 'Sarah Liu', 'fair', 'good', 'good', 7.0, 'pass', 'PAS staining slightly understained', 'Restain if pathologist requests'),
        ('QC-005', 5, 'Mark Chen', 'good', 'good', 'excellent', 8.7, 'pass', 'None', 'No action required'),
        ('QC-006', 6, 'Emily Parker', 'excellent', 'fair', 'good', 7.8, 'pass', 'Minor tissue folding artifact', 'Review embedding technique'),
        ('QC-007', 7, 'Sarah Liu', 'poor', 'good', 'fair', 5.2, 'fail', 'Significant staining artifact, uneven H&E', 'Recut and restain required'),
        ('QC-008', 8, 'Mark Chen', 'good', 'excellent', 'excellent', 9.0, 'pass', 'None', 'No action required'),
        ('QC-009', 9, 'Emily Parker', 'excellent', 'good', 'excellent', 9.3, 'pass', 'None', 'No action required'),
        ('QC-010', 10, 'Sarah Liu', 'excellent', 'excellent', 'good', 9.1, 'pass', 'Slight focus variation in one area', 'Rescan if affecting diagnosis'),
        ('QC-011', 11, 'Mark Chen', 'good', 'good', 'good', 8.0, 'pass', 'Melanin pigment causing minor scanning artifact', 'Normal for pigmented lesions'),
        ('QC-012', 12, 'Emily Parker', 'fair', 'fair', 'poor', 4.8, 'fail', 'Tissue floating, poor scan quality', 'Remount tissue and rescan'),
        ('QC-013', 13, 'Sarah Liu', 'excellent', 'good', 'excellent', 9.0, 'pass', 'None', 'No action required'),
        ('QC-014', 14, 'Mark Chen', 'good', 'excellent', 'excellent', 9.2, 'pass', 'None', 'No action required'),
        ('QC-015', 15, 'Emily Parker', 'excellent', 'excellent', 'good', 9.4, 'pass', 'None', 'No action required'),
        ('QC-016', 16, 'Sarah Liu', 'poor', 'fair', 'fair', 4.5, 'fail', 'Thick section, poor nuclear detail', 'Recut thinner sections and restain')
      `);
      console.log('✓ Quality Controls seeded');

      // Seed Annotations (18 items)
      await client.query(`
        INSERT INTO annotations (slide_id, annotator, annotation_type, label, coordinates, description, color, is_ai_generated) VALUES
        (1, 'Dr. James Wilson', 'region', 'Tumor Focus', '{"x": 150, "y": 100, "width": 300, "height": 250}', 'Primary adenocarcinoma mass with glandular pattern', '#FF4444', false),
        (1, 'AI Analyzer', 'region', 'Necrosis', '{"x": 250, "y": 200, "width": 100, "height": 80}', 'AI-detected area of coagulative necrosis', '#FF8800', true),
        (1, 'Dr. James Wilson', 'point', 'Mitotic Figure', '{"x": 320, "y": 180}', 'Atypical mitotic figure identified', '#FF0000', false),
        (2, 'Dr. Maria Rodriguez', 'region', 'Invasive Front', '{"x": 100, "y": 80, "width": 400, "height": 350}', 'Leading edge of invasive carcinoma', '#FF4444', false),
        (2, 'AI Analyzer', 'region', 'DCIS Component', '{"x": 520, "y": 120, "width": 150, "height": 130}', 'AI-identified ductal carcinoma in-situ', '#FF6600', true),
        (2, 'Dr. Maria Rodriguez', 'measurement', 'Tumor Size', '{"x1": 100, "y1": 250, "x2": 500, "y2": 250}', 'Maximum tumor diameter measurement', '#0088FF', false),
        (5, 'Dr. James Wilson', 'region', 'Gleason 4 Area', '{"x": 200, "y": 150, "width": 250, "height": 200}', 'Cribriform pattern - Gleason pattern 4', '#FF4444', false),
        (5, 'AI Analyzer', 'region', 'Benign Glands', '{"x": 50, "y": 50, "width": 130, "height": 100}', 'AI-confirmed benign prostatic glands', '#44FF44', true),
        (9, 'Dr. James Wilson', 'region', 'Bridging Fibrosis', '{"x": 0, "y": 100, "width": 800, "height": 80}', 'Band of bridging fibrosis connecting portal tracts', '#8844FF', false),
        (9, 'AI Analyzer', 'region', 'Regenerative Nodule', '{"x": 250, "y": 200, "width": 300, "height": 250}', 'AI-segmented regenerative hepatocyte nodule', '#44AAFF', true),
        (11, 'Dr. James Wilson', 'measurement', 'Breslow Thickness', '{"x1": 400, "y1": 50, "x2": 400, "y2": 230}', 'Breslow depth measurement: 1.8 mm', '#0088FF', false),
        (11, 'AI Analyzer', 'region', 'Melanoma VGP', '{"x": 180, "y": 80, "width": 440, "height": 300}', 'AI-detected vertical growth phase melanoma', '#FF4444', true),
        (13, 'Dr. Sarah Chen', 'region', 'Invasion Front', '{"x": 200, "y": 250, "width": 350, "height": 150}', 'Area of lamina propria invasion', '#FF4444', false),
        (13, 'AI Analyzer', 'region', 'Papillary Architecture', '{"x": 150, "y": 50, "width": 500, "height": 200}', 'AI-identified papillary growth pattern', '#FF8800', true),
        (15, 'Dr. James Wilson', 'region', 'Keratinization', '{"x": 300, "y": 150, "width": 200, "height": 180}', 'Area of squamous keratinization', '#FFAA00', false),
        (15, 'AI Analyzer', 'point', 'Mitosis Cluster', '{"x": 380, "y": 220}', 'AI-detected cluster of mitotic figures', '#FF0000', true),
        (17, 'Dr. Maria Rodriguez', 'region', 'HGD Focus', '{"x": 350, "y": 100, "width": 150, "height": 120}', 'Focal area of high-grade dysplasia', '#FF4444', false),
        (10, 'AI Analyzer', 'region', 'ER Positive Zone', '{"x": 100, "y": 100, "width": 500, "height": 400}', 'Region showing strong ER immunoreactivity', '#FF44FF', true)
      `);
      console.log('✓ Annotations seeded');

      // Seed Billing Records (18 items)
      await client.query(`
        INSERT INTO billing_records (invoice_id, patient_id, slide_id, service_type, amount, currency, status, insurance_claim, billing_date, due_date, notes) VALUES
        ('INV-001', 1, 1, 'Surgical Pathology - Complex', 450.00, 'USD', 'paid', 'CLM-78901', '2024-01-20', '2024-02-20', 'Lung biopsy with AI analysis'),
        ('INV-002', 2, 2, 'Surgical Pathology - Complex', 475.00, 'USD', 'paid', 'CLM-78902', '2024-01-21', '2024-02-21', 'Breast biopsy with IHC'),
        ('INV-003', 3, 3, 'Surgical Pathology - Standard', 250.00, 'USD', 'paid', 'CLM-78903', '2024-01-22', '2024-02-22', 'Colon polypectomy'),
        ('INV-004', 4, 4, 'Renal Pathology - Complex', 850.00, 'USD', 'pending', 'CLM-78904', '2024-01-23', '2024-02-23', 'Renal biopsy with IF and EM'),
        ('INV-005', 5, 5, 'Surgical Pathology - Complex', 550.00, 'USD', 'paid', 'CLM-78905', '2024-01-24', '2024-02-24', 'Prostate biopsy 12 cores'),
        ('INV-006', 6, 6, 'Cytopathology - FNA', 325.00, 'USD', 'paid', 'CLM-78906', '2024-01-25', '2024-02-25', 'Thyroid FNA'),
        ('INV-007', 7, 7, 'GI Pathology - Standard', 200.00, 'USD', 'pending', 'CLM-78907', '2024-01-26', '2024-02-26', 'Gastric biopsies'),
        ('INV-008', 8, 8, 'Cytopathology - Pap', 150.00, 'USD', 'paid', 'CLM-78908', '2024-01-27', '2024-02-27', 'Cervical smear'),
        ('INV-009', 9, 9, 'Hepatopathology - Complex', 750.00, 'USD', 'paid', 'CLM-78909', '2024-01-28', '2024-02-28', 'Liver biopsy with trichrome'),
        ('INV-010', 10, 10, 'Surgical Pathology + IHC Panel', 680.00, 'USD', 'processing', 'CLM-78910', '2024-01-29', '2024-02-29', 'Breast with ER/PR/HER2'),
        ('INV-011', 11, 11, 'Dermatopathology', 380.00, 'USD', 'paid', 'CLM-78911', '2024-01-30', '2024-02-28', 'Melanoma excision'),
        ('INV-012', 12, 12, 'Surgical Pathology - Standard', 300.00, 'USD', 'pending', 'CLM-78912', '2024-01-31', '2024-03-01', 'Lymph node biopsy'),
        ('INV-013', 13, 13, 'Surgical Pathology - Complex', 425.00, 'USD', 'paid', 'CLM-78913', '2024-02-01', '2024-03-01', 'TURBT specimen'),
        ('INV-014', 14, 14, 'Surgical Pathology - Standard', 350.00, 'USD', 'paid', 'CLM-78914', '2024-02-02', '2024-03-02', 'Ovarian cyst'),
        ('INV-015', 15, 15, 'Surgical Pathology - Complex', 450.00, 'USD', 'paid', 'CLM-78915', '2024-02-03', '2024-03-03', 'Lung biopsy - SCC'),
        ('INV-016', 16, 16, 'Gynecologic Pathology', 275.00, 'USD', 'pending', 'CLM-78916', '2024-02-04', '2024-03-04', 'Endometrial curettage'),
        ('INV-017', 17, 17, 'Surgical Pathology - Standard', 250.00, 'USD', 'paid', 'CLM-78917', '2024-02-05', '2024-03-05', 'Colon polypectomy'),
        ('INV-018', 18, 18, 'Surgical Pathology - Complex', 650.00, 'USD', 'pending', 'CLM-78918', '2024-02-06', '2024-03-06', 'Thyroid lobectomy')
      `);
      console.log('✓ Billing Records seeded');

      // Seed Lab Equipment (16 items)
      await client.query(`
        INSERT INTO lab_equipment (equipment_id, name, type, manufacturer, model, serial_number, location, status, last_maintenance, next_maintenance, calibration_date, notes) VALUES
        ('EQ-001', 'Aperio AT2 Digital Scanner', 'Slide Scanner', 'Leica Biosystems', 'AT2', 'AP-2024-001', 'Digital Pathology Lab - Room 101', 'operational', '2024-01-10', '2024-04-10', '2024-01-05', 'Primary high-throughput scanner'),
        ('EQ-002', 'Leica SCN400 Scanner', 'Slide Scanner', 'Leica Biosystems', 'SCN400', 'LC-2023-045', 'Digital Pathology Lab - Room 101', 'operational', '2024-01-08', '2024-04-08', '2024-01-03', 'Secondary scanner for special stains'),
        ('EQ-003', 'Hamamatsu NanoZoomer S360', 'Slide Scanner', 'Hamamatsu Photonics', 'NanoZoomer S360', 'HM-2024-012', 'Digital Pathology Lab - Room 102', 'operational', '2024-01-12', '2024-04-12', '2024-01-07', 'High-speed batch scanning'),
        ('EQ-004', 'Philips UFS Scanner', 'Slide Scanner', 'Philips', 'Ultra Fast Scanner', 'PH-2023-089', 'Digital Pathology Lab - Room 102', 'maintenance', '2023-12-15', '2024-03-15', '2023-12-10', 'Scheduled maintenance - calibration needed'),
        ('EQ-005', 'Leica RM2255 Microtome', 'Microtome', 'Leica Biosystems', 'RM2255', 'LM-2022-034', 'Histology Lab - Room 201', 'operational', '2024-01-05', '2024-07-05', '2024-01-02', 'Automated rotary microtome'),
        ('EQ-006', 'Thermo Excelsior AS', 'Tissue Processor', 'Thermo Fisher', 'Excelsior AS', 'TF-2023-067', 'Histology Lab - Room 201', 'operational', '2024-01-07', '2024-04-07', '2024-01-04', 'Automated tissue processor'),
        ('EQ-007', 'Leica ST5020 Stainer', 'Autostainer', 'Leica Biosystems', 'ST5020', 'LS-2023-023', 'Staining Lab - Room 202', 'operational', '2024-01-09', '2024-04-09', '2024-01-06', 'H&E automated stainer'),
        ('EQ-008', 'Ventana BenchMark Ultra', 'IHC Stainer', 'Roche', 'BenchMark Ultra', 'VN-2024-005', 'IHC Lab - Room 203', 'operational', '2024-01-11', '2024-04-11', '2024-01-08', 'Automated IHC/ISH platform'),
        ('EQ-009', 'Leica CV5030 Coverslipper', 'Coverslipper', 'Leica Biosystems', 'CV5030', 'LC-2023-078', 'Histology Lab - Room 201', 'operational', '2024-01-06', '2024-07-06', '2024-01-03', 'Automated glass coverslipper'),
        ('EQ-010', 'Olympus BX53 Microscope', 'Microscope', 'Olympus', 'BX53', 'OL-2022-156', 'Pathologist Office - Room 301', 'operational', '2024-01-04', '2024-07-04', '2024-01-01', 'Multi-head teaching microscope'),
        ('EQ-011', 'Nikon Eclipse Ni-U', 'Microscope', 'Nikon', 'Eclipse Ni-U', 'NK-2023-034', 'Pathologist Office - Room 302', 'operational', '2024-01-03', '2024-07-03', '2023-12-28', 'Fluorescence capable microscope'),
        ('EQ-012', 'Sakura Tissue-Tek VIP 6', 'Tissue Processor', 'Sakura Finetek', 'VIP 6 AI', 'SK-2024-002', 'Histology Lab - Room 201', 'operational', '2024-01-13', '2024-04-13', '2024-01-10', 'AI-integrated tissue processor'),
        ('EQ-013', 'Leica EG1150H Embedding', 'Embedding Station', 'Leica Biosystems', 'EG1150H', 'LE-2022-089', 'Histology Lab - Room 201', 'operational', '2024-01-02', '2024-07-02', '2023-12-20', 'Heated paraffin embedding center'),
        ('EQ-014', 'Milestone PATHOS Delta', 'Rapid Processor', 'Milestone Medical', 'PATHOS Delta', 'MM-2023-015', 'Histology Lab - Room 204', 'repair', '2023-11-20', '2024-02-20', '2023-11-15', 'Microwave rapid tissue processor - heating element replacement'),
        ('EQ-015', 'Thermo CryoStar NX70', 'Cryostat', 'Thermo Fisher', 'CryoStar NX70', 'TF-2023-091', 'Frozen Section Lab - Room 205', 'operational', '2024-01-14', '2024-04-14', '2024-01-11', 'Frozen section cryostat'),
        ('EQ-016', 'DAKO Omnis Platform', 'IHC/ISH Stainer', 'Agilent/DAKO', 'Omnis', 'DK-2024-008', 'IHC Lab - Room 203', 'operational', '2024-01-15', '2024-04-15', '2024-01-12', 'Dual IHC/ISH staining platform')
      `);
      console.log('✓ Lab Equipment seeded');

      // Seed Audit Logs (20 items)
      await client.query(`
        INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details, ip_address, created_at) VALUES
        ('admin@pathlab.com', 'LOGIN', 'user', 1, 'Successful login', '192.168.1.100', '2024-01-15 08:00:00'),
        ('pathologist@pathlab.com', 'LOGIN', 'user', 2, 'Successful login', '192.168.1.101', '2024-01-15 08:15:00'),
        ('pathologist@pathlab.com', 'VIEW', 'slide', 1, 'Viewed slide SLD-001', '192.168.1.101', '2024-01-15 08:30:00'),
        ('pathologist@pathlab.com', 'AI_ANALYSIS', 'slide', 1, 'Initiated AI analysis for SLD-001', '192.168.1.101', '2024-01-15 08:35:00'),
        ('pathologist@pathlab.com', 'SIGN_REPORT', 'report', 1, 'Signed pathology report RPT-001', '192.168.1.101', '2024-01-20 14:00:00'),
        ('reviewer@pathlab.com', 'LOGIN', 'user', 4, 'Successful login', '192.168.1.102', '2024-01-16 09:00:00'),
        ('reviewer@pathlab.com', 'REVIEW', 'report', 2, 'Reviewed report RPT-002', '192.168.1.102', '2024-01-21 10:00:00'),
        ('technician@pathlab.com', 'LOGIN', 'user', 3, 'Successful login', '192.168.1.103', '2024-01-16 07:00:00'),
        ('technician@pathlab.com', 'CREATE', 'slide', 4, 'Created slide SLD-004', '192.168.1.103', '2024-01-18 09:00:00'),
        ('technician@pathlab.com', 'QC_CHECK', 'quality_control', 1, 'Performed QC check QC-001', '192.168.1.103', '2024-01-15 11:00:00'),
        ('admin@pathlab.com', 'UPDATE', 'settings', NULL, 'Updated AI analysis settings', '192.168.1.100', '2024-01-17 16:00:00'),
        ('pathologist@pathlab.com', 'ANNOTATE', 'slide', 1, 'Added annotation to SLD-001', '192.168.1.101', '2024-01-15 09:00:00'),
        ('pathologist@pathlab.com', 'AI_CANCER_DETECT', 'slide', 2, 'Ran cancer detection on SLD-002', '192.168.1.101', '2024-01-16 10:00:00'),
        ('admin@pathlab.com', 'CREATE', 'patient', 18, 'Added patient PAT-018', '192.168.1.100', '2024-02-01 08:30:00'),
        ('technician@pathlab.com', 'QC_FAIL', 'quality_control', 7, 'QC failed for slide SLD-007', '192.168.1.103', '2024-01-21 14:00:00'),
        ('pathologist@pathlab.com', 'UPDATE', 'case', 9, 'Updated case CASE-009 status', '192.168.1.101', '2024-01-28 16:00:00'),
        ('admin@pathlab.com', 'BILLING', 'billing', 1, 'Generated invoice INV-001', '192.168.1.100', '2024-01-20 17:00:00'),
        ('reviewer@pathlab.com', 'APPROVE', 'report', 3, 'Approved report RPT-003', '192.168.1.102', '2024-01-22 11:00:00'),
        ('technician@pathlab.com', 'MAINTENANCE', 'equipment', 4, 'Logged maintenance for Philips UFS', '192.168.1.103', '2024-01-15 15:00:00'),
        ('admin@pathlab.com', 'EXPORT', 'report', NULL, 'Exported monthly statistics', '192.168.1.100', '2024-02-01 09:00:00')
      `);
      console.log('✓ Audit Logs seeded');

      // Seed Settings (16 items)
      await client.query(`
        INSERT INTO settings (key, value, category, description) VALUES
        ('ai_auto_analysis', 'true', 'AI', 'Automatically run AI analysis on new slides'),
        ('ai_confidence_threshold', '80', 'AI', 'Minimum confidence score to flag findings (percentage)'),
        ('ai_cancer_detection_enabled', 'true', 'AI', 'Enable AI cancer detection module'),
        ('ai_cell_classification_enabled', 'true', 'AI', 'Enable AI cell classification module'),
        ('ai_tissue_segmentation_enabled', 'true', 'AI', 'Enable AI tissue segmentation module'),
        ('default_magnification', '40x', 'Scanning', 'Default slide scanning magnification'),
        ('scan_resolution_dpi', '0.25', 'Scanning', 'Scan resolution in microns per pixel'),
        ('report_auto_generate', 'false', 'Reports', 'Auto-generate draft reports from AI findings'),
        ('report_require_signature', 'true', 'Reports', 'Require digital signature on reports'),
        ('qc_auto_check', 'true', 'Quality', 'Automatically run QC checks on new scans'),
        ('qc_minimum_score', '6.0', 'Quality', 'Minimum QC score for passing'),
        ('billing_auto_invoice', 'true', 'Billing', 'Automatically generate invoices for completed cases'),
        ('billing_default_currency', 'USD', 'Billing', 'Default billing currency'),
        ('audit_log_retention_days', '365', 'System', 'Days to retain audit log entries'),
        ('session_timeout_minutes', '60', 'System', 'User session timeout in minutes'),
        ('max_concurrent_analyses', '5', 'System', 'Maximum concurrent AI analyses')
      `);
      console.log('✓ Settings seeded');

      console.log('\n✅ All seed data inserted successfully!');
      console.log('📊 Summary:');
      console.log('   - 4 Users');
      console.log('   - 18 Patients');
      console.log('   - 20 Slides');
      console.log('   - 18 AI Analyses');
      console.log('   - 16 Cancer Detections');
      console.log('   - 18 Cell Classifications');
      console.log('   - 16 Tissue Segmentations');
      console.log('   - 16 Pathology Reports');
      console.log('   - 16 Cases');
      console.log('   - 16 Quality Controls');
      console.log('   - 18 Annotations');
      console.log('   - 18 Billing Records');
      console.log('   - 16 Lab Equipment');
      console.log('   - 20 Audit Logs');
      console.log('   - 16 Settings');

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await pool.end();
  }
}

seed();
