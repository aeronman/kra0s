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
  
  const parametricData = [
    { label: 'T1', value: 65, valueLabel: '0.65' },
    { label: 'T2', value: 82, valueLabel: '0.82' },
    { label: 'ADC', value: 45, valueLabel: '0.45' },
    { label: 'DWI', value: 73, valueLabel: '0.73' },
    { label: 'DCE', value: 58, valueLabel: '0.58' },
    { label: 'FLAIR', value: 91, valueLabel: '0.91' }
  ];
  
  const persistenceData = [
    { x: 12, y: 45, type: 'tumor', label: 'T1' },
    { x: 25, y: 38, type: 'tumor', label: 'T2' },
    { x: 38, y: 52, type: 'tumor', label: 'T3' },
    { x: 45, y: 28, type: 'necrosis', label: 'N1' },
    { x: 55, y: 65, type: 'tumor', label: 'T4' },
    { x: 62, y: 22, type: 'necrosis', label: 'N2' },
    { x: 70, y: 48, type: 'tumor', label: 'T5' },
    { x: 78, y: 35, type: 'tumor', label: 'T6' },
    { x: 85, y: 58, type: 'tumor', label: 'T7' }
  ];
  
  const morphologyData = [
    { 
      title: 'Volume', 
      value: '24.8 cm³', 
      percent: 74,
      color: 'var(--primary)',
      status: 'warning'
    },
    { 
      title: 'Sphericity', 
      value: '0.82', 
      percent: 82,
      color: 'var(--success)',
      status: 'normal'
    },
    { 
      title: 'Surface Area', 
      value: '142 cm²', 
      percent: 65,
      color: 'var(--warning)',
      status: 'warning'
    },
    { 
      title: 'Solidity', 
      value: '0.91', 
      percent: 91,
      color: 'var(--success)',
      status: 'normal'
    }
  ];
  
  const surgicalData = [
    { icon: '📐', value: '3.2 cm', label: 'Tumor Diameter' },
    { icon: '📍', value: 'Head', label: 'Location' },
    { icon: '🔗', value: '85%', label: 'Vascular Involvement' },
    { icon: '📊', value: '2.1 cm', label: 'Margin Distance' },
    { icon: '🎯', value: '94%', label: 'Resectability' },
    { icon: '⏱️', value: '4.5 hrs', label: 'Est. Duration' }
  ];
  
  const molecularData = [
    { name: 'KRAS', expression: 87, value: 'Mutated' },
    { name: 'TP53', expression: 65, value: 'Mutated' },
    { name: 'SMAD4', expression: 42, value: 'Deleted' },
    { name: 'CDKN2A', expression: 78, value: 'Mutated' },
    { name: 'BRCA2', expression: 15, value: 'Wild-type' },
    { name: 'PALB2', expression: 23, value: 'Wild-type' }
  ];
  
  analysisSection.innerHTML = `
    
    <div class="parametric-grid">
      ${parametricData.map(item => `
        <div class="parametric-card">
          <div class="parametric-title">${item.label} Parametric Map</div>
          <div class="chart-bars">
            <div class="chart-bar-wrapper">
              <div class="chart-bar-value">${item.valueLabel}</div>
              <div class="chart-bar" style="height: ${item.value}%"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    
    <h3 class="analysis-section-title">Persistence Diagrams</h3>
    <div class="persistence-container">
      <div class="persistence-title">Topological Features Distribution</div>
      <div class="persistence-diagram">
        ${persistenceData.map(dot => `
          <div class="persistence-dot" 
               style="background: ${dot.type === 'tumor' ? 'var(--primary)' : 'var(--danger)'}; 
                      opacity: ${0.5 + (dot.y / 100) * 0.5}; 
                      transform: scale(${0.6 + (dot.x / 100) * 0.8})"
               title="${dot.label}: (${dot.x}, ${dot.y})">
          </div>
        `).join('')}
      </div>
      <div class="persistence-legend">
        <div class="persistence-legend-item">
          <div class="legend-dot" style="background: var(--primary);"></div>
          <span>Tumor Region</span>
        </div>
        <div class="persistence-legend-item">
          <div class="legend-dot" style="background: var(--danger);"></div>
          <span>Necrotic Region</span>
        </div>
      </div>
    </div>
    
    <h3 class="analysis-section-title">Tumor Morphology</h3>
    <div class="morphology-grid">
      ${morphologyData.map(item => `
        <div class="morphology-card">
          <div class="morphology-header">
            <div class="morphology-title">${item.title}</div>
            <span class="morphology-badge badge-${item.status}">${item.status}</span>
          </div>
          <div class="morphology-value">${item.value}</div>
          <div class="morphology-bar">
            <div class="morphology-bar-fill" style="width: ${item.percent}%; background: ${item.color};"></div>
          </div>
          <div class="morphology-range">${item.percent}% of expected range</div>
        </div>
      `).join('')}
    </div>
    
    <h3 class="analysis-section-title">Surgical Metrics</h3>
    <div class="surgical-grid">
      ${surgicalData.map(item => `
        <div class="surgical-card">
          <div class="surgical-icon">${item.icon}</div>
          <div class="surgical-value">${item.value}</div>
          <div class="surgical-label">${item.label}</div>
        </div>
      `).join('')}
    </div>
    
    <h3 class="analysis-section-title">Molecular Phenotype</h3>
    <div class="molecular-container">
      <div class="molecular-title">Gene Expression Analysis</div>
      <div class="molecular-grid">
        ${molecularData.map(item => `
          <div class="molecular-item">
            <div class="molecular-name">${item.name}</div>
            <div class="molecular-expression">
              <div class="molecular-bar-mini">
                <div class="molecular-bar-fill" style="width: ${item.expression}%; background: ${item.expression > 70 ? 'var(--danger)' : item.expression > 40 ? 'var(--warning)' : 'var(--success)'};"></div>
              </div>
              <div class="molecular-value">${item.value}</div>
            </div>
          </div>
        `).join('')}
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
    </div>
    
    <div style="margin-top: 2rem; text-align: center;">
      <button class="btn btn-primary" onclick="resetUpload()">Upload New Image</button>
    </div>
  `;
  
  setTimeout(() => {
    const ring = document.getElementById('confidenceRing');
    const percentText = document.getElementById('confidencePercent');
    if (ring && percentText) {
      const targetPercent = 94;
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