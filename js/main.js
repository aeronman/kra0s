// Navigation
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});

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

// File upload handling
function initUploadZone() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('mriFile');
  const preview = document.getElementById('imagePreview');
  const analysisSection = document.getElementById('analysisSection');
  
  if (!uploadZone) return;
  
  uploadZone.addEventListener('click', () => fileInput.click());
  
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
  
  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
      uploadZone.classList.add('hidden');
      analysisSection.classList.remove('hidden');
      
      // Show loading state
      analysisSection.innerHTML = '<div class="spinner"></div>';
      
      // Simulate analysis with static values
      setTimeout(() => {
        displayStaticAnalysis();
      }, 1500);
    };
    reader.readAsDataURL(file);
  }
}

function displayStaticAnalysis() {
  const analysisSection = document.getElementById('analysisSection');
  
  const patientInfo = {
    id: '001',
    age: 64,
    sex: 'Male',
    scanDate: '2024-12-15'
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
      { x: 8, y: 92, type: 'tumor' },
      { x: 15, y: 85, type: 'tumor' },
      { x: 22, y: 78, type: 'tumor' },
      { x: 30, y: 70, type: 'tumor' },
      { x: 38, y: 65, type: 'tumor' },
      { x: 45, y: 60, type: 'tumor' },
      { x: 52, y: 55, type: 'tumor' },
      { x: 60, y: 50, type: 'tumor' },
      { x: 68, y: 45, type: 'tumor' },
      { x: 75, y: 40, type: 'tumor' },
      { x: 82, y: 35, type: 'tumor' },
      { x: 90, y: 30, type: 'tumor' }
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

// Carousel
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
  
  // Auto-advance
  setInterval(() => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateCarousel();
  }, 5000);
}

// Login form
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    // Simulate login
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Signing in...';
    btn.disabled = true;
    
    setTimeout(() => {
      showToast('Login successful! Redirecting...');
      btn.textContent = originalText;
      btn.disabled = false;
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }, 1500);
  });
}

// Patient table search
function initPatientSearch() {
  const searchInput = document.getElementById('patientSearch');
  const table = document.getElementById('patientTable');
  
  if (!searchInput || !table) return;
  
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
  });
}

// Initialize all features
document.addEventListener('DOMContentLoaded', () => {
  initUploadZone();
  initCarousel();
  initLoginForm();
  initPatientSearch();
});