// URL Analysis JavaScript
let currentUser = null;
let analysisHistory = [];

document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  setupEventListeners();
  loadAnalysisHistory();
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
  document.getElementById('urlAnalysisForm').addEventListener('submit', analyzeUrl);
  document.getElementById('exportReportBtn').addEventListener('click', exportReport);
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
}

// Analyze URL
function analyzeUrl(e) {
  e.preventDefault();
  const url = document.getElementById('urlInput').value;
  const resultDiv = document.getElementById('analysisResult');

  if (!url) {
    showError('Please enter a valid URL');
    return;
  }

  resultDiv.classList.remove('hidden');
  document.querySelector('.result-card').innerHTML = '<p class="loading">🔍 Analyzing URL...</p>';

  // Simulate URL analysis
  setTimeout(() => {
    const analysis = performUrlAnalysis(url);
    displayAnalysisResults(analysis);
    saveAnalysisToHistory(analysis);
  }, 2000);
}

// Perform URL Analysis
function performUrlAnalysis(url) {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;

  // Simulate analysis results
  const riskScore = Math.floor(Math.random() * 100);
  const isSecure = url.startsWith('https');

  const scamIndicators = [];
  const recommendations = [];

  // Check for suspicious patterns
  if (domain.includes('-') && domain.split('-').length > 3) {
    scamIndicators.push('⚠️ Domain has multiple hyphens (suspicious)');
  }

  if (!isSecure) {
    scamIndicators.push('🔓 No HTTPS - insecure connection');
    recommendations.push('Use HTTPS URLs only for sensitive transactions');
  } else {
    recommendations.push('✅ HTTPS enabled - connection is secure');
  }

  if (domain.length > 50) {
    scamIndicators.push('⚠️ Unusually long domain name');
    recommendations.push('Verify this is the intended website');
  }

  // Simulate domain age
  const domainAge = Math.floor(Math.random() * 20) + 1;
  if (domainAge < 6) {
    scamIndicators.push('⚠️ Domain is relatively new (less than 6 months)');
  }

  if (scamIndicators.length === 0) {
    recommendations.push('✅ Domain appears legitimate');
    recommendations.push('✅ No major red flags detected');
  }

  return {
    url: url,
    domain: domain,
    riskScore: riskScore,
    isSecure: isSecure,
    domainAge: domainAge,
    sslStatus: isSecure ? '✅ Valid SSL Certificate' : '❌ No SSL Certificate',
    scamIndicators: scamIndicators,
    recommendations: recommendations
  };
}

// Display Analysis Results
function displayAnalysisResults(analysis) {
  const resultCard = document.querySelector('.result-card');

  const riskColor = analysis.riskScore > 70 ? '#ff4444' : (analysis.riskScore > 40 ? '#ffaa00' : '#44ff44');

  let indicatorsHtml = '';
  if (analysis.scamIndicators.length > 0) {
    analysis.scamIndicators.forEach(indicator => {
      indicatorsHtml += `<li>${indicator}</li>`;
    });
  } else {
    indicatorsHtml = '<li class="placeholder">No indicators detected</li>';
  }

  let recommendationsHtml = '';
  analysis.recommendations.forEach(rec => {
    recommendationsHtml += `<li>${rec}</li>`;
  });

  resultCard.innerHTML = `
    <h2>Analysis Results</h2>

    <div class="risk-meter">
      <div class="meter-label">Risk Score</div>
      <div class="meter-bar">
        <div class="meter-fill" style="width: ${analysis.riskScore}%; background: ${riskColor};"></div>
      </div>
      <div class="meter-value">${analysis.riskScore}%</div>
    </div>

    <div class="grid two-columns">
      <div class="info-box">
        <h3>Domain Information</h3>
        <table id="domainInfo">
          <tr>
            <td class="label">Domain:</td>
            <td>${analysis.domain}</td>
          </tr>
          <tr>
            <td class="label">Created:</td>
            <td>~${analysis.domainAge} years ago</td>
          </tr>
          <tr>
            <td class="label">URL Scheme:</td>
            <td>${analysis.isSecure ? 'HTTPS' : 'HTTP'}</td>
          </tr>
        </table>
      </div>

      <div class="info-box">
        <h3>SSL & Security</h3>
        <table>
          <tr>
            <td class="label">SSL Status:</td>
            <td>${analysis.sslStatus}</td>
          </tr>
          <tr>
            <td class="label">Security:</td>
            <td>${analysis.isSecure ? '✅ Secure' : '❌ Insecure'}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="info-box">
      <h3>⚠️ Scam Indicators</h3>
      <ul class="indicators-list">
        ${indicatorsHtml}
      </ul>
    </div>

    <div class="info-box">
      <h3>✅ Safety Recommendations</h3>
      <ul class="recommendations-list">
        ${recommendationsHtml}
      </ul>
    </div>

    <button id="exportReportBtn" class="btn secondary">📥 Export Report</button>
  `;

  // Re-attach event listener
  document.getElementById('exportReportBtn').addEventListener('click', () => exportReport(analysis));
}

// Load Analysis History
function loadAnalysisHistory() {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid)
    .collection('urlAnalysis')
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get()
    .then(snapshot => {
      const historyBody = document.getElementById('historyBody');
      let html = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        html += `
          <tr>
            <td>${data.url}</td>
            <td>${data.riskScore}%</td>
            <td>${data.riskScore > 60 ? '⚠️ Suspicious' : '✅ Safe'}</td>
            <td>${new Date(data.timestamp.toDate()).toLocaleDateString()}</td>
            <td>
              <button class="btn small secondary" onclick="viewAnalysis('${data.url}')">View</button>
            </td>
          </tr>
        `;
      });

      if (html) {
        historyBody.innerHTML = html;
      } else {
        historyBody.innerHTML = '<tr><td colspan="5" class="placeholder">No analysis history</td></tr>';
      }
    });
}

// Save Analysis to History
function saveAnalysisToHistory(analysis) {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid)
    .collection('urlAnalysis')
    .add({
      url: analysis.url,
      domain: analysis.domain,
      riskScore: analysis.riskScore,
      isSecure: analysis.isSecure,
      indicators: analysis.scamIndicators,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      loadAnalysisHistory();
    })
    .catch(error => console.error('Error saving analysis:', error));
}

// Export Report
function exportReport(analysis) {
  let reportContent = `
URL ANALYSIS REPORT
==================
Generated: ${new Date().toLocaleString()}

URL: ${analysis.url}
Domain: ${analysis.domain}
Risk Score: ${analysis.riskScore}%

SECURITY STATUS:
${analysis.sslStatus}

SCAM INDICATORS:
${analysis.scamIndicators.length > 0 ? analysis.scamIndicators.join('\n') : 'None detected'}

RECOMMENDATIONS:
${analysis.recommendations.join('\n')}
  `;

  const blob = new Blob([reportContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `url-analysis-report-${Date.now()}.txt`;
  a.click();
}

// View Analysis
function viewAnalysis(url) {
  document.getElementById('urlInput').value = url;
  analyzeUrl({ preventDefault: () => {} });
}

// Show Error
function showError(message) {
  alert('❌ ' + message);
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
