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
  
  const results = [
    { label: 'Scan Type', value: 'MRI Brain', status: 'normal' },
    { label: 'Tissue Density', value: '1.04 g/cm³', status: 'normal' },
    { label: 'Abnormality Score', value: '12%', status: 'normal' },
    { label: 'Confidence Level', value: '94.2%', status: 'normal' },
    { label: 'Processing Time', value: '0.8s', status: 'normal' },
    { label: 'Region of Interest', value: 'Frontal Lobe', status: 'normal' }
  ];
  
  analysisSection.innerHTML = `
    <div class="analysis-grid">
      ${results.map(r => `
        <div class="analysis-item">
          <div class="analysis-label">${r.label}</div>
          <div class="analysis-value ${r.status}">${r.value}</div>
        </div>
      `).join('')}
    </div>
    <div style="margin-top: 2rem; text-align: center;">
      <button class="btn btn-primary" onclick="resetUpload()">Upload New Image</button>
    </div>
  `;
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