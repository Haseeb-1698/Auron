// Settings script for Auron Security Analyzer

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  await loadSettings();

  // Event listeners
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
  document.getElementById('testConnectionBtn').addEventListener('click', testConnection);
});

async function loadSettings() {
  const settings = await chrome.storage.local.get([
    'apiUrl',
    'authToken',
    'openphishKey',
    'enableBackendSync',
    'enableNotifications',
    'enableAutoScan',
    'enableAIExplanations',
    'showOwaspMapping',
    'showRemediationGuidance'
  ]);

  // Populate form fields
  document.getElementById('apiUrl').value = settings.apiUrl || 'http://localhost:4000';
  document.getElementById('authToken').value = settings.authToken || '';
  document.getElementById('openphishKey').value = settings.openphishKey || '';

  // Checkboxes
  document.getElementById('enableBackendSync').checked = settings.enableBackendSync !== false;
  document.getElementById('enableNotifications').checked = settings.enableNotifications || false;
  document.getElementById('enableAutoScan').checked = settings.enableAutoScan || false;
  document.getElementById('enableAIExplanations').checked = settings.enableAIExplanations !== false;
  document.getElementById('showOwaspMapping').checked = settings.showOwaspMapping !== false;
  document.getElementById('showRemediationGuidance').checked = settings.showRemediationGuidance !== false;

  // Update connection status
  updateConnectionStatus();
}

async function saveSettings() {
  const settings = {
    apiUrl: document.getElementById('apiUrl').value,
    authToken: document.getElementById('authToken').value,
    openphishKey: document.getElementById('openphishKey').value,
    enableBackendSync: document.getElementById('enableBackendSync').checked,
    enableNotifications: document.getElementById('enableNotifications').checked,
    enableAutoScan: document.getElementById('enableAutoScan').checked,
    enableAIExplanations: document.getElementById('enableAIExplanations').checked,
    showOwaspMapping: document.getElementById('showOwaspMapping').checked,
    showRemediationGuidance: document.getElementById('showRemediationGuidance').checked
  };

  await chrome.storage.local.set(settings);

  showMessage('Settings saved successfully!', 'success');

  // Notify background script of settings change
  chrome.runtime.sendMessage({ action: 'settingsUpdated', settings });
}

async function testConnection() {
  const apiUrl = document.getElementById('apiUrl').value;
  const authToken = document.getElementById('authToken').value;

  if (!authToken) {
    showMessage('Please enter an authentication token first', 'error');
    return;
  }

  updateConnectionStatus('Testing connection...', 'loading');

  try {
    const response = await fetch(`${apiUrl}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      updateConnectionStatus(`Connected as ${data.email || 'user'}`, 'connected');
      showMessage('Connection successful!', 'success');
    } else {
      updateConnectionStatus('Authentication failed', 'error');
      showMessage('Failed to authenticate. Please check your token.', 'error');
    }
  } catch (error) {
    updateConnectionStatus('Connection failed', 'error');
    showMessage(`Connection error: ${error.message}`, 'error');
  }
}

function updateConnectionStatus(text = 'Not connected', status = 'disconnected') {
  const statusText = document.getElementById('statusText');
  const indicator = document.querySelector('.status-indicator');

  statusText.textContent = text;

  indicator.classList.remove('connected', 'error');
  if (status === 'connected') {
    indicator.classList.add('connected');
  } else if (status === 'error') {
    indicator.classList.add('error');
  }
}

async function clearAllData() {
  if (!confirm('Are you sure you want to clear all stored data? This cannot be undone.')) {
    return;
  }

  await chrome.storage.local.clear();
  await loadSettings(); // Reload defaults
  showMessage('All data cleared successfully', 'success');
}

function showMessage(text, type) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.className = `message ${type}`;

  setTimeout(() => {
    message.className = 'message';
  }, 5000);
}
