// Popup script for Auron Security Analyzer

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize tabs
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    analyzeCurrentPage();
  });

  // Export button
  document.getElementById('exportBtn').addEventListener('click', () => {
    exportReport();
  });

  // Initial analysis
  await analyzeCurrentPage();
});

async function analyzeCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    updateStatus('No active tab found', 'error');
    return;
  }

  updateStatus('Analyzing...', 'loading');

  // Run all analyses
  await Promise.all([
    analyzeCookies(tab),
    analyzeSessions(tab),
    analyzeCSP(tab),
    checkPhishing(tab)
  ]);

  updateStatus('Analysis complete', 'success');
}

async function analyzeCookies(tab) {
  try {
    const cookies = await chrome.cookies.getAll({ url: tab.url });
    const cookieResults = document.getElementById('cookieResults');
    
    if (cookies.length === 0) {
      cookieResults.innerHTML = '<p class="loading">No cookies found</p>';
      return;
    }

    let html = '';
    let securityIssues = [];

    cookies.forEach(cookie => {
      const issues = [];
      
      // Check for security attributes
      if (!cookie.secure) {
        issues.push('Missing Secure flag');
      }
      if (!cookie.httpOnly) {
        issues.push('Missing HttpOnly flag');
      }
      if (!cookie.sameSite || cookie.sameSite === 'None') {
        issues.push('Weak SameSite policy');
      }

      const severity = issues.length > 2 ? 'error' : issues.length > 0 ? 'warning' : 'success';
      
      html += `
        <div class="result-item ${severity}">
          <h3>${cookie.name} <span class="badge ${issues.length > 2 ? 'high' : issues.length > 0 ? 'medium' : 'low'}">${issues.length > 0 ? 'Issues Found' : 'Secure'}</span></h3>
          <p><strong>Domain:</strong> ${cookie.domain}</p>
          ${issues.length > 0 ? `<p><strong>Issues:</strong> ${issues.join(', ')}</p>` : ''}
        </div>
      `;

      if (issues.length > 0) {
        securityIssues.push({ cookie: cookie.name, issues });
      }
    });

    cookieResults.innerHTML = html;

    // Store findings
    if (securityIssues.length > 0) {
      storeFinding(tab.url, 'cookie', { issues: securityIssues, count: cookies.length });
    }
  } catch (error) {
    console.error('Cookie analysis error:', error);
    document.getElementById('cookieResults').innerHTML = '<p class="loading">Error analyzing cookies</p>';
  }
}

async function analyzeSessions(tab) {
  try {
    const sessionResults = document.getElementById('sessionResults');
    
    // Check for common session indicators in cookies
    const cookies = await chrome.cookies.getAll({ url: tab.url });
    const sessionCookies = cookies.filter(c => 
      c.name.toLowerCase().includes('session') || 
      c.name.toLowerCase().includes('sess') ||
      c.name.toLowerCase().includes('token')
    );

    if (sessionCookies.length === 0) {
      sessionResults.innerHTML = '<p class="loading">No session cookies detected</p>';
      return;
    }

    let html = '';
    sessionCookies.forEach(cookie => {
      const issues = [];
      
      if (!cookie.secure) {
        issues.push('Session transmitted over insecure channel');
      }
      if (!cookie.httpOnly) {
        issues.push('Session accessible via JavaScript (XSS risk)');
      }
      
      const severity = issues.length > 0 ? 'error' : 'success';
      
      html += `
        <div class="result-item ${severity}">
          <h3>${cookie.name} <span class="badge ${issues.length > 0 ? 'high' : 'low'}">${issues.length > 0 ? 'Vulnerable' : 'Secure'}</span></h3>
          ${issues.length > 0 ? `<p>${issues.join('. ')}</p>` : '<p>Session cookie properly secured</p>'}
        </div>
      `;
    });

    sessionResults.innerHTML = html;
  } catch (error) {
    console.error('Session analysis error:', error);
    document.getElementById('sessionResults').innerHTML = '<p class="loading">Error analyzing sessions</p>';
  }
}

