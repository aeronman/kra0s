-- ============================================
-- KRA0S MySQL Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS neuroscan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE neuroscan;

-- ============================================
-- USERS / CREDENTIALS
-- ============================================
CREATE TABLE users (
    user_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    role           ENUM('admin', 'doctor', 'researcher') DEFAULT 'doctor',
    is_active      TINYINT(1) DEFAULT 1,
    last_login     DATETIME NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============================================
-- PATIENTS
-- ============================================
CREATE TABLE patients (
    patient_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_code       VARCHAR(50) NOT NULL UNIQUE,
    full_name          VARCHAR(150) NOT NULL,
    date_of_birth      DATE NULL,
    age                INT NULL,
    gender             ENUM('Male', 'Female', 'Other') NOT NULL,
    diagnosis          VARCHAR(255) NULL,
    status             ENUM('Normal', 'Follow-up', 'Review', 'Critical') DEFAULT 'Normal',
    notes              TEXT NULL,
    created_by         INT UNSIGNED NULL,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_patient_code (patient_code),
    INDEX idx_status (status),
    INDEX idx_name (full_name)
) ENGINE=InnoDB;

-- ============================================
-- PATIENT IMAGES (DICOM / Uploaded Scans)
-- ============================================
CREATE TABLE patient_images (
    image_id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id         INT UNSIGNED NOT NULL,
    uploaded_by        INT UNSIGNED NULL,
    filename           VARCHAR(255) NOT NULL,
    original_filename  VARCHAR(255) NOT NULL,
    file_path          VARCHAR(500) NOT NULL,
    file_size          BIGINT NULL,
    mime_type          VARCHAR(100) NULL,
    modality           VARCHAR(50) DEFAULT 'MRI',
    scan_date          DATE NULL,
    body_part          VARCHAR(100) NULL,
    description        TEXT NULL,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_patient (patient_id),
    INDEX idx_scan_date (scan_date)
) ENGINE=InnoDB;

-- ============================================
-- ANALYSIS RUNS
-- ============================================
CREATE TABLE analysis_runs (
    run_id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id         INT UNSIGNED NOT NULL,
    image_id           INT UNSIGNED NULL,
    triggered_by       INT UNSIGNED NULL,
    analysis_type      VARCHAR(100) NOT NULL,
    model_version      VARCHAR(50) NULL,
    status             ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    started_at         DATETIME NULL,
    completed_at       DATETIME NULL,
    created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES patient_images(image_id) ON DELETE SET NULL,
    FOREIGN KEY (triggered_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_patient (patient_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- ANALYSIS RESULTS
-- ============================================
CREATE TABLE analysis_results (
    result_id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    run_id                   INT UNSIGNED NOT NULL UNIQUE,

    -- Parametric Maps (Hybrid IVIM-DKI Model)
    param_f                  DECIMAL(6,4) NULL COMMENT 'Perfusion fraction',
    param_d                  DECIMAL(6,4) NULL COMMENT 'Diffusion coefficient',
    param_d_star             DECIMAL(6,4) NULL COMMENT 'Pseudodiffusion',
    param_k                  DECIMAL(6,4) NULL COMMENT 'Kurtosis',
    parametric_maps_json     JSON NULL COMMENT 'Full parametric map data',

    -- Persistence Diagram / Topological Analysis
    betti1_count             INT NULL COMMENT 'Number of identified holes (Betti-1)',
    topological_complexity   ENUM('Low', 'Medium', 'High') NULL,
    persistence_signatures   JSON NULL COMMENT 'Topological signature points',

    -- Tumor Morphology
    tumor_diameter_cm        DECIMAL(6,2) NULL COMMENT 'Maximal diameter in cm',
    tumor_volume_cm3         DECIMAL(8,2) NULL COMMENT 'Volume in cm³',
    tumor_volume_percent     VARCHAR(20) NULL COMMENT 'e.g. 12% of Pancreatic Head',

    -- Molecular Phenotype (KRAS)
    kras_classification      ENUM('G12D', 'G12V', 'Wild-type') NULL,
    kras_confidence          DECIMAL(5,2) NULL COMMENT 'Confidence percentage',
    kras_alternatives        JSON NULL COMMENT 'Alternative classifications with scores',

    -- Surgical Metrics
    r0_resectability_pct     DECIMAL(5,2) NULL COMMENT 'Probability of R0 resection',
    is_resectable            TINYINT(1) NULL,
    smv_proximity_mm         DECIMAL(6,2) NULL COMMENT 'Distance to SMV in mm',
    smv_proximity_risk       ENUM('Low', 'Medium', 'High') NULL,
    surgical_finding         TEXT NULL,

    -- Overall Confidence
    confidence_level         TINYINT NULL COMMENT 'Overall confidence 0-100',
    confidence_reason        TEXT NULL,

    created_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES analysis_runs(run_id) ON DELETE CASCADE,
    INDEX idx_kras (kras_classification),
    INDEX idx_resectable (is_resectable),
    INDEX idx_confidence (confidence_level)
) ENGINE=InnoDB;

-- ============================================
-- SYSTEM / AUDIT LOG (Optional)
-- ============================================
CREATE TABLE audit_log (
    log_id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNSIGNED NULL,
    action           VARCHAR(100) NOT NULL,
    entity_type      VARCHAR(50) NULL,
    entity_id        INT UNSIGNED NULL,
    details          JSON NULL,
    ip_address       VARCHAR(45) NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@neuroscan.ai', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin'),
('doctor@neuroscan.ai', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Sarah Smith', 'doctor');

-- password for both is "password"

INSERT INTO patients (patient_code, full_name, date_of_birth, age, gender, diagnosis, status) VALUES
('PT-2024-001', 'Sarah Johnson', '1979-03-15', 45, 'Female', 'No abnormalities detected', 'Normal'),
('PT-2024-002', 'Michael Chen', '1962-08-22', 62, 'Male', 'Mild white matter changes', 'Follow-up'),
('PT-2024-003', 'Emily Rodriguez', '1986-11-05', 38, 'Female', 'Small lesion detected', 'Review');

INSERT INTO analysis_runs (patient_id, analysis_type, model_version, status, started_at, completed_at) VALUES
(3, 'Pancreatic Tumor', 'KRA0S v3.2', 'completed', NOW() - INTERVAL 1 HOUR, NOW());

INSERT INTO analysis_results (
    run_id,
    param_f, param_d, param_d_star, param_k,
    betti1_count, topological_complexity,
    tumor_diameter_cm, tumor_volume_cm3, tumor_volume_percent,
    kras_classification, kras_confidence, kras_alternatives,
    r0_resectability_pct, is_resectable, smv_proximity_mm, smv_proximity_risk, surgical_finding,
    confidence_level, confidence_reason
) VALUES (
    1,
    0.2800, 0.8500, 0.1200, 0.9200,
    42, 'High',
    2.80, 14.20, '12% of Pancreatic Head',
    'G12D', 94.00,
    JSON_OBJECT('G12D', 94, 'G12V', 8, 'Wild-type', 3),
    45.00, 1, 2.00, 'High',
    'Presence of KRAS+ signals within 2mm of the Superior Mesenteric Vein Boundary',
    90, 'Images show HIGH Kurtosis Value'
);
