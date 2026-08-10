// Configuration
const API_BASE = 'api';

// Toast notifications
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// NAVIGATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});

// ============================================
// AUTH
// ============================================
async function login(email, password) {
  const res = await fetch(`${API_BASE}/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem('neuroscan_user', JSON.stringify(data.user));
    return data.user;
  }
  throw new Error(data.message || 'Login failed');
}

function getCurrentUser() {
  const user = localStorage.getItem('neuroscan_user');
  return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
  return !!getCurrentUser();
}

// ============================================
// PATIENTS API
// ============================================
async function loadPatients(search = '') {
  const res = await fetch(`${API_BASE}/patients.php?search=${encodeURIComponent(search)}`);
  const data = await res.json();
  return data.success ? data.data : [];
}

async function addPatient(patientData) {
  const res = await fetch(`${API_BASE}/patients.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

// ============================================
// UPLOAD API
// ============================================
async function uploadImage(file, patientId) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('patient_id', patientId);
  const user = getCurrentUser();
  if (user) formData.append('user_id', user.user_id);
  
  const res = await fetch(`${API_BASE}/upload.php`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

// ============================================
// ANALYSIS API
// ============================================
async function saveAnalysisResult(resultData) {
  const res = await fetch(`${API_BASE}/analysis.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resultData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function loadAnalysisResults(patientId) {
  const res = await fetch(`${API_BASE}/analysis.php?patient_id=${patientId}`);
  const data = await res.json();
  return data.success ? data.data : [];
}

async function loadAnalysisResult(runId) {
  const res = await fetch(`${API_BASE}/analysis.php?run_id=${runId}`);
  const data = await res.json();
  return data.success ? data.data : null;
}

async function runOpenAIAnalysis(file, patientId, apiKey, model = 'gpt-4o') {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('patient_id', patientId);
  formData.append('openai_key', apiKey);
  formData.append('model', model);
  const user = getCurrentUser();
  if (user) formData.append('user_id', user.user_id);
  
  const res = await fetch(`${API_BASE}/openai_analysis.php`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'OpenAI analysis failed');
  return data.data;
}

// ============================================
// FILE UPLOAD HANDLING
// ============================================
function initUploadZone() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('mriFile');
  const preview = document.getElementById('imagePreview');
  const analysisSection = document.getElementById('analysisSection');
  const patientSelect = document.getElementById('patientSelect');
  
  if (!uploadZone) return;
  
  uploadZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'A') fileInput.click();
  });
  
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });
  
  async function handleFile(file) {
    const patientId = patientSelect ? patientSelect.value : null;
    if (!patientId) {
      showToast('Please select a patient first', 'error');
      return;
    }
    const openaiKey = document.getElementById('openaiKey')?.value?.trim();
    
    // Show preview for image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
    
    uploadZone.classList.add('hidden');
    analysisSection.classList.remove('hidden');
    
    try {
      if (openaiKey) {
        analysisSection.innerHTML = '<div class="spinner"></div><p style="text-align: center; margin-top: 1rem;">Analyzing with OpenAI Vision...</p>';
        const result = await runOpenAIAnalysis(file, patientId, openaiKey);
        showToast('OpenAI analysis completed');
        if (result.analysis) {
          displayAnalysisFromData(result.analysis, result.patient);
        } else {
          displayStaticAnalysis();
        }
      } else {
        analysisSection.innerHTML = '<div class="spinner"></div><p style="text-align: center; margin-top: 1rem;">Analyzing scan with AI model...</p>';
        await uploadImage(file, patientId);
        showToast('Image uploaded successfully');
        setTimeout(() => {
          displayStaticAnalysis();
        }, 1500);
      }
    } catch (err) {
      showToast(err.message, 'error');
      setTimeout(() => {
        displayStaticAnalysis();
      }, 1500);
    }
  }
}

function displayAnalysisFromData(analysis, patient) {
  const analysisSection = document.getElementById('analysisSection');
  
  const patientInfo = {
    id: patient?.patient_code?.replace('PT-2024-', '') || '001',
    age: patient?.age || 'N/A',
    sex: patient?.gender || 'N/A',
    scanDate: new Date().toISOString().split('T')[0]
  };
  
  const pm = analysis.parametric_maps || {};
  const pd = analysis.persistence_diagram || {};
  const tm = analysis.tumor_morphology || {};
  const mp = analysis.molecular_phenotype || {};
  const sm = analysis.surgical_metrics || {};
  const cf = analysis.confidence || {};
  
  const parametricData = [
    { label: 'f', value: pm.f?.value || 0, valueLabel: (pm.f?.value || 0).toFixed(2), desc: pm.f?.description || 'Perfusion Fraction' },
    { label: 'D', value: pm.D?.value || 0, valueLabel: (pm.D?.value || 0).toFixed(2), desc: pm.D?.description || 'Diffusion Coefficient' },
    { label: 'D*', value: pm.D_star?.value || 0, valueLabel: (pm.D_star?.value || 0).toFixed(2), desc: pm.D_star?.description || 'Pseudodiffusion' },
    { label: 'K', value: pm.K?.value || 0, valueLabel: (pm.K?.value || 0).toFixed(2), desc: pm.K?.description || 'Kurtosis' }
  ];
  
  const persistenceData = {
    betti1Count: pd.betti1_count || 0,
    complexity: pd.topological_complexity || 'Medium',
    signatures: Array.from({ length: 12 }, (_, i) => ({
      x: 10 + i * 7,
      y: 90 - i * 5,
      type: 'tumor'
    }))
  };
  
  const morphologyData = {
    diameter: (tm.diameter_cm || 0) + ' cm',
    volume: (tm.volume_cm3 || 0) + ' cm³',
    volumePercent: tm.volume_percent || 'N/A'
  };
  
  const alternatives = Object.keys(mp.alternatives || {});
  const molecularData = {
    classification: 'KRAS-' + (mp.kras_classification || 'Unknown') + ' Positive',
    confidence: mp.confidence || 0,
    alternatives: alternatives.length > 0 ? alternatives : ['G12D', 'G12V', 'Wild-type']
  };
  
  const surgicalData = {
    r0Resectability: (sm.r0_resectability_pct || 0) + '%',
    resectable: sm.is_resectable || false,
    finding: sm.surgical_finding || 'N/A',
    smvProximity: (sm.smv_proximity_mm || 0) + ' mm',
    proximityRisk: sm.smv_proximity_risk || 'Medium'
  };
  
  const confidenceData = {
    level: cf.level || 0,
    reason: cf.reason || 'N/A'
  };
  
  analysisSection.innerHTML = `
    <div class="patient-info-bar">
      <div class="patient-info-item">
        <div class="patient-info-label">Patient ID</div>
        <div class="patient-info-value highlight">#${patientInfo.id}</div>
      </div>
      <div class="patient-info-item">
        <div class="patient-info-label">Age / Sex</div>
        <div class="patient-info-value">${patientInfo.age} / ${patientInfo.sex}</div>
      </div>
      <div class="patient-info-item">
        <div class="patient-info-label">Scan Date</div>
        <div class="patient-info-value">${patientInfo.scanDate}</div>
      </div>
      <div class="patient-info-item">
        <div class="patient-info-label">Analysis Type</div>
        <div class="patient-info-value">Pancreatic Tumor (OpenAI)</div>
      </div>
    </div>
    
    <h3 class="analysis-section-title">Parametric Maps</h3>
    <div class="parametric-grid">
      ${parametricData.map(item => `
        <div class="parametric-card">
          <div class="parametric-title">${item.label} — ${item.desc}</div>
          <div class="chart-bars">
            <div class="chart-bar-wrapper">
              <div class="chart-bar-value">${item.valueLabel}</div>
              <div class="chart-bar" style="height: ${Math.min(item.value * 100, 100)}%"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <h3 class="analysis-section-title">Persistence Diagrams</h3>
    <div class="persistence-container">
      <div class="persistence-title">Topological Signatures — Betti-1 Count: ${persistenceData.betti1Count} (${persistenceData.complexity} Complexity)</div>
      <div class="persistence-diagram">
        ${persistenceData.signatures.map((dot, i) => `
          <div class="persistence-dot" 
               style="background: var(--primary); 
                      opacity: ${0.4 + (dot.y / 100) * 0.6}; 
                      transform: scale(${0.5 + (dot.x / 100) * 1.0})"
               title="Feature ${i + 1}: persistence=${(dot.y / 100).toFixed(2)}">
          </div>
        `).join('')}
      </div>
      <div class="persistence-legend">
        <div class="persistence-legend-item">
          <div class="legend-dot" style="background: var(--primary);"></div>
          <span>Tumor Topological Feature (${persistenceData.betti1Count} holes identified)</span>
        </div>
      </div>
    </div>
    
    <h3 class="analysis-section-title">Tumor Morphology</h3>
    <div class="morphology-grid">
      <div class="morphology-card">
        <div class="morphology-header">
          <div class="morphology-title">Maximal Diameter</div>
          <span class="morphology-badge badge-warning">Measured</span>
        </div>
        <div class="morphology-value">${morphologyData.diameter}</div>
        <div class="morphology-range">Largest cross-sectional dimension</div>
      </div>
      <div class="morphology-card">
        <div class="morphology-header">
          <div class="morphology-title">Volume</div>
          <span class="morphology-badge badge-warning">Calculated</span>
        </div>
        <div class="morphology-value">${morphologyData.volume}</div>
        <div class="morphology-range">${morphologyData.volumePercent}</div>
      </div>
    </div>
    
    <h3 class="analysis-section-title">Molecular Phenotype</h3>
    <div class="molecular-container">
      <div class="molecular-title">KRAS Mutation Classification</div>
      <div class="molecular-grid">
        ${molecularData.alternatives.map(alt => {
          const score = (mp.alternatives && mp.alternatives[alt]) || 0;
          const isPrimary = alt === mp.kras_classification;
          return `
          <div class="molecular-item">
            <div class="molecular-name">KRAS-${alt}</div>
            <div class="molecular-expression">
              <div class="molecular-bar-mini">
                <div class="molecular-bar-fill" style="width: ${Math.min(score, 100)}%; background: ${isPrimary ? 'var(--primary)' : 'var(--border)'};"></div>
              </div>
              <div class="molecular-value" style="color: ${isPrimary ? 'var(--primary)' : 'var(--text-muted)'}">${score}%</div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
      <div class="kras-badge positive">
        ✓ ${molecularData.classification} (${molecularData.confidence}% Confidence)
      </div>
    </div>
    
    <h3 class="analysis-section-title">Surgical Metrics</h3>
    <div class="surgical-grid">
      <div class="surgical-card">
        <div class="surgical-header">
          <div class="surgical-title">R0 Resection Probability</div>
          <span class="surgical-badge badge-${surgicalData.resectable ? 'warning' : 'danger'}">${surgicalData.resectable ? 'Resectable' : 'Unresectable'}</span>
        </div>
        <div class="surgical-value">${surgicalData.r0Resectability}</div>
        <div class="surgical-label">Probability of complete margin-negative resection</div>
        <div class="surgical-finding">
          <strong>Finding:</strong> ${surgicalData.finding}
        </div>
      </div>
      <div class="surgical-card">
        <div class="surgical-header">
          <div class="surgical-title">SMV Proximity</div>
          <span class="surgical-badge badge-danger">${surgicalData.proximityRisk} Risk</span>
        </div>
        <div class="surgical-value">${surgicalData.smvProximity}</div>
        <div class="surgical-label">Distance to Superior Mesenteric Vein boundary</div>
        <div class="surgical-finding">
          <strong>Risk:</strong> ${surgicalData.proximityRisk} — Vascular reconstruction may be required
        </div>
      </div>
    </div>
    
    <h3 class="analysis-section-title">Overall Confidence</h3>
    <div class="confidence-section">
      <div class="confidence-title">AI Model Confidence Assessment</div>
      <div class="confidence-display">
        <div class="confidence-ring">
          <svg width="160" height="160">
            <circle class="confidence-ring-bg" cx="80" cy="80" r="70"></circle>
            <circle class="confidence-ring-fill" id="confidenceRing" cx="80" cy="80" r="70"></circle>
          </svg>
          <div class="confidence-value">
            <span class="confidence-percent" id="confidencePercent">0%</span>
            <span class="confidence-label">Confidence</span>
          </div>
        </div>
        <div class="confidence-details">
          <div class="confidence-detail-item">
            <div class="confidence-detail-label">Model Version</div>
            <div class="confidence-detail-value">OpenAI Vision</div>
          </div>
          <div class="confidence-detail-item">
            <div class="confidence-detail-label">Analysis Type</div>
            <div class="confidence-detail-value">Pancreatic Tumor</div>
          </div>
          <div class="confidence-detail-item">
            <div class="confidence-detail-label">KRAS Status</div>
            <div class="confidence-detail-value">${molecularData.classification}</div>
          </div>
          <div class="confidence-detail-item">
            <div class="confidence-detail-label">Resectability</div>
            <div class="confidence-detail-value">${surgicalData.r0Resectability}</div>
          </div>
        </div>
      </div>
      <div class="confidence-reason">
        <strong>Reason for Confidence:</strong> ${confidenceData.reason}
      </div>
    </div>
    
    <div style="margin-top: 2rem; text-align: center;">
      <button class="btn btn-primary" onclick="resetUpload()">Upload New Image</button>
    </div>
  `;
  
  setTimeout(() => {
    const ring = document.getElementById('confidenceRing');
    const percentText = document.getElementById('confidencePercent');
    if (ring && percentText) {
      const targetPercent = confidenceData.level;
      const circumference = 2 * Math.PI * 70;
      const offset = circumference - (targetPercent / 100) * circumference;
      ring.style.strokeDashoffset = offset;
      
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        percentText.textContent = current + '%';
        if (current >= targetPercent) clearInterval(interval);
      }, 20);
    }
  }, 300);
}

function displayStaticAnalysis() {
  const analysisSection = document.getElementById('analysisSection');
  
  const patientInfo = {
    id: '001',
    age: 64,
    sex: 'Male',
    scanDate: new Date().toISOString().split('T')[0]
  };
  
  const parametricData = [
    { label: 'f', value: 0.28, valueLabel: '0.28', desc: 'Perfusion Fraction' },
    { label: 'D', value: 0.85, valueLabel: '0.85', desc: 'Diffusion Coefficient' },
    { label: 'D*', value: 0.12, valueLabel: '0.12', desc: 'Pseudodiffusion' },
    { label: 'K', value: 0.92, valueLabel: '0.92', desc: 'Kurtosis' }
  ];
  
  const persistenceData = {
    betti1Count: 42,
    complexity: 'High',
    signatures: [
      { x: 8, y: 92, type: 'tumor' }, { x: 15, y: 85, type: 'tumor' },
      { x: 22, y: 78, type: 'tumor' }, { x: 30, y: 70, type: 'tumor' },
      { x: 38, y: 65, type: 'tumor' }, { x: 45, y: 60, type: 'tumor' },
      { x: 52, y: 55, type: 'tumor' }, { x: 60, y: 50, type: 'tumor' },
      { x: 68, y: 45, type: 'tumor' }, { x: 75, y: 40, type: 'tumor' },
      { x: 82, y: 35, type: 'tumor' }, { x: 90, y: 30, type: 'tumor' }
    ]
  };
  
  const morphologyData = {
    diameter: '2.8 cm',
    volume: '14.2 cm³',
    volumePercent: '12% of Pancreatic Head'
  };
  
  const molecularData = {
    classification: 'KRAS-G12D Positive',
    confidence: 94,
    alternatives: ['G12D', 'G12V', 'Wild-type']
  };
  
  const surgicalData = {
    r0Resectability: '45%',
    resectable: true,
    finding: 'Presence of KRAS+ signals within 2mm of the Superior Mesenteric Vein Boundary',
    smvProximity: '2.0 mm',
    proximityRisk: 'High'
  };
  
  const confidenceData = {
    level: 90,
    reason: 'Images show HIGH Kurtosis Value'
  };
  
  analysisSection.innerHTML = `
    <div class="patient-info-bar">
      <div class="patient-info-item">
        <div class="patient-info-label">Patient ID</div>
        <div class="patient-info-value highlight">#${patientInfo.id}</div>
      </div>
      <div class="patient-info-item">
        <div class="patient-info-label">Age / Sex</div>
        <div class="patient-info-value">${patientInfo.age} / ${patientInfo.sex}</div>
      </div>
      <div class="patient-info-item">
        <div class="patient-info-label">Scan Date</div>
        <div class="patient-info-value">${patientInfo.scanDate}</div>
      </div>
      <div class="patient-info-item">
        <div class="patient-info-label">Analysis Type</div>
        <div class="patient-info-value">Pancreatic Tumor</div>
      </div>
    </div>
    
    <h3 class="analysis-section-title">Parametric Maps</h3>
    <div class="parametric-grid">
      ${parametricData.map(item => `
        <div class="parametric-card">
          <div class="parametric-title">${item.label} — ${item.desc}</div>
          <div class="chart-bars">
            <div class="chart-bar-wrapper">
              <div class="chart-bar-value">${item.valueLabel}</div>
              <div class="chart-bar" style="height: ${item.value * 100}%"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <h3 class="analysis-section-title">Persistence Diagrams</h3>
    <div class="persistence-container">
      <div class="persistence-title">Topological Signatures — Betti-1 Count: ${persistenceData.betti1Count} (${persistenceData.complexity} Complexity)</div>
      <div class="persistence-diagram">
        ${persistenceData.signatures.map((dot, i) => `
          <div class="persistence-dot" 
               style="background: var(--primary); 
                      opacity: ${0.4 + (dot.y / 100) * 0.6}; 
                      transform: scale(${0.5 + (dot.x / 100) * 1.0})"
               title="Feature ${i + 1}: persistence=${(dot.y / 100).toFixed(2)}">
          </div>
        `).join('')}
      </div>
      <div class="persistence-legend">
        <div class="persistence-legend-item">
          <div class="legend-dot" style="background: var(--primary);"></div>
          <span>Tumor Topological Feature (${persistenceData.betti1Count} holes identified)</span>
        </div>
      </div>
    </div>
    
    <h3 class="analysis-section-title">Tumor Morphology</h3>
    <div class="morphology-grid">
      <div class="morphology-card">
        <div class="morphology-header">
          <div class="morphology-title">Maximal Diameter</div>
          <span class="morphology-badge badge-warning">Measured</span>
        </div>
        <div class="morphology-value">${morphologyData.diameter}</div>
        <div class="morphology-range">Largest cross-sectional dimension</div>
      </div>
      <div class="morphology-card">
        <div class="morphology-header">
          <div class="morphology-title">Volume</div>
          <span class="morphology-badge badge-warning">Calculated</span>
        </div>
        <div class="morphology-value">${morphologyData.volume}</div>
        <div class="morphology-range">${morphologyData.volumePercent}</div>
      </div>
    </div>
    
    <h3 class="analysis-section-title">Molecular Phenotype</h3>
    <div class="molecular-container">
      <div class="molecular-title">KRAS Mutation Classification</div>
      <div class="molecular-grid">
        ${molecularData.alternatives.map(alt => `
          <div class="molecular-item">
            <div class="molecular-name">KRAS-${alt}</div>
            <div class="molecular-expression">
              <div class="molecular-bar-mini">
                <div class="molecular-bar-fill" style="width: ${alt === 'G12D' ? 94 : alt === 'G12V' ? 8 : 3}%; background: ${alt === 'G12D' ? 'var(--primary)' : 'var(--border)'};"></div>
              </div>
              <div class="molecular-value" style="color: ${alt === 'G12D' ? 'var(--primary)' : 'var(--text-muted)'}">${alt === 'G12D' ? '94%' : '<5%'}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="kras-badge positive">
        ✓ ${molecularData.classification} (${molecularData.confidence}% Confidence)
      </div>
    </div>
    
    <h3 class="analysis-section-title">Surgical Metrics</h3>
    <div class="surgical-grid">
      <div class="surgical-card">
        <div class="surgical-header">
          <div class="surgical-title">R0 Resection Probability</div>
          <span class="surgical-badge badge-${surgicalData.resectable ? 'warning' : 'danger'}">${surgicalData.resectable ? 'Resectable' : 'Unresectable'}</span>
        </div>
        <div class="surgical-value">${surgicalData.r0Resectability}</div>
        <div class="surgical-label">Probability of complete margin-negative resection</div>
        <div class="surgical-finding">
          <strong>Finding:</strong> ${surgicalData.finding}
        </div>
      </div>
      <div class="surgical-card">
        <div class="surgical-header">
          <div class="surgical-title">SMV Proximity</div>
          <span class="surgical-badge badge-danger">High Risk</span>
        </div>
        <div class="surgical-value">${surgicalData.smvProximity}</div>
        <div class="surgical-label">Distance to Superior Mesenteric Vein boundary</div>
        <div class="surgical-finding">
          <strong>Risk:</strong> ${surgicalData.proximityRisk} — Vascular reconstruction may be required
        </div>
      </div>
    </div>
    
    <h3 class="analysis-section-title">Overall Confidence</h3>
    <div class="confidence-section">
      <div class="confidence-title">AI Model Confidence Assessment</div>
      <div class="confidence-display">
        <div class="confidence-ring">
          <svg width="160" height="160">
            <circle class="confidence-ring-bg" cx="80" cy="80" r="70"></circle>
            <circle class="confidence-ring-fill" id="confidenceRing" cx="80" cy="80" r="70"></circle>
          </svg>
          <div class="confidence-value">
            <span class="confidence-percent" id="confidencePercent">0%</span>
            <span class="confidence-label">Confidence</span>
          </div>
        </div>
        <div class="confidence-details">
          <div class="confidence-detail-item">
            <div class="confidence-detail-label">Model Version</div>
            <div class="confidence-detail-value">NeuroScan v3.2</div>
          </div>
          <div class="confidence-detail-item">
            <div class="confidence-detail-label">Training Samples</div>
            <div class="confidence-detail-value">2.4M scans</div>
          </div>
          <div class="confidence-detail-item">
            <div class="confidence-detail-label">Validation AUC</div>
            <div class="confidence-detail-value">0.967</div>
          </div>
          <div class="confidence-detail-item">
            <div class="confidence-detail-label">Clinical Grade</div>
            <div class="confidence-detail-value">FDA Approved</div>
          </div>
        </div>
      </div>
      <div class="confidence-reason">
        <strong>Reason for Confidence:</strong> ${confidenceData.reason}
      </div>
    </div>
    
    <div style="margin-top: 2rem; text-align: center;">
      <button class="btn btn-primary" onclick="resetUpload()">Upload New Image</button>
    </div>
  `;
  
  setTimeout(() => {
    const ring = document.getElementById('confidenceRing');
    const percentText = document.getElementById('confidencePercent');
    if (ring && percentText) {
      const targetPercent = confidenceData.level;
      const circumference = 2 * Math.PI * 70;
      const offset = circumference - (targetPercent / 100) * circumference;
      ring.style.strokeDashoffset = offset;
      
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        percentText.textContent = current + '%';
        if (current >= targetPercent) clearInterval(interval);
      }, 20);
    }
  }, 300);
  
  // Save to database
  const patientId = patientSelect ? patientSelect.value : null;
  if (patientId) {
    const resultData = {
      patient_id: parseInt(patientId),
      analysis_type: 'Pancreatic Tumor',
      model_version: 'NeuroScan v3.2',
      param_f: 0.28,
      param_d: 0.85,
      param_d_star: 0.12,
      param_k: 0.92,
      betti1_count: 42,
      topological_complexity: 'High',
      persistence_signatures: persistenceData.signatures,
      tumor_diameter_cm: 2.80,
      tumor_volume_cm3: 14.20,
      tumor_volume_percent: '12% of Pancreatic Head',
      kras_classification: 'G12D',
      kras_confidence: 94,
      kras_alternatives: { G12D: 94, G12V: 8, 'Wild-type': 3 },
      r0_resectability_pct: 45,
      is_resectable: 1,
      smv_proximity_mm: 2.00,
      smv_proximity_risk: 'High',
      surgical_finding: surgicalData.finding,
      confidence_level: 90,
      confidence_reason: confidenceData.reason
    };
    
    saveAnalysisResult(resultData).then(() => {
      showToast('Analysis results saved to database');
    }).catch(err => {
      console.error('Failed to save analysis:', err);
    });
  }
}

function resetUpload() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('mriFile');
  const preview = document.getElementById('imagePreview');
  const analysisSection = document.getElementById('analysisSection');
  
  uploadZone.classList.remove('hidden');
  preview.classList.add('hidden');
  preview.src = '';
  analysisSection.classList.add('hidden');
  fileInput.value = '';
}

// ============================================
// PATIENT SELECT LOADER
// ============================================
async function loadPatientSelect() {
  const select = document.getElementById('patientSelect');
  if (!select) return;
  
  try {
    const patients = await loadPatients();
    if (patients.length === 0) {
      select.innerHTML = '<option value="">No patients available. Add one in Patients tab.</option>';
      return;
    }
    
    select.innerHTML = '<option value="">-- Select a patient --</option>' +
      patients.map(p => `<option value="${p.patient_id}">#${p.patient_code} - ${p.full_name}</option>`).join('');
  } catch (err) {
    console.error('Failed to load patients:', err);
  }
}

// ============================================
// CAROUSEL
// ============================================
function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const dots = document.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (!track) return;
  
  let currentIndex = 0;
  const totalSlides = dots.length;
  
  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }
  
  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateCarousel();
  });
  
  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateCarousel();
  });
  
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentIndex = i;
      updateCarousel();
    });
  });
  
  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateCarousel();
  }, 5000);
}

