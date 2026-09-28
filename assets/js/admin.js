// Admin Panel JavaScript
let currentUser = null;
let isAdmin = false;
let adminStats = {};

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
      checkAdminStatus();
    } else {
      showAdminLogin();
    }
  });
}

// Check Admin Status
function checkAdminStatus() {
  firebase.firestore().collection('admins').doc(currentUser.uid).get().then(doc => {
    if (doc.exists) {
      isAdmin = true;
      showAdminDashboard();
      loadAdminStats();
    } else {
      showAdminLogin();
    }
  });
}

// Setup Event Listeners
function setupEventListeners() {
  document.getElementById('adminLoginFormElement').addEventListener('submit', adminLogin);
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', switchTab);
  });
}

// Admin Login
function adminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  firebase.auth().signInWithEmailAndPassword(email, password).then(result => {
    checkAdminStatus();
  }).catch(error => {
    alert('❌ Login failed: ' + error.message);
  });
}

// Show Admin Dashboard
function showAdminDashboard() {
  document.getElementById('adminLoginForm').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  loadAllStats();
}

// Show Admin Login
function showAdminLogin() {
  document.getElementById('adminLoginForm').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

// Load Admin Stats
function loadAdminStats() {
  // Load users count
  firebase.firestore().collection('users').get().then(snapshot => {
    adminStats.totalUsers = snapshot.size;
    document.getElementById('totalUsers').textContent = snapshot.size;
  });

  // Load pending reports
  firebase.firestore().collection('scamReports')
    .where('status', '==', 'pending')
    .get()
    .then(snapshot => {
      adminStats.pendingReports = snapshot.size;
      document.getElementById('pendingReports').textContent = snapshot.size;
    });

  // Load verified scams
  firebase.firestore().collection('communityReports').get().then(snapshot => {
    adminStats.verifiedScams = snapshot.size;
    document.getElementById('verifiedScams').textContent = snapshot.size;
  });

  // Load scans today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  firebase.firestore().collection('users').get().then(snapshot => {
    let scansCount = 0;
    snapshot.forEach(doc => {
      const stats = doc.data();
      if (stats.lastScanDate) {
        const lastScan = new Date(stats.lastScanDate.toDate());
        if (lastScan >= today) {
          scansCount += stats.totalScans || 0;
        }
      }
    });
    document.getElementById('scansToday').textContent = scansCount;
  });

  loadCharts();
  loadUsers();
  loadReports();
  loadArticles();
  loadCommunityManagement();
}

// Load All Stats
function loadAllStats() {
  loadAdminStats();
}

// Switch Tab
function switchTab(e) {
  const tabName = e.target.dataset.tab;

  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Remove active class from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  document.getElementById(tabName).classList.add('active');
  e.target.classList.add('active');
}

// Load Charts
function loadCharts() {
  // Risk Trend Chart
  const riskCtx = document.getElementById('riskTrendChart');
  if (riskCtx) {
    new Chart(riskCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Average Risk Score',
          data: [45, 52, 48, 61, 55, 67, 58],
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }

  // Category Chart
  const categoryCtx = document.getElementById('categoryChart');
  if (categoryCtx) {
    new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: ['Phishing', 'Fake Store', 'Investment', 'Romance', 'Tech Support', 'Other'],
        datasets: [{
          data: [25, 20, 15, 18, 12, 10],
          backgroundColor: [
            '#ff6b6b',
            '#ffa500',
            '#4ecdc4',
            '#ff6b9d',
            '#c06c84',
            '#6c5b7b'
          ]
        }]
      }
    });
  }
}

// Load Users
function loadUsers() {
  firebase.firestore().collection('users').get().then(snapshot => {
    const usersBody = document.getElementById('usersBody');
    let html = '';

    snapshot.forEach(doc => {
      const data = doc.data();
      html += `
        <tr>
          <td>${data.email}</td>
          <td>${data.role || 'user'}</td>
          <td>${new Date(data.createdAt?.toDate() || new Date()).toLocaleDateString()}</td>
          <td><span class="status-badge active">Active</span></td>
          <td>
            <button class="btn small secondary" onclick="editUser('${doc.id}')">Edit</button>
            <button class="btn small danger" onclick="deleteUser('${doc.id}')">Delete</button>
          </td>
        </tr>
      `;
    });

    usersBody.innerHTML = html || '<tr><td colspan="5" class="placeholder">No users</td></tr>';
  });
}

