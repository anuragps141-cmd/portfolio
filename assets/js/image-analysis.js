// Image Analysis JavaScript
let currentUser = null;
let selectedFile = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  setupEventListeners();
  setupDragAndDrop();
  initializeTheme();
});

// Initialize Authentication
function initializeAuth() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
    } else {
      window.location.href = 'login.html';
    }
  });
}

// Setup Event Listeners
function setupEventListeners() {
  document.getElementById('imageAnalysisForm').addEventListener('submit', analyzeImage);
  document.getElementById('imageInput').addEventListener('change', handleImageSelect);
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
}

// Setup Drag and Drop
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone');

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.background = 'rgba(100, 150, 255, 0.2)';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.background = '';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.background = '';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      document.getElementById('imageInput').files = files;
      handleImageSelect({ target: { files: files } });
    }
  });
}

// Handle Image Select
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  selectedFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = (event) => {
    const preview = document.getElementById('imagePreview');
    preview.classList.remove('hidden');
    document.getElementById('previewImg').src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// Analyze Image
function analyzeImage(e) {
  e.preventDefault();

  if (!selectedFile) {
    alert('❌ Please select an image');
    return;
  }

  const resultDiv = document.getElementById('imageResult');
  resultDiv.classList.remove('hidden');
  document.querySelector('.result-card').innerHTML = '<p class="loading">🔍 Analyzing image...</p>';

  // Simulate image analysis
  setTimeout(() => {
    const analysis = performImageAnalysis();
    displayImageResults(analysis);
  }, 3000);
}

// Perform Image Analysis
function performImageAnalysis() {
  const file = selectedFile;
  const img = document.getElementById('previewImg');

  const fakescreenshot = Math.random() > 0.7;
  const aiGenerated = Math.random() > 0.8;
  const scamIndicators = [];
  const riskScore = Math.floor(Math.random() * 100);

  if (fakescreenshot) {
    scamIndicators.push('⚠️ Possible screenshot manipulation detected');
  }

  if (aiGenerated) {
    scamIndicators.push('🤖 Image may be AI-generated');
  }

  if (Math.random() > 0.6) {
    scamIndicators.push('⚠️ Text content appears suspicious');
  }

  if (scamIndicators.length === 0) {
    scamIndicators.push('✅ No obvious scam indicators detected');
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    width: img.naturalWidth,
    height: img.naturalHeight,
    fakescreenshot: fakescreenshot,
    aiGenerated: aiGenerated,
    scamIndicators: scamIndicators,
    riskScore: riskScore,
    ocrText: 'Click here to verify your account. Limited time offer.',
    qrDetected: Math.random() > 0.8
  };
}

// Display Image Results
function displayImageResults(analysis) {
  const resultCard = document.querySelector('.result-card');
  const riskColor = analysis.riskScore > 70 ? '#ff4444' :
                    analysis.riskScore > 40 ? '#ffaa00' : '#44ff44';

  let indicatorsHtml = '';
  analysis.scamIndicators.forEach(ind => {
    indicatorsHtml += `<li>${ind}</li>`;
  });

  resultCard.innerHTML = `
    <h2>Image Analysis Results</h2>

    <div class="grid two-columns">
      <div class="info-box">
        <h3>📝 OCR Text Extraction</h3>
        <div class="text-extraction">
          <p>"${analysis.ocrText}"</p>
        </div>
      </div>

      <div class="info-box">
        <h3>📊 Image Metadata</h3>
        <table id="imageMetadata">
          <tr>
            <td class="label">Size:</td>
            <td>${(analysis.fileSize / 1024).toFixed(2)} KB</td>
          </tr>
          <tr>
            <td class="label">Format:</td>
            <td>${analysis.fileType}</td>
          </tr>
          <tr>
            <td class="label">Dimensions:</td>
            <td>${analysis.width} x ${analysis.height}px</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="grid two-columns">
      <div class="info-box">
        <h3>⚠️ Fake Screenshot Detection</h3>
        <div class="detection-result">
          ${analysis.fakescreenshot
            ? '<p>⚠️ This image shows signs of being a fake screenshot</p>'
            : '<p>✅ No fake screenshot indicators detected</p>'
          }
        </div>
      </div>

      <div class="info-box">
        <h3>🤖 AI-Generated Image Warning</h3>
        <div class="detection-result">
          ${analysis.aiGenerated
            ? '<p>⚠️ This image may be AI-generated</p>'
            : '<p>✅ Image appears to be authentic</p>'
          }
        </div>
      </div>
    </div>

    <div class="info-box">
      <h3>🔗 QR Code Analysis</h3>
      <div class="qr-result">
        ${analysis.qrDetected
          ? '<p>⚠️ QR code detected - use caution when scanning</p>'
          : '<p>✅ No QR code detected</p>'
        }
      </div>
    </div>

    <div class="info-box">
      <h3>🚨 Scam Detection Indicators</h3>
      <ul class="indicators-list">
        ${indicatorsHtml}
      </ul>
    </div>

    <div class="risk-meter">
      <div class="meter-label">Risk Assessment</div>
      <div class="meter-bar">
        <div class="meter-fill" style="width: ${100 - analysis.riskScore}%; background: ${riskColor};"></div>
      </div>
      <div class="meter-value">${100 - analysis.riskScore}% Safe</div>
    </div>
  `;
}

// Initialize Theme
function initializeTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

// Toggle Theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Logout
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = 'login.html';
  });
}
