// Profile JavaScript
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  setupEventListeners();
  loadUserProfile();
  loadUserStats();
  loadScanHistory();
  loadReportHistory();
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
  document.getElementById('profileForm').addEventListener('submit', updateProfile);
  document.getElementById('passwordForm').addEventListener('submit', changePassword);
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
}

// Load User Profile
function loadUserProfile() {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById('profileName').value = data.displayName || '';
      document.getElementById('profileEmail').value = currentUser.email;
      document.getElementById('profilePhone').value = data.phone || '';
      document.getElementById('profileCountry').value = data.country || '';
    }
  });
}

// Load User Stats
function loadUserStats() {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById('userTotalScans').textContent = data.totalScans || 0;
      document.getElementById('userReportsCount').textContent = data.reportsSubmitted || 0;
      document.getElementById('userScamsDetected').textContent = data.scamsDetected || 0;

      if (data.createdAt) {
        const date = new Date(data.createdAt.toDate());
        document.getElementById('memberSince').textContent = date.toLocaleDateString();
      }
    }
  });
}

// Load Scan History
function loadScanHistory() {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid)
    .collection('scanHistory')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get()
    .then(snapshot => {
      const historyBody = document.getElementById('scanHistoryBody');
      let html = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        html += `
          <tr>
            <td>${data.type.toUpperCase()}</td>
            <td>${data.content.substring(0, 50)}...</td>
            <td>${data.riskScore}%</td>
            <td>${new Date(data.timestamp.toDate()).toLocaleDateString()}</td>
          </tr>
        `;
      });

      if (html) {
        historyBody.innerHTML = html;
      } else {
        historyBody.innerHTML = '<tr><td colspan="4" class="placeholder">No scan history</td></tr>';
      }
    });
}

// Load Report History
function loadReportHistory() {
  if (!currentUser) return;

  firebase.firestore().collection('scamReports')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get()
    .then(snapshot => {
      const historyBody = document.getElementById('reportHistoryBody');
      let html = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        html += `
          <tr>
            <td>${data.title}</td>
            <td>${data.category}</td>
            <td><span class="status-badge ${data.status}">${data.status}</span></td>
            <td>${new Date(data.timestamp.toDate()).toLocaleDateString()}</td>
          </tr>
        `;
      });

      if (html) {
        historyBody.innerHTML = html;
      } else {
        historyBody.innerHTML = '<tr><td colspan="4" class="placeholder">No report history</td></tr>';
      }
    });
}

// Update Profile
function updateProfile(e) {
  e.preventDefault();

  const name = document.getElementById('profileName').value;
  const phone = document.getElementById('profilePhone').value;
  const country = document.getElementById('profileCountry').value;

  firebase.firestore().collection('users').doc(currentUser.uid).update({
    displayName: name,
    phone: phone,
    country: country
  }).then(() => {
    currentUser.updateProfile({
      displayName: name
    }).then(() => {
      alert('✅ Profile updated successfully');
    });
  }).catch(error => {
    alert('❌ Error updating profile: ' + error.message);
  });
}

// Change Password
function changePassword(e) {
  e.preventDefault();

  const current = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;

  if (newPass !== confirm) {
    alert('❌ Passwords do not match');
    return;
  }

  if (newPass.length < 6) {
    alert('❌ Password must be at least 6 characters');
    return;
  }

  // Re-authenticate user
  const credential = firebase.auth.EmailAuthProvider.credential(
    currentUser.email,
    current
  );

  currentUser.reauthenticateWithCredential(credential).then(() => {
    currentUser.updatePassword(newPass).then(() => {
      alert('✅ Password changed successfully');
      document.getElementById('passwordForm').reset();
    }).catch(error => {
      alert('❌ Error changing password: ' + error.message);
    });
  }).catch(error => {
    alert('❌ Current password is incorrect');
  });
}

// Save Settings
function saveSettings() {
  const emailNotifications = document.getElementById('emailNotifications').checked;
  const pushNotifications = document.getElementById('pushNotifications').checked;
  const twoFactorAuth = document.getElementById('twoFactorAuth').checked;
  const publicProfile = document.getElementById('publicProfile').checked;

  firebase.firestore().collection('users').doc(currentUser.uid).update({
    settings: {
      emailNotifications: emailNotifications,
      pushNotifications: pushNotifications,
      twoFactorAuth: twoFactorAuth,
      publicProfile: publicProfile
    }
  }).then(() => {
    alert('✅ Settings saved');
  }).catch(error => {
    alert('❌ Error saving settings: ' + error.message);
  });
}

// Delete Account
function deleteAccount() {
  if (!confirm('⚠️ Are you sure? This action cannot be undone!')) {
    return;
  }

  if (!confirm('This will permanently delete your account and all data. Continue?')) {
    return;
  }

  // Delete user data from Firestore
  firebase.firestore().collection('users').doc(currentUser.uid).delete().then(() => {
    // Delete the authentication user
    currentUser.delete().then(() => {
      alert('✅ Account deleted successfully');
      window.location.href = 'login.html';
    }).catch(error => {
      alert('❌ Error deleting account: ' + error.message);
    });
  }).catch(error => {
    alert('❌ Error deleting account: ' + error.message);
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

// Logout
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = 'login.html';
  });
}
