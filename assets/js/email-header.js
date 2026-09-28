// Email Header Analyzer JavaScript
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  setupEventListeners();
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
  document.getElementById('emailHeaderForm').addEventListener('submit', analyzeEmailHeader);
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
}

// Analyze Email Header
function analyzeEmailHeader(e) {
  e.preventDefault();
  const header = document.getElementById('emailHeaderInput').value;
  const resultDiv = document.getElementById('emailResult');

  if (!header || header.trim().length < 50) {
    alert('❌ Please paste a valid email header');
    return;
  }

  resultDiv.classList.remove('hidden');
  document.querySelector('.result-card').innerHTML = '<p class="loading">🔍 Analyzing email header...</p>';

  // Simulate header analysis
  setTimeout(() => {
    const analysis = performEmailAnalysis(header);
    displayEmailResults(analysis);
  }, 2000);
}

// Perform Email Analysis
function performEmailAnalysis(header) {
  const fromMatch = header.match(/From:\s*(.+)/i);
  const replyToMatch = header.match(/Reply-To:\s*(.+)/i);
  const returnPathMatch = header.match(/Return-Path:\s*(.+)/i);
  const spfMatch = header.match(/Received-SPF:\s*(.+)/i);
  const authMatch = header.match(/Authentication-Results:\s*(.+)/i);

  const fromEmail = fromMatch ? fromMatch[1].trim() : 'Unknown';
  const replyTo = replyToMatch ? replyToMatch[1].trim() : 'Same as From';
  const returnPath = returnPathMatch ? returnPathMatch[1].trim() : 'Not specified';

  const fromDomain = fromEmail.includes('@') ? fromEmail.split('@')[1] : 'Unknown';
  const replyDomain = replyTo.includes('@') ? replyTo.split('@')[1] : fromDomain;

  const routingIssues = [];
  const spamIndicators = [];
  const recommendations = [];

  // Check SPF
  const spfStatus = spfMatch ? (spfMatch[1].includes('pass') ? '✅ Pass' : '❌ Fail') : '⚠️ Not found';

  // Check DKIM
  const dkimStatus = authMatch && authMatch[1].includes('dkim=pass') ? '✅ Pass' : '❌ Fail';

  // Check DMARC
  const dmarcStatus = authMatch && authMatch[1].includes('dmarc=pass') ? '✅ Pass' : '❌ Fail';

  // Detect mismatched domains
  if (fromDomain !== replyDomain) {
    routingIssues.push('⚠️ Reply-To domain differs from From domain');
  }

  if (spfStatus === '❌ Fail') {
    spamIndicators.push('🚨 SPF check failed');
    recommendations.push('⚠️ Email may not be from authentic sender');
  }

  if (dkimStatus === '❌ Fail') {
    spamIndicators.push('🚨 DKIM signature invalid or missing');
  }

  if (dmarcStatus === '❌ Fail') {
    spamIndicators.push('🚨 DMARC policy failed');
  }

  if (header.includes('Received:') && header.match(/Received:/g).length > 5) {
    routingIssues.push('⚠️ Multiple routing hops detected');
  }

  if (!spfStatus.includes('Pass') && !dkimStatus.includes('Pass')) {
    spamIndicators.push('🚨 Email authentication failed');
  }

  if (spamIndicators.length === 0) {
    recommendations.push('✅ Email appears to have valid authentication');
  }

  recommendations.push('✅ Verify sender directly if suspicious');
  recommendations.push('⚠️ Never click links from unexpected emails');

  const trustScore = spfStatus.includes('Pass') && dkimStatus.includes('Pass') ? 85 : 40;

  return {
    fromEmail: fromEmail,
    replyTo: replyTo,
    returnPath: returnPath,
    fromDomain: fromDomain,
    domainMatch: fromDomain === replyDomain ? '✅ Match' : '❌ Mismatch',
    spfStatus: spfStatus,
    dkimStatus: dkimStatus,
    dmarcStatus: dmarcStatus,
    routingIssues: routingIssues,
    spamIndicators: spamIndicators,
    recommendations: recommendations,
    trustScore: trustScore
  };
}

// Display Email Results
function displayEmailResults(analysis) {
  const resultCard = document.querySelector('.result-card');
  const trustColor = analysis.trustScore > 70 ? '#44ff44' :
                     analysis.trustScore > 40 ? '#ffaa00' : '#ff4444';

  let routingHtml = '';
  if (analysis.routingIssues.length > 0) {
    analysis.routingIssues.forEach(issue => {
      routingHtml += `<li>${issue}</li>`;
    });
  } else {
    routingHtml = '<li class="placeholder">No suspicious routing detected</li>';
  }

  let spamHtml = '';
  if (analysis.spamIndicators.length > 0) {
    analysis.spamIndicators.forEach(ind => {
      spamHtml += `<li>${ind}</li>`;
    });
  } else {
    spamHtml = '<li class="placeholder">No spam indicators</li>';
  }

  let recommendationsHtml = '';
  analysis.recommendations.forEach(rec => {
    recommendationsHtml += `<li>${rec}</li>`;
  });

  resultCard.innerHTML = `
    <h2>Email Analysis Results</h2>

    <div class="grid two-columns">
      <div class="info-box">
        <h3>👤 Sender Information</h3>
        <table id="senderInfo">
          <tr>
            <td class="label">From:</td>
            <td>${analysis.fromEmail}</td>
          </tr>
          <tr>
            <td class="label">Reply-To:</td>
            <td>${analysis.replyTo}</td>
          </tr>
          <tr>
            <td class="label">Return-Path:</td>
            <td>${analysis.returnPath}</td>
          </tr>
        </table>
      </div>

      <div class="info-box">
        <h3>🌐 Domain Information</h3>
        <table id="emailDomainInfo">
          <tr>
            <td class="label">Sender Domain:</td>
            <td>${analysis.fromDomain}</td>
          </tr>
          <tr>
            <td class="label">Domain Match:</td>
            <td>${analysis.domainMatch}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="grid three-columns">
      <div class="info-box">
        <h3>🔐 SPF Check</h3>
        <div class="status-box">
          <p>${analysis.spfStatus}</p>
        </div>
      </div>

      <div class="info-box">
        <h3>🔑 DKIM Check</h3>
        <div class="status-box">
          <p>${analysis.dkimStatus}</p>
        </div>
      </div>

      <div class="info-box">
        <h3>📋 DMARC Check</h3>
        <div class="status-box">
          <p>${analysis.dmarcStatus}</p>
        </div>
      </div>
    </div>

    <div class="info-box">
      <h3>⚠️ Suspicious Routing Detection</h3>
      <ul class="indicators-list">
        ${routingHtml}
      </ul>
    </div>

    <div class="info-box">
      <h3>🚨 Spam Indicators</h3>
      <ul class="indicators-list">
        ${spamHtml}
      </ul>
    </div>

    <div class="info-box">
      <h3>✅ Security Recommendations</h3>
      <ul class="recommendations-list">
        ${recommendationsHtml}
      </ul>
    </div>

    <div class="risk-meter">
      <div class="meter-label">Email Trustworthiness</div>
      <div class="meter-bar">
        <div class="meter-fill" style="width: ${analysis.trustScore}%; background: ${trustColor};"></div>
      </div>
      <div class="meter-value">${analysis.trustScore}%</div>
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