async function analyzeCSP(tab) {
  try {
    const cspResults = document.getElementById('cspResults');
    
    // Send message to content script to get CSP header
    chrome.tabs.sendMessage(tab.id, { action: 'getCSP' }, (response) => {
      if (chrome.runtime.lastError) {
        cspResults.innerHTML = '<p class="loading">Unable to analyze CSP (inject content script first)</p>';
        return;
      }

      if (!response || !response.csp) {
        cspResults.innerHTML = `
          <div class="result-item warning">
            <h3>No CSP Detected <span class="badge medium">Warning</span></h3>
            <p>Content Security Policy header not found. Site may be vulnerable to XSS attacks.</p>
          </div>
        `;
        return;
      }

      const csp = response.csp;
      const issues = [];

      // Check for common CSP issues
      if (csp.includes("'unsafe-inline'")) {
        issues.push("Allows unsafe inline scripts");
      }
      if (csp.includes("'unsafe-eval'")) {
        issues.push("Allows unsafe eval()");
      }
      if (csp.includes('*')) {
        issues.push("Uses wildcard source");
      }

      const severity = issues.length > 2 ? 'error' : issues.length > 0 ? 'warning' : 'success';
      
      let html = `
        <div class="result-item ${severity}">
          <h3>CSP Header Found <span class="badge ${issues.length > 2 ? 'high' : issues.length > 0 ? 'medium' : 'low'}">${issues.length > 0 ? 'Issues Found' : 'Good'}</span></h3>
          <p><strong>Policy:</strong> ${csp.substring(0, 100)}${csp.length > 100 ? '...' : ''}</p>
          ${issues.length > 0 ? `<p><strong>Issues:</strong> ${issues.join(', ')}</p>` : '<p>CSP appears properly configured</p>'}
        </div>
      `;

      cspResults.innerHTML = html;
    });
  } catch (error) {
    console.error('CSP analysis error:', error);
    document.getElementById('cspResults').innerHTML = '<p class="loading">Error analyzing CSP</p>';
  }
}

async function checkPhishing(tab) {
  try {
    const phishingResults = document.getElementById('phishingResults');
    const url = new URL(tab.url);
    
    // Basic phishing indicators
    const indicators = [];
    
    // Check for suspicious URL patterns
    if (url.hostname.includes('xn--')) {
      indicators.push('Uses IDN homograph attack (punycode)');
    }
    
    if (url.hostname.split('.').length > 4) {
      indicators.push('Suspicious subdomain depth');
    }
    
    if (url.hostname.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
      indicators.push('Uses IP address instead of domain name');
    }
    
    // Check for common phishing keywords
    const suspiciousKeywords = ['login', 'secure', 'account', 'update', 'verify', 'banking'];
    const hostnameHasSuspiciousWords = suspiciousKeywords.some(keyword => 
      url.hostname.toLowerCase().includes(keyword)
    );
    
    if (hostnameHasSuspiciousWords && !url.protocol.includes('https')) {
      indicators.push('Suspicious keywords with non-HTTPS connection');
    }

    // Note: Real OpenPhish API integration would go here
    // For now, we'll show a placeholder
    
    let html = '';
    
    if (indicators.length > 0) {
      html = `
        <div class="result-item warning">
          <h3>Phishing Indicators Detected <span class="badge high">Warning</span></h3>
          <p><strong>URL:</strong> ${url.hostname}</p>
          <p><strong>Indicators:</strong></p>
          <ul>
            ${indicators.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      `;
    } else {
      html = `
        <div class="result-item success">
          <h3>No Phishing Indicators <span class="badge low">Safe</span></h3>
          <p>URL appears legitimate. No obvious phishing indicators detected.</p>
          <p><strong>Note:</strong> OpenPhish API integration ready for production deployment.</p>
        </div>
      `;
    }
    
    phishingResults.innerHTML = html;
  } catch (error) {
    console.error('Phishing check error:', error);
    document.getElementById('phishingResults').innerHTML = '<p class="loading">Error checking for phishing</p>';
  }
}

function updateStatus(text, type) {
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.querySelector('.status-indicator');
  
  statusText.textContent = text;
  
  statusIndicator.style.background = 
    type === 'error' ? '#f44336' :
    type === 'success' ? '#4caf50' :
    type === 'loading' ? '#ff9800' :
    '#2196f3';
}

function storeFinding(url, type, details) {
  // Store finding for backend reporting
  chrome.storage.local.get(['findings'], (result) => {
    const findings = result.findings || [];
    findings.push({
      url,
      type,
      details,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 findings
    if (findings.length > 100) {
      findings.shift();
    }
    
    chrome.storage.local.set({ findings });
  });
}

function exportReport() {
  chrome.storage.local.get(['findings'], (result) => {
    const findings = result.findings || [];
    
    const report = {
      generatedAt: new Date().toISOString(),
      findings: findings,
      summary: {
        total: findings.length,
        byType: findings.reduce((acc, f) => {
          acc[f.type] = (acc[f.type] || 0) + 1;
          return acc;
        }, {})
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url: url,
      filename: `auron-security-report-${Date.now()}.json`,
      saveAs: true
    });
  });
}
