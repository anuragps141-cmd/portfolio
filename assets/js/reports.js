// Reports JavaScript
let currentUser = null;
let userReports = [];

document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  setupEventListeners();
  loadUserReports();
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
  document.getElementById('reportForm').addEventListener('submit', submitReport);
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
  document.querySelector('.close').addEventListener('click', closeModal);
}

// Submit Report
function submitReport(e) {
  e.preventDefault();

  if (!currentUser) {
    alert('❌ You must be logged in to submit a report');
    return;
  }

  const title = document.getElementById('scamTitle').value;
  const category = document.getElementById('scamCategory').value;
  const description = document.getElementById('scamDescription').value;
  const contact = document.getElementById('scamContact').value;

  if (!title || !category || !description) {
    alert('❌ Please fill in all required fields');
    return;
  }

  // Save to Firestore
  firebase.firestore().collection('scamReports').add({
    userId: currentUser.uid,
    userEmail: currentUser.email,
    title: title,
    category: category,
    description: description,
    contact: contact,
    status: 'pending',
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    votes: 0,
    responses: []
  }).then(() => {
    alert('✅ Report submitted successfully!');
    document.getElementById('reportForm').reset();
    loadUserReports();
  }).catch(error => {
    console.error('Error submitting report:', error);
    alert('❌ Error submitting report');
  });
}

// Load User Reports
function loadUserReports() {
  if (!currentUser) return;

  firebase.firestore().collection('scamReports')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => {
      userReports = [];
      const reportsBody = document.getElementById('userReportsBody');
      let html = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        userReports.push({ id: doc.id, ...data });

        html += `
          <tr>
            <td>${data.title}</td>
            <td>${data.category}</td>
            <td>${new Date(data.timestamp.toDate()).toLocaleDateString()}</td>
            <td>
              <span class="status-badge ${data.status}">
                ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </span>
            </td>
            <td>
              <button class="btn small secondary" onclick="viewReportDetails('${doc.id}')">View</button>
            </td>
          </tr>
        `;
      });

      if (html) {
        reportsBody.innerHTML = html;
      } else {
        reportsBody.innerHTML = '<tr><td colspan="5" class="placeholder">No reports submitted</td></tr>';
      }

      loadReportTracking();
    });
}

// Load Report Tracking
function loadReportTracking() {
  const trackingDiv = document.getElementById('reportTracking');
  let html = '';

  userReports.forEach(report => {
    const statusClass = report.status === 'resolved' ? 'resolved' :
                        report.status === 'in-review' ? 'in-review' : 'pending';

    html += `
      <div class="tracking-item ${statusClass}">
        <h4>${report.title}</h4>
        <p><strong>Status:</strong> ${report.status.toUpperCase()}</p>
        <p><strong>Category:</strong> ${report.category}</p>
        ${report.responses && report.responses.length > 0
          ? `<p><strong>Admin Response:</strong> ${report.responses[0].message}</p>`
          : '<p>No admin response yet</p>'
        }
        <button class="btn small secondary" onclick="viewReportDetails('${report.id}')">Details</button>
      </div>
    `;
  });

  if (html) {
    trackingDiv.innerHTML = html;
  } else {
    trackingDiv.innerHTML = '<p class="placeholder">No reports to track</p>';
  }
}

// View Report Details
function viewReportDetails(reportId) {
  const report = userReports.find(r => r.id === reportId);
  if (!report) return;

  const modal = document.getElementById('reportDetailModal');
  const details = document.getElementById('modalReportDetails');
  const adminSection = document.getElementById('adminResponseSection');

  details.innerHTML = `
    <h3>${report.title}</h3>
    <p><strong>Category:</strong> ${report.category}</p>
    <p><strong>Status:</strong> ${report.status}</p>
    <p><strong>Submitted:</strong> ${new Date(report.timestamp.toDate()).toLocaleString()}</p>
    <h4>Description:</h4>
    <p>${report.description}</p>
    ${report.contact ? `<p><strong>Contact:</strong> ${report.contact}</p>` : ''}
  `;

  if (report.responses && report.responses.length > 0) {
    adminSection.innerHTML = `
      <h3>Admin Response</h3>
      <div class="admin-response-content">
        <p><strong>Response Date:</strong> ${new Date(report.responses[0].date).toLocaleString()}</p>
        <p>${report.responses[0].message}</p>
      </div>
    `;
  } else {
    adminSection.innerHTML = '<h3>Admin Response</h3><p class="placeholder">No response yet</p>';
  }

  modal.classList.remove('hidden');
}

// Close Modal
function closeModal() {
  document.getElementById('reportDetailModal').classList.add('hidden');
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
