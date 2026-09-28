// Dashboard JavaScript
let currentUser = null;
let userStats = {
  totalScans: 0,
  scamAlerts: 0,
  riskScore: 0,
  recentScans: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  loadDashboardData();
  setupEventListeners();
  loadRecentActivity();
  initializeTheme();
});

// Initialize Authentication
function initializeAuth() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      currentUser = user;
      document.getElementById('username').textContent = user.displayName || user.email;
      loadUserStats();
    } else {
      window.location.href = 'login.html';
    }
  });
}

// Setup Event Listeners
function setupEventListeners() {
  document.getElementById('quickUrlForm').addEventListener('submit', analyzeQuickUrl);
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
}

// Load Dashboard Data
function loadDashboardData() {
  if (!currentUser) return;

  const userRef = firebase.firestore().collection('users').doc(currentUser.uid);
  userRef.get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      userStats.totalScans = data.totalScans || 0;
      userStats.scamAlerts = data.scamAlerts || 0;
      userStats.riskScore = data.riskScore || 0;
      userStats.recentScans = data.recentScans || 0;
      updateDashboardStats();
    }
  }).catch(error => {
    console.error('Error loading dashboard:', error);
  });
}

// Update Dashboard Statistics
function updateDashboardStats() {
  document.getElementById('totalScans').textContent = userStats.totalScans;
  document.getElementById('scamAlerts').textContent = userStats.scamAlerts;
  document.getElementById('riskScore').textContent = userStats.riskScore + '%';
  document.getElementById('recentScans').textContent = userStats.recentScans || '—';
}

// Load User Stats
function loadUserStats() {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid).get().then(doc => {
    if (doc.exists) {
      const stats = doc.data();
      userStats = {
        totalScans: stats.totalScans || 0,
        scamAlerts: stats.scamAlerts || 0,
        riskScore: stats.avgRiskScore || 0,
        recentScans: stats.recentScans || 0
      };
      updateDashboardStats();
    }
  });
}

// Analyze Quick URL
function analyzeQuickUrl(e) {
  e.preventDefault();
  const url = document.getElementById('quickUrlInput').value;
  const resultDiv = document.getElementById('quickUrlResult');

  if (!url) {
    showError(resultDiv, 'Please enter a URL');
    return;
  }

  resultDiv.innerHTML = '<p class="loading">Analyzing URL...</p>';

  // Simulate URL analysis
  setTimeout(() => {
    const riskScore = Math.floor(Math.random() * 100);
    const isScam = riskScore > 60;

    resultDiv.innerHTML = `
      <div class="result-box ${isScam ? 'danger' : 'success'}">
        <h4>${isScam ? '⚠️ Warning!' : '✅ Safe'}</h4>
        <p><strong>Risk Score:</strong> ${riskScore}%</p>
        <p><strong>Status:</strong> ${isScam ? 'Suspicious' : 'Safe'}</p>
        <a href="url-analysis.html?url=${encodeURIComponent(url)}" class="btn secondary">View Full Analysis</a>
      </div>
    `;

    // Save to history
    saveAnalysisToHistory('url', url, riskScore);
  }, 1500);
}

// Load Recent Activity
function loadRecentActivity() {
  if (!currentUser) return;

  const activityDiv = document.getElementById('recentActivity');
  firebase.firestore().collection('users').doc(currentUser.uid)
    .collection('scanHistory')
    .orderBy('timestamp', 'desc')
    .limit(5)
    .get()
    .then(snapshot => {
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        html += `
          <div class="activity-item">
            <span class="activity-type">${data.type.toUpperCase()}</span>
            <span class="activity-content">${data.content.substring(0, 50)}...</span>
            <span class="activity-time">${new Date(data.timestamp.toDate()).toLocaleDateString()}</span>
          </div>
        `;
      });

      if (html) {
        activityDiv.innerHTML = html;
      } else {
        activityDiv.innerHTML = '<p class="placeholder">No recent activity</p>';
      }
    });
}

// Save Analysis to History
function saveAnalysisToHistory(type, content, riskScore) {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid)
    .collection('scanHistory')
    .add({
      type: type,
      content: content,
      riskScore: riskScore,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      loadRecentActivity();
      loadUserStats();
    })
    .catch(error => console.error('Error saving history:', error));
}

// Show Error Message
function showError(element, message) {
  element.innerHTML = `<div class="error-box"><p>❌ ${message}</p></div>`;
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
