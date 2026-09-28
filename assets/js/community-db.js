// Community Database JavaScript
let currentUser = null;
let communityScams = [];
let filteredScams = [];

document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  setupEventListeners();
  loadCommunityDatabase();
  loadRecentAlerts();
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
  document.getElementById('communitySearchForm').addEventListener('submit', searchScams);
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', filterScams);
  });
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
  document.querySelector('.close').addEventListener('click', closeScamModal);
}

// Load Community Database
function loadCommunityDatabase() {
  firebase.firestore().collection('communityReports')
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => {
      communityScams = [];
      const communityBody = document.getElementById('communityBody');
      let html = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        communityScams.push({ id: doc.id, ...data });

        const riskLevel = data.reportCount > 20 ? '🔴 High' :
                         data.reportCount > 10 ? '🟡 Medium' : '🟢 Low';

        html += `
          <tr>
            <td>${data.title}</td>
            <td>${data.category}</td>
            <td>${data.reportCount || 0}</td>
            <td>${riskLevel}</td>
            <td>${new Date(data.timestamp.toDate()).toLocaleDateString()}</td>
            <td>
              <button class="btn small secondary" onclick="viewScamDetails('${doc.id}')">View</button>
            </td>
          </tr>
        `;
      });

      filteredScams = communityScams;
      if (html) {
        communityBody.innerHTML = html;
      } else {
        communityBody.innerHTML = '<tr><td colspan="6" class="placeholder">No scams reported</td></tr>';
      }
    });
}

// Load Recent Alerts
function loadRecentAlerts() {
  firebase.firestore().collection('communityReports')
    .orderBy('timestamp', 'desc')
    .limit(5)
    .get()
    .then(snapshot => {
      const alertsContainer = document.getElementById('recentAlertsContainer');
      let html = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        html += `
          <div class="alert-card">
            <h3>🔴 ${data.title}</h3>
            <p><strong>Category:</strong> ${data.category}</p>
            <p><strong>Reports:</strong> ${data.reportCount || 0}</p>
            <p>${data.description.substring(0, 100)}...</p>
            <button class="btn small secondary" onclick="viewScamDetails('${doc.id}')">Learn More</button>
          </div>
        `;
      });

      if (html) {
        alertsContainer.innerHTML = html;
      } else {
        alertsContainer.innerHTML = '<p class="placeholder">No recent alerts</p>';
      }
    });
}

// Search Scams
function searchScams(e) {
  e.preventDefault();
  const searchTerm = document.getElementById('communitySearch').value.toLowerCase();

  if (!searchTerm) {
    loadCommunityDatabase();
    return;
  }

  filteredScams = communityScams.filter(scam => {
    return scam.title.toLowerCase().includes(searchTerm) ||
           scam.description.toLowerCase().includes(searchTerm) ||
           scam.category.toLowerCase().includes(searchTerm);
  });

  updateCommunityTable();
}

// Filter Scams
function filterScams(e) {
  const filterValue = e.target.dataset.filter;

  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  e.target.classList.add('active');

  if (filterValue === 'all') {
    filteredScams = communityScams;
  } else {
    filteredScams = communityScams.filter(scam => scam.category === filterValue);
  }

  updateCommunityTable();
}

// Update Community Table
function updateCommunityTable() {
  const communityBody = document.getElementById('communityBody');
  let html = '';

  filteredScams.forEach(scam => {
    const riskLevel = scam.reportCount > 20 ? '🔴 High' :
                     scam.reportCount > 10 ? '🟡 Medium' : '🟢 Low';

    html += `
      <tr>
        <td>${scam.title}</td>
        <td>${scam.category}</td>
        <td>${scam.reportCount || 0}</td>
        <td>${riskLevel}</td>
        <td>${new Date(scam.timestamp.toDate()).toLocaleDateString()}</td>
        <td>
          <button class="btn small secondary" onclick="viewScamDetails('${scam.id}')">View</button>
        </td>
      </tr>
    `;
  });

  if (html) {
    communityBody.innerHTML = html;
  } else {
    communityBody.innerHTML = '<tr><td colspan="6" class="placeholder">No scams found</td></tr>';
  }
}

// View Scam Details
function viewScamDetails(scamId) {
  const scam = communityScams.find(s => s.id === scamId);
  if (!scam) return;

  const modal = document.getElementById('scamDetailModal');
  document.getElementById('modalScamTitle').textContent = scam.title;

  const detailsHtml = `
    <p><strong>Category:</strong> ${scam.category}</p>
    <p><strong>Description:</strong></p>
    <p>${scam.description}</p>
    <p><strong>Reports:</strong> ${scam.reportCount || 0}</p>
    <p><strong>Last Updated:</strong> ${new Date(scam.timestamp.toDate()).toLocaleString()}</p>
    ${scam.indicators ? `
      <h4>Common Indicators:</h4>
      <ul>
        ${scam.indicators.map(ind => `<li>${ind}</li>`).join('')}
      </ul>
    ` : ''}
  `;

  document.getElementById('modalScamDetails').innerHTML = detailsHtml;

  // Setup voting buttons
  document.getElementById('helpfulYes').onclick = () => voteHelpful(scamId, true);
  document.getElementById('helpfulNo').onclick = () => voteHelpful(scamId, false);

  modal.classList.remove('hidden');
}

// Vote Helpful
function voteHelpful(scamId, isHelpful) {
  if (!currentUser) {
    alert('❌ You must be logged in to vote');
    return;
  }

  const scam = communityScams.find(s => s.id === scamId);
  if (!scam) return;

  firebase.firestore().collection('communityReports').doc(scamId).update({
    votes: (scam.votes || 0) + (isHelpful ? 1 : -1)
  }).then(() => {
    alert('✅ Thank you for your feedback!');
    closeScamModal();
  }).catch(error => {
    console.error('Error voting:', error);
  });
}

// Close Scam Modal
function closeScamModal() {
  document.getElementById('scamDetailModal').classList.add('hidden');
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
