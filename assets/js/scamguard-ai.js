// ScamGuard AI JavaScript
let currentUser = null;
let conversationHistory = [];

document.addEventListener('DOMContentLoaded', function() {
  initializeAuth();
  setupEventListeners();
  loadConversationHistory();
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
  document.getElementById('chatForm').addEventListener('submit', sendMessage);
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
}

// Send Message
function sendMessage(e) {
  e.preventDefault();
  const userInput = document.getElementById('userInput').value.trim();

  if (!userInput) return;

  // Add user message to chat
  addChatMessage('user', userInput);
  document.getElementById('userInput').value = '';

  // Generate AI response
  setTimeout(() => {
    const aiResponse = generateAIResponse(userInput);
    addChatMessage('ai', aiResponse);
    saveConversation(userInput, aiResponse);
  }, 1000);
}

// Add Chat Message
function addChatMessage(sender, message) {
  const chatHistory = document.getElementById('chatHistory');
  const messageClass = sender === 'user' ? 'user-message' : 'ai-message';

  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${messageClass}`;
  messageDiv.innerHTML = sender === 'user'
    ? `<p>${escapeHtml(message)}</p>`
    : `<p>${message}</p>`;

  chatHistory.appendChild(messageDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Generate AI Response
function generateAIResponse(userInput) {
  const input = userInput.toLowerCase();

  if (input.includes('phishing') || input.includes('email')) {
    return `
      <strong>🎣 Phishing Detection Tips:</strong>
      <ul>
        <li>Check the sender's email address carefully</li>
        <li>Hover over links to see the actual URL</li>
        <li>Look for poor grammar and spelling</li>
        <li>Never click links from unexpected emails</li>
        <li>Go directly to websites instead of clicking links</li>
        <li>Enable two-factor authentication</li>
      </ul>
    `;
  }

  if (input.includes('romance') || input.includes('relationship')) {
    return `
      <strong>💔 Romance Scam Warning Signs:</strong>
      <ul>
        <li>They quickly express strong feelings</li>
        <li>They avoid meeting in person</li>
        <li>They ask for money or gift cards</li>
        <li>They have a "crisis" requiring money</li>
        <li>They refuse video calls</li>
        <li>Too good to be true profile</li>
        <li>Always verify identities independently</li>
      </ul>
    `;
  }

  if (input.includes('website') || input.includes('fake')) {
    return `
      <strong>🌐 Identifying Fake Websites:</strong>
      <ul>
        <li>Check the URL carefully (HTTPS required)</li>
        <li>Look for spelling errors in domain</li>
        <li>Check for legitimate contact information</li>
        <li>Verify company details on official sites</li>
        <li>Look for "About Us" and privacy policy</li>
        <li>Check customer reviews from trusted sources</li>
        <li>Use browser warnings and security tools</li>
      </ul>
    `;
  }

  if (input.includes('password') || input.includes('secure')) {
    return `
      <strong>🔐 Password Security Best Practices:</strong>
      <ul>
        <li>Use unique passwords for each account</li>
        <li>Make passwords at least 12 characters</li>
        <li>Include uppercase, lowercase, numbers, symbols</li>
        <li>Enable two-factor authentication</li>
        <li>Use a password manager</li>
        <li>Don't share passwords with anyone</li>
        <li>Change passwords if suspected compromise</li>
      </ul>
    `;
  }

  if (input.includes('investment') || input.includes('money')) {
    return `
      <strong>💰 Investment Fraud Red Flags:</strong>
      <ul>
        <li>Guaranteed returns or no-risk claims</li>
        <li>High pressure to invest quickly</li>
        <li>Unsolicited investment offers</li>
        <li>Complex strategies you don't understand</li>
        <li>Unregistered advisors or platforms</li>
        <li>Requests for upfront fees</li>
        <li>Always research investments thoroughly</li>
      </ul>
    `;
  }

  if (input.includes('report') || input.includes('scam')) {
    return `
      <strong>📋 How to Report a Scam:</strong>
      <ul>
        <li>Document all evidence and communications</li>
        <li>Report to the platform (email, social media)</li>
        <li>Report to FTC at reportfraud.ftc.gov</li>
        <li>Report to FBI at ic3.gov</li>
        <li>Report to local law enforcement</li>
        <li>Use our Community Report feature</li>
        <li>Monitor your accounts for fraud</li>
      </ul>
    `;
  }

  if (input.includes('2fa') || input.includes('factor')) {
    return `
      <strong>🔐 Two-Factor Authentication (2FA):</strong>
      <ul>
        <li>Adds extra layer of security</li>
        <li>Requires two forms of verification</li>
        <li>Types: SMS, authenticator apps, biometric</li>
        <li>Authenticator apps are most secure</li>
        <li>Enable on all important accounts</li>
        <li>Save backup codes in safe place</li>
        <li>Prevents account compromise even if password stolen</li>
      </ul>
    `;
  }

  if (input.includes('how') && input.includes('protect')) {
    return `
      <strong>🛡️ General Protection Tips:</strong>
      <ul>
        <li>Keep software and antivirus updated</li>
        <li>Use strong, unique passwords</li>
        <li>Enable two-factor authentication</li>
        <li>Be skeptical of unexpected offers</li>
        <li>Verify requests independently</li>
        <li>Don't share personal information</li>
        <li>Monitor your credit reports regularly</li>
        <li>Use our analysis tools regularly</li>
      </ul>
    `;
  }

  return `
    <strong>General Scam Prevention Tips:</strong>
    <ul>
      <li>If it seems too good to be true, it probably is</li>
      <li>Never share passwords or security codes</li>
      <li>Always verify before sending money</li>
      <li>Use official websites and apps only</li>
      <li>Keep security software updated</li>
      <li>Report suspicious activity immediately</li>
      <li>Trust your instincts</li>
    </ul>
    <p>For more specific help, ask me about:</p>
    <ul>
      <li>Phishing detection</li>
      <li>Romance scams</li>
      <li>Fake websites</li>
      <li>Password security</li>
      <li>Investment fraud</li>
      <li>Two-factor authentication</li>
      <li>How to report scams</li>
    </ul>
  `;
}

// Save Conversation
function saveConversation(userMessage, aiResponse) {
  if (!currentUser) return;

  conversationHistory.push({
    userMessage: userMessage,
    aiResponse: aiResponse,
    timestamp: new Date()
  });

  // Save to Firestore
  firebase.firestore().collection('users').doc(currentUser.uid)
    .collection('conversations')
    .add({
      userMessage: userMessage,
      aiResponse: aiResponse,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .catch(error => console.error('Error saving conversation:', error));
}

// Load Conversation History
function loadConversationHistory() {
  if (!currentUser) return;

  firebase.firestore().collection('users').doc(currentUser.uid)
    .collection('conversations')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get()
    .then(snapshot => {
      const historyDiv = document.getElementById('conversationHistory');
      let html = '';

      snapshot.forEach(doc => {
        const data = doc.data();
        html += `
          <div class="history-item">
            <p><strong>You:</strong> ${data.userMessage.substring(0, 50)}...</p>
            <p><small>${new Date(data.timestamp.toDate()).toLocaleString()}</small></p>
          </div>
        `;
      });

      if (html) {
        historyDiv.innerHTML = html;
      } else {
        historyDiv.innerHTML = '<p class="placeholder">No conversation history</p>';
      }
    });
}

// Load Educational Content
function loadEducationalContent(contentType) {
  const content = {
    'fraud-guide': `
      <h2>Fraud Prevention Guide</h2>
      <p>This comprehensive guide covers common fraud tactics and how to protect yourself...</p>
      <h3>Common Scam Types:</h3>
      <ul>
        <li><strong>Phishing:</strong> Fraudulent emails mimicking legitimate companies</li>
        <li><strong>Romance Scams:</strong> Fake relationships to extract money</li>
        <li><strong>Investment Fraud:</strong> Illegal investment schemes</li>
        <li><strong>Tech Support:</strong> Fake IT support offers</li>
      </ul>
    `,
    'password-guide': `
      <h2>Password Security Guide</h2>
      <p>Strong passwords are your first line of defense...</p>
      <h3>Creating Strong Passwords:</h3>
      <ul>
        <li>At least 12 characters long</li>
        <li>Mix of uppercase, lowercase, numbers, symbols</li>
        <li>Avoid personal information</li>
        <li>Don't reuse passwords</li>
      </ul>
    `,
    'privacy-guide': `
      <h2>Privacy Protection Guide</h2>
      <p>Protecting your personal information online is crucial...</p>
      <h3>Privacy Best Practices:</h3>
      <ul>
        <li>Limit what you share online</li>
        <li>Use privacy settings on social media</li>
        <li>Don't overshare personal details</li>
        <li>Monitor your credit reports</li>
      </ul>
    `
  };

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="this.parentElement.parentElement.style.display='none'">&times;</span>
      ${content[contentType] || '<p>Content not found</p>'}
    </div>
  `;

  document.body.appendChild(modal);
}

// Ask AI
function askAI(question) {
  document.getElementById('userInput').value = question;
  document.getElementById('chatForm').dispatchEvent(new Event('submit'));
}

// Escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
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