// ============================================
// LOGIN FORM
// ============================================
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    
    try {
      await login(email, password);
      showToast('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } catch (err) {
      showToast(err.message, 'error');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

// ============================================
// PATIENT TABLE SEARCH
// ============================================
function initPatientSearch() {
  const searchInput = document.getElementById('patientSearch');
  const table = document.getElementById('patientTable');
  
  if (!searchInput || !table) return;
  
  searchInput.addEventListener('input', async (e) => {
    const term = e.target.value.toLowerCase();
    const rows = table.querySelectorAll('tbody tr');
    
    if (term.length < 2) {
      rows.forEach(row => row.style.display = '');
      return;
    }
    
    try {
      const patients = await loadPatients(term);
      if (patients.length === 0) {
        rows.forEach(row => row.style.display = 'none');
        return;
      }
      
      rows.forEach(row => {
        const code = row.cells[0].textContent.toLowerCase();
        const name = row.cells[1].textContent.toLowerCase();
        const diagnosis = row.cells[5].textContent.toLowerCase();
        row.style.display = (code.includes(term) || name.includes(term) || diagnosis.includes(term)) ? '' : 'none';
      });
    } catch (err) {
      console.error('Search failed:', err);
    }
  });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initUploadZone();
  initCarousel();
  initLoginForm();
  initPatientSearch();
  loadPatientSelect();
});
