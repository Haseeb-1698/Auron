// Background service worker for Auron Security Analyzer

// Listen for web requests to analyze headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const headers = details.responseHeaders || [];
    
    // Store CSP and other security headers
    const securityHeaders = {
      url: details.url,
      timestamp: new Date().toISOString(),
      headers: {}
    };

    headers.forEach(header => {
      const name = header.name.toLowerCase();
      if (name.includes('content-security-policy') ||
          name.includes('x-frame-options') ||
          name.includes('x-content-type-options') ||
          name.includes('strict-transport-security')) {
        securityHeaders.headers[header.name] = header.value;
      }
    });

    // Store in local storage for popup access
    if (Object.keys(securityHeaders.headers).length > 0) {
      chrome.storage.local.set({ 
        [`headers_${details.tabId}`]: securityHeaders 
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Listen for tab updates to reset analysis
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Could trigger automatic analysis here
    console.log('Page loaded:', tab.url);
  }
});

// Message handler for content script communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePage') {
    // Trigger analysis
    analyzePage(sender.tab.id).then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'reportFinding') {
    // Store finding and optionally send to backend
    storeFinding(request.data).then(sendResponse);
    return true;
  }
});

async function analyzePage(tabId) {
  // Get stored headers for this tab
  const result = await chrome.storage.local.get([`headers_${tabId}`]);
  return result[`headers_${tabId}`] || null;
}

async function storeFinding(data) {
  const result = await chrome.storage.local.get(['findings']);
  const findings = result.findings || [];
  
  findings.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 1000 findings
  if (findings.length > 1000) {
    findings.splice(0, findings.length - 1000);
  }
  
  await chrome.storage.local.set({ findings });

  // Send to backend API if enabled
  const settings = await chrome.storage.local.get(['enableBackendSync']);
  if (settings.enableBackendSync !== false) {
    await sendToBackend(data);
  }

  return { success: true };
}

async function sendToBackend(finding) {
  // Get auth token from storage
  const result = await chrome.storage.local.get(['authToken', 'apiUrl']);
  
  if (!result.authToken) {
    console.log('No auth token, skipping backend sync');
    return;
  }
  
  const apiUrl = result.apiUrl || 'http://localhost:4000';
  
  try {
    const response = await fetch(`${apiUrl}/api/reports/extension-finding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.authToken}`
      },
      body: JSON.stringify(finding)
    });
    
    if (response.ok) {
      console.log('Finding synced to backend');
    }
  } catch (error) {
    console.error('Failed to sync finding to backend:', error);
  }
}

// Listen for settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'settingsUpdated') {
    console.log('Settings updated:', request.settings);
    // Settings are stored in chrome.storage.local, accessible to all scripts
    sendResponse({ success: true });
  }
});

// Badge management for security status
async function updateBadge(tabId, riskLevel) {
  const colors = {
    critical: '#d32f2f',
    high: '#f57c00',
    medium: '#fbc02d',
    low: '#4caf50',
    safe: '#2196f3'
  };

  const texts = {
    critical: '!!!',
    high: '!!',
    medium: '!',
    low: '✓',
    safe: '✓'
  };

  await chrome.action.setBadgeBackgroundColor({ color: colors[riskLevel] || colors.safe, tabId });
  await chrome.action.setBadgeText({ text: texts[riskLevel] || '', tabId });
}

// Auto-scan on page load if enabled
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const settings = await chrome.storage.local.get(['enableAutoScan', 'enableNotifications']);

    if (settings.enableAutoScan) {
      // Trigger automatic security scan
      try {
        const [cookies, headers] = await Promise.all([
          chrome.cookies.getAll({ url: tab.url }),
          chrome.storage.local.get([`headers_${tabId}`])
        ]);

        // Quick risk assessment
        let riskLevel = 'safe';
        const issues = [];

        // Check cookies
        cookies.forEach(cookie => {
          if (!cookie.secure) {
            riskLevel = 'medium';
            issues.push('Insecure cookies detected');
          }
          if (!cookie.httpOnly && cookie.name.toLowerCase().includes('session')) {
            riskLevel = 'high';
            issues.push('Session cookie vulnerable to XSS');
          }
        });

        // Update badge
        await updateBadge(tabId, riskLevel);

        // Show notification if critical issues found and notifications enabled
        if (settings.enableNotifications && (riskLevel === 'high' || riskLevel === 'critical')) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '../icons/icon128.png',
            title: 'Auron Security Alert',
            message: `Security issues detected on ${new URL(tab.url).hostname}`,
            priority: 2
          });
        }
      } catch (error) {
        console.error('Auto-scan error:', error);
      }
    }
  }
});

// Initialize extension
console.log('Auron Security Analyzer background service started');
