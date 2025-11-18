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
    const settings = await chrome.storage.local.get(['showOwaspMapping', 'showRemediationGuidance']);

    if (cookies.length === 0) {
      cookieResults.innerHTML = '<p class="loading">No cookies found</p>';
      return;
    }

    let html = '';
    let securityIssues = [];
    const currentDomain = new URL(tab.url).hostname;

    cookies.forEach(cookie => {
      const issues = [];
      const owaspIssues = [];

      // Check for security attributes
      if (!cookie.secure) {
        issues.push('Missing Secure flag');
        owaspIssues.push('cookie_no_secure');
      }
      if (!cookie.httpOnly) {
        issues.push('Missing HttpOnly flag');
        owaspIssues.push('cookie_no_httponly');
      }
      if (!cookie.sameSite || cookie.sameSite === 'None') {
        issues.push('Weak SameSite policy');
        owaspIssues.push('cookie_weak_samesite');
      }

      // Enhanced: Check for third-party cookies
      const isThirdParty = !cookie.domain.includes(currentDomain);
      if (isThirdParty) {
        issues.push('Third-party cookie');
      }

      // Enhanced: Check cookie expiration
      if (cookie.expirationDate) {
        const expiresIn = (cookie.expirationDate * 1000) - Date.now();
        const daysUntilExpiry = Math.floor(expiresIn / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry > 365) {
          issues.push(`Long lifespan (${Math.floor(daysUntilExpiry / 365)} years)`);
        }
      }

      const severity = issues.length > 2 ? 'error' : issues.length > 0 ? 'warning' : 'success';

      html += `
        <div class="result-item ${severity}">
          <h3>${cookie.name} <span class="badge ${issues.length > 2 ? 'high' : issues.length > 0 ? 'medium' : 'low'}">${issues.length > 0 ? 'Issues Found' : 'Secure'}</span></h3>
          <p><strong>Domain:</strong> ${cookie.domain}${isThirdParty ? ' (3rd party)' : ''}</p>
          ${issues.length > 0 ? `<p><strong>Issues:</strong> ${issues.join(', ')}</p>` : ''}
          ${settings.showOwaspMapping && owaspIssues.length > 0 ? getOwaspGuidanceForIssues(owaspIssues) : ''}
        </div>
      `;

      if (issues.length > 0) {
        securityIssues.push({ cookie: cookie.name, issues, owaspCategories: owaspIssues });
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

function getOwaspGuidanceForIssues(owaspIssues) {
  if (!owaspIssues || owaspIssues.length === 0) return '';

  // Show guidance for the first issue only to avoid clutter
  const firstIssue = owaspIssues[0];
  const mapping = mapFindingToOWASP(firstIssue);

  return getOwaspGuidance(mapping);
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
    const settings = await chrome.storage.local.get(['showOwaspMapping', 'openphishKey']);

    phishingResults.innerHTML = '<p class="loading">Checking phishing databases...</p>';

    // Basic phishing indicators
    const indicators = [];
    const owaspIssues = [];

    // Check for suspicious URL patterns
    if (url.hostname.includes('xn--')) {
      indicators.push('Uses IDN homograph attack (punycode)');
      owaspIssues.push('phishing_idn_homograph');
    }

    if (url.hostname.split('.').length > 4) {
      indicators.push('Suspicious subdomain depth');
      owaspIssues.push('phishing_suspicious_subdomain');
    }

    if (url.hostname.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) {
      indicators.push('Uses IP address instead of domain name');
      owaspIssues.push('phishing_ip_address');
    }

    // Check for common phishing keywords
    const suspiciousKeywords = ['login', 'secure', 'account', 'update', 'verify', 'banking'];
    const hostnameHasSuspiciousWords = suspiciousKeywords.some(keyword =>
      url.hostname.toLowerCase().includes(keyword)
    );

    if (hostnameHasSuspiciousWords && !url.protocol.includes('https')) {
      indicators.push('Suspicious keywords with non-HTTPS connection');
      owaspIssues.push('phishing_http_sensitive');
    }

    // Check OpenPhish database
    let openPhishResult = null;
    try {
      if (settings.openphishKey) {
        openPhishResult = await openPhishService.checkURLWithKey(tab.url, settings.openphishKey);
      } else {
        openPhishResult = await openPhishService.checkURL(tab.url);
      }

      if (openPhishResult.isPhishing) {
        indicators.push(`⚠️ CONFIRMED PHISHING SITE - Listed in OpenPhish database (${openPhishResult.confidence} confidence)`);
        owaspIssues.push('phishing_openphish_match');
      }
    } catch (error) {
      console.warn('OpenPhish check failed:', error);
    }

    let html = '';

    if (indicators.length > 0) {
      const severity = openPhishResult?.isPhishing ? 'error' : 'warning';
      html = `
        <div class="result-item ${severity}">
          <h3>Phishing Indicators Detected <span class="badge ${openPhishResult?.isPhishing ? 'high' : 'medium'}">
            ${openPhishResult?.isPhishing ? 'DANGER' : 'Warning'}
          </span></h3>
          <p><strong>URL:</strong> ${url.hostname}</p>
          <p><strong>Indicators:</strong></p>
          <ul>
            ${indicators.map(i => `<li>${i}</li>`).join('')}
          </ul>
          ${openPhishResult ? `<p><small>Last checked: ${new Date(openPhishResult.checkedAt).toLocaleString()}</small></p>` : ''}
          ${settings.showOwaspMapping && owaspIssues.length > 0 ? getOwaspGuidanceForIssues(owaspIssues) : ''}
        </div>
      `;

      // Store finding if phishing detected
      storeFinding(tab.url, 'phishing', {
        indicators,
        openPhishResult,
        severity: openPhishResult?.isPhishing ? 'critical' : 'medium'
      });
    } else {
      html = `
        <div class="result-item success">
          <h3>No Phishing Indicators <span class="badge low">Safe</span></h3>
          <p>URL appears legitimate. No obvious phishing indicators detected.</p>
          <p><strong>OpenPhish:</strong> Not listed in phishing database</p>
          ${openPhishResult ? `<p><small>Last checked: ${new Date(openPhishResult.checkedAt).toLocaleString()}</small></p>` : ''}
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