// Load Reports
function loadReports() {
  firebase.firestore().collection('scamReports').get().then(snapshot => {
    const reportsBody = document.getElementById('reportsManagementBody');
    let html = '';

    snapshot.forEach(doc => {
      const data = doc.data();
      html += `
        <tr>
          <td>${data.title}</td>
          <td>${data.category}</td>
          <td><span class="status-badge ${data.status}">${data.status}</span></td>
          <td>${new Date(data.timestamp.toDate()).toLocaleDateString()}</td>
          <td>
            <button class="btn small secondary" onclick="reviewReport('${doc.id}')">Review</button>
            <button class="btn small primary" onclick="approveReport('${doc.id}')">Approve</button>
          </td>
        </tr>
      `;
    });

    document.getElementById('reportsManagementBody').innerHTML = html || '<tr><td colspan="5" class="placeholder">No reports</td></tr>';
  });
}

// Load Articles
function loadArticles() {
  firebase.firestore().collection('articles').get().then(snapshot => {
    const articlesBody = document.getElementById('articlesBody');
    let html = '';

    snapshot.forEach(doc => {
      const data = doc.data();
      html += `
        <tr>
          <td>${data.title}</td>
          <td>${data.category}</td>
          <td>${new Date(data.createdAt?.toDate() || new Date()).toLocaleDateString()}</td>
          <td>
            <button class="btn small secondary" onclick="editArticle('${doc.id}')">Edit</button>
            <button class="btn small danger" onclick="deleteArticle('${doc.id}')">Delete</button>
          </td>
        </tr>
      `;
    });

    document.getElementById('articlesBody').innerHTML = html || '<tr><td colspan="4" class="placeholder">No articles</td></tr>';
  });
}

// Load Community Management
function loadCommunityManagement() {
  firebase.firestore().collection('communityReports').get().then(snapshot => {
    const communityBody = document.getElementById('communityMgmtBody');
    let html = '';

    snapshot.forEach(doc => {
      const data = doc.data();
      html += `
        <tr>
          <td>${data.title}</td>
          <td>${data.reportCount || 0}</td>
          <td><span class="status-badge verified">Verified</span></td>
          <td>
            <button class="btn small secondary" onclick="viewCommunityEntry('${doc.id}')">View</button>
            <button class="btn small danger" onclick="removeCommunityEntry('${doc.id}')">Remove</button>
          </td>
        </tr>
      `;
    });

    document.getElementById('communityMgmtBody').innerHTML = html || '<tr><td colspan="4" class="placeholder">No entries</td></tr>';
  });
}

// Open Article Form
function openArticleForm() {
  document.getElementById('articleModal').classList.remove('hidden');
}

// Edit User
function editUser(userId) {
  alert('Edit user: ' + userId);
}

// Delete User
function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    firebase.firestore().collection('users').doc(userId).delete().then(() => {
      alert('✅ User deleted');
      loadUsers();
    }).catch(error => {
      alert('❌ Error deleting user');
    });
  }
}

// Review Report
function reviewReport(reportId) {
  alert('Review report: ' + reportId);
}

// Approve Report
function approveReport(reportId) {
  firebase.firestore().collection('scamReports').doc(reportId).update({
    status: 'approved'
  }).then(() => {
    alert('✅ Report approved');
    loadReports();
  });
}

// Edit Article
function editArticle(articleId) {
  alert('Edit article: ' + articleId);
}

// Delete Article
function deleteArticle(articleId) {
  if (confirm('Are you sure?')) {
    firebase.firestore().collection('articles').doc(articleId).delete().then(() => {
      alert('✅ Article deleted');
      loadArticles();
    });
  }
}

// View Community Entry
function viewCommunityEntry(entryId) {
  alert('View entry: ' + entryId);
}

// Remove Community Entry
function removeCommunityEntry(entryId) {
  if (confirm('Remove this entry?')) {
    firebase.firestore().collection('communityReports').doc(entryId).delete().then(() => {
      alert('✅ Entry removed');
      loadCommunityManagement();
    });
  }
}

// Logout
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = '../login.html';
  });
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
