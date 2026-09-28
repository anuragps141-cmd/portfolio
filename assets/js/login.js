document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  setupLoginHandlers();
});

function initializeAuth() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      window.location.href = 'dashboard.html';
    }
  });
}

function setupLoginHandlers() {
  document.getElementById('loginForm').addEventListener('submit', signInUser);
  document.getElementById('registerForm').addEventListener('submit', registerUser);
  document.getElementById('showLogin').addEventListener('click', showLoginPanel);
  document.getElementById('showRegister').addEventListener('click', showRegisterPanel);
}

function signInUser(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const message = document.getElementById('loginMessage');

  message.textContent = 'Signing in...';

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = 'dashboard.html';
    })
    .catch(error => {
      if (error.code === 'auth/invalid-api-key' || error.code === 'auth/network-request-failed' || error.code === 'auth/unauthorized-domain') {
        message.textContent = '❌ Firebase configuration invalid or API key wrong. Update assets/js/firebase-config.js with your Firebase project values.';
      } else {
        message.textContent = '❌ ' + error.message;
      }
    });
}

function registerUser(e) {
  e.preventDefault();
  const displayName = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const message = document.getElementById('loginMessage');

  message.textContent = 'Creating account...';

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      return userCredential.user.updateProfile({ displayName: displayName });
    })
    .then(() => {
      window.location.href = 'dashboard.html';
    })
    .catch(error => {
      if (error.code === 'auth/invalid-api-key' || error.code === 'auth/network-request-failed' || error.code === 'auth/unauthorized-domain') {
        message.textContent = '❌ Firebase configuration invalid or API key wrong. Update assets/js/firebase-config.js with your Firebase project values.';
      } else {
        message.textContent = '❌ ' + error.message;
      }
    });
}

function showLoginPanel() {
  document.getElementById('loginPanel').classList.remove('hidden');
  document.getElementById('registerPanel').classList.add('hidden');
  document.getElementById('showLogin').classList.add('active');
  document.getElementById('showRegister').classList.remove('active');
  document.getElementById('loginMessage').textContent = '';
}

function showRegisterPanel() {
  document.getElementById('loginPanel').classList.add('hidden');
  document.getElementById('registerPanel').classList.remove('hidden');
  document.getElementById('showLogin').classList.remove('active');
  document.getElementById('showRegister').classList.add('active');
  document.getElementById('loginMessage').textContent = '';
}
