const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'pathology_analyzer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'pathologist',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        patient_id VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(20),
        phone VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        medical_history TEXT,
        insurance_provider VARCHAR(100),
        status VARCHAR(30) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS slides (
        id SERIAL PRIMARY KEY,
        slide_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        tissue_type VARCHAR(100) NOT NULL,
        stain_type VARCHAR(100) NOT NULL,
        organ VARCHAR(100),
        collection_date DATE,
        lab_technician VARCHAR(100),
        scanner_model VARCHAR(100),
        magnification VARCHAR(20),
        image_url TEXT,
        status VARCHAR(30) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        slide_id INTEGER REFERENCES slides(id) ON DELETE CASCADE,
        analysis_type VARCHAR(50) NOT NULL,
        status VARCHAR(30) DEFAULT 'completed',
        confidence_score DECIMAL(5,2),
        findings TEXT,
        ai_model VARCHAR(100),
        processing_time_ms INTEGER,
        result_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cancer_detections (
        id SERIAL PRIMARY KEY,
        slide_id INTEGER REFERENCES slides(id) ON DELETE CASCADE,
        cancer_type VARCHAR(100),
        probability DECIMAL(5,4),
        grade VARCHAR(20),
        stage VARCHAR(20),
        location_data JSONB,
        markers TEXT,
        recommendation TEXT,
        status VARCHAR(30) DEFAULT 'completed',
        reviewed_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cell_classifications (
        id SERIAL PRIMARY KEY,
        slide_id INTEGER REFERENCES slides(id) ON DELETE CASCADE,
        cell_type VARCHAR(100) NOT NULL,
        count INTEGER,
        percentage DECIMAL(5,2),
        morphology VARCHAR(100),
        abnormality_flag BOOLEAN DEFAULT false,
        confidence DECIMAL(5,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tissue_segmentations (
        id SERIAL PRIMARY KEY,
        slide_id INTEGER REFERENCES slides(id) ON DELETE CASCADE,
        segment_type VARCHAR(100) NOT NULL,
        area_percentage DECIMAL(5,2),
        boundary_data JSONB,
        tissue_class VARCHAR(100),
        health_status VARCHAR(50),
        density_score DECIMAL(5,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pathology_reports (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        slide_id INTEGER REFERENCES slides(id) ON DELETE CASCADE,
        pathologist VARCHAR(100),
        diagnosis TEXT,
        microscopic_findings TEXT,
        gross_description TEXT,
        clinical_history TEXT,
        recommendations TEXT,
        status VARCHAR(30) DEFAULT 'draft',
        signed_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        case_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        case_type VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'normal',
        assigned_pathologist VARCHAR(100),
        status VARCHAR(30) DEFAULT 'open',
        diagnosis TEXT,
        turnaround_days INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quality_controls (
        id SERIAL PRIMARY KEY,
        qc_id VARCHAR(50) UNIQUE NOT NULL,
        slide_id INTEGER REFERENCES slides(id) ON DELETE CASCADE,
        inspector VARCHAR(100),
        stain_quality VARCHAR(20),
        tissue_integrity VARCHAR(20),
        scan_quality VARCHAR(20),
        overall_score DECIMAL(3,1),
        pass_fail VARCHAR(10),
        issues TEXT,
        corrective_action TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS annotations (
        id SERIAL PRIMARY KEY,
        slide_id INTEGER REFERENCES slides(id) ON DELETE CASCADE,
        annotator VARCHAR(100),
        annotation_type VARCHAR(50),
        label VARCHAR(100),
        coordinates JSONB,
        description TEXT,
        color VARCHAR(20),
        is_ai_generated BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS billing_records (
        id SERIAL PRIMARY KEY,
        invoice_id VARCHAR(50) UNIQUE NOT NULL,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        slide_id INTEGER REFERENCES slides(id) ON DELETE CASCADE,
        service_type VARCHAR(100),
        amount DECIMAL(10,2),
        currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(30) DEFAULT 'pending',
        insurance_claim VARCHAR(50),
        billing_date DATE,
        due_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lab_equipment (
        id SERIAL PRIMARY KEY,
        equipment_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50),
        manufacturer VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        location VARCHAR(100),
        status VARCHAR(30) DEFAULT 'operational',
        last_maintenance DATE,
        next_maintenance DATE,
        calibration_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        category VARCHAR(50),
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables initialized successfully');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
