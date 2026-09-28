// Message Analysis JavaScript
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  setupEventListeners();
  loadMessageHistory();
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
  document.getElementById('messageAnalysisForm').addEventListener('submit', analyzeMessage);
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
}

// Analyze Message
function analyzeMessage(e) {
  e.preventDefault();
  const message = document.getElementById('messageInput').value;
  const messageType = document.getElementById('messageType').value;
  const resultDiv = document.getElementById('messageResult');

  if (!message || message.trim().length < 10) {
    alert('❌ Please enter a message (at least 10 characters)');
    return;
  }

  resultDiv.classList.remove('hidden');
  document.querySelector('.result-card').innerHTML = '<p class="loading">🔍 Analyzing message...</p>';

  // Simulate message analysis
  setTimeout(() => {
    const analysis = performMessageAnalysis(message, messageType);
    displayMessageResults(analysis);
    saveMessageToHistory(analysis);
  }, 2000);
}

// Perform Message Analysis
function performMessageAnalysis(message, type) {
  const scamProbability = Math.floor(Math.random() * 100);

  const phishingIndicators = [];
  const fraudIndicators = [];
  const recommendations = [];

  const suspiciousKeywords = ['click', 'urgent', 'verify', 'confirm', 'action required',
                               'update', 'account', 'limited time', 'winner', 'claim',
                               'free', 'bitcoin', 'payment', 'security alert'];

  suspiciousKeywords.forEach(keyword => {
    if (message.toLowerCase().includes(keyword)) {
      fraudIndicators.push(`⚠️ Contains trigger word: "${keyword}"`);
    }
  });

  // Check for phishing patterns
  if (message.includes('click here') || message.includes('verify') || message.includes('confirm')) {
    phishingIndicators.push('🎣 Requests user action/verification');
  }

  if (message.includes('http://') && !message.includes('https://')) {
    phishingIndicators.push('🎣 Contains unencrypted links');
  }

  // Grammar and spelling checks
  const allCaps = (message.match(/[A-Z]/g) || []).length > message.length * 0.3;
  if (allCaps) {
    fraudIndicators.push('⚠️ Excessive use of capital letters');
  }

  // Recommendations
  if (phishingIndicators.length > 0) {
    recommendations.push('⚠️ Do not click links in suspicious messages');
    recommendations.push('✅ Go directly to the company website instead');
  }

  if (fraudIndicators.length > 0) {
    recommendations.push('⚠️ Never share personal information via message');
    recommendations.push('✅ Contact the organization directly to verify');
  }

  if (phishingIndicators.length === 0 && fraudIndicators.length === 0) {
    recommendations.push('✅ Message appears legitimate');
    recommendations.push('✅ But always verify suspicious requests independently');
  }

  const explanation = scamProbability > 70
    ? 'This message shows multiple signs of being a scam. Do not interact with it.'
    : scamProbability > 40
    ? 'This message has some suspicious characteristics. Verify with caution.'
    : 'This message appears to be legitimate, but always be cautious.';

  return {
    message: message,
    type: type,
    scamProbability: scamProbability,
    explanation: explanation,
    phishingIndicators: phishingIndicators,
    fraudIndicators: fraudIndicators,
    recommendations: recommendations
  };
}

// Display Message Results
function displayMessageResults(analysis) {
  const resultCard = document.querySelector('.result-card');
  const riskColor = analysis.scamProbability > 70 ? '#ff4444' :
                    analysis.scamProbability > 40 ? '#ffaa00' : '#44ff44';

  let phishingHtml = '';
  if (analysis.phishingIndicators.length > 0) {
    analysis.phishingIndicators.forEach(ind => {
      phishingHtml += `<li>${ind}</li>`;
    });
  } else {
    phishingHtml = '<li class="placeholder">No phishing indicators</li>';
  }

  let fraudHtml = '';
  if (analysis.fraudIndicators.length > 0) {
    analysis.fraudIndicators.forEach(ind => {
      fraudHtml += `<li>${ind}</li>`;
    });
  } else {
    fraudHtml = '<li class="placeholder">No fraud indicators</li>';
  }

  let recommendationsHtml = '';
  analysis.recommendations.forEach(rec => {
    recommendationsHtml += `<li>${rec}</li>`;
  });

  resultCard.innerHTML = `
    <h2>Analysis Results</h2>

    <div class="risk-meter">
      <div class="meter-label">Scam Probability</div>
      <div class="meter-bar">
        <div class="meter-fill" style="width: ${analysis.scamProbability}%; background: ${riskColor};"></div>
      </div>
      <div class="meter-value">${analysis.scamProbability}%</div>
    </div>

    <div class="grid two-columns">
      <div class="info-box">
        <h3>🤖 AI Analysis</h3>
        <p class="explanation">${analysis.explanation}</p>
      </div>

      <div class="info-box">
        <h3>⚠️ Message Type</h3>
        <p><strong>Type:</strong> ${analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)}</p>
        <p><strong>Length:</strong> ${analysis.message.length} characters</p>
      </div>
    </div>

    <div class="grid two-columns">
      <div class="info-box">
        <h3>🎣 Phishing Indicators</h3>
        <ul class="indicators-list">
          ${phishingHtml}
        </ul>
      </div>

      <div class="info-box">
        <h3>🚨 Fraud Indicators</h3>
        <ul class="indicators-list">
          ${fraudHtml}
        </ul>
      </div>
    </div>

    <div class="info-box">
      <h3>✅ Safety Recommendations</h3>
      <ul class="recommendations-list">
        ${recommendationsHtml}
      </ul>
    </div>
  `;
}

// Load Message History
function loadMessageHistory() {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid)
    .collection('messageAnalysis')
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get()
    .then(snapshot => {
      const historyBody = document.getElementById('messageHistoryBody');
      let html = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        const preview = data.message.substring(0, 50) + '...';
        html += `
          <tr>
            <td>${preview}</td>
            <td>${data.type}</td>
            <td>${data.scamScore}%</td>
            <td>${data.scamScore > 60 ? '⚠️ Suspicious' : '✅ Safe'}</td>
            <td>${new Date(data.timestamp.toDate()).toLocaleDateString()}</td>
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

// Save Message to History
function saveMessageToHistory(analysis) {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid)
    .collection('messageAnalysis')
    .add({
      message: analysis.message,
      type: analysis.type,
      scamScore: analysis.scamProbability,
      indicators: analysis.fraudIndicators,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      loadMessageHistory();
    })
    .catch(error => console.error('Error saving analysis:', error));
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
