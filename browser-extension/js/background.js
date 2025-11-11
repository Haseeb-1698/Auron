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
  
  // TODO: Send to backend API when user is authenticated
  // await sendToBackend(data);
  
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

// Initialize extension
console.log('Auron Security Analyzer background service started');
