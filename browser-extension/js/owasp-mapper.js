// OWASP Top 10 Mapping and Guidance

const OWASP_CATEGORIES = {
  A01_BROKEN_ACCESS_CONTROL: {
    id: 'A01:2021',
    name: 'Broken Access Control',
    description: 'Restrictions on what authenticated users can do are often not properly enforced',
    severity: 'high'
  },
  A02_CRYPTOGRAPHIC_FAILURES: {
    id: 'A02:2021',
    name: 'Cryptographic Failures',
    description: 'Failures related to cryptography often lead to sensitive data exposure',
    severity: 'high'
  },
  A03_INJECTION: {
    id: 'A03:2021',
    name: 'Injection',
    description: 'Injection flaws occur when untrusted data is sent to an interpreter',
    severity: 'critical'
  },
  A04_INSECURE_DESIGN: {
    id: 'A04:2021',
    name: 'Insecure Design',
    description: 'Missing or ineffective control design',
    severity: 'high'
  },
  A05_SECURITY_MISCONFIGURATION: {
    id: 'A05:2021',
    name: 'Security Misconfiguration',
    description: 'Security misconfiguration is the most commonly seen issue',
    severity: 'medium'
  },
  A06_VULNERABLE_COMPONENTS: {
    id: 'A06:2021',
    name: 'Vulnerable and Outdated Components',
    description: 'Using components with known vulnerabilities',
    severity: 'high'
  },
  A07_IDENTIFICATION_FAILURES: {
    id: 'A07:2021',
    name: 'Identification and Authentication Failures',
    description: 'Failures in authentication and session management',
    severity: 'critical'
  },
  A08_SOFTWARE_INTEGRITY_FAILURES: {
    id: 'A08:2021',
    name: 'Software and Data Integrity Failures',
    description: 'Code and infrastructure that does not protect against integrity violations',
    severity: 'high'
  },
  A09_LOGGING_FAILURES: {
    id: 'A09:2021',
    name: 'Security Logging and Monitoring Failures',
    description: 'Insufficient logging and monitoring',
    severity: 'medium'
  },
  A10_SSRF: {
    id: 'A10:2021',
    name: 'Server-Side Request Forgery (SSRF)',
    description: 'Occurs when a web application fetches a remote resource without validating the user-supplied URL',
    severity: 'medium'
  }
};

// Mapping of security findings to OWASP categories
const FINDING_TO_OWASP = {
  // Cookie-related findings
  'cookie_no_secure': {
    category: OWASP_CATEGORIES.A02_CRYPTOGRAPHIC_FAILURES,
    title: 'Cookie Missing Secure Flag',
    description: 'Cookie can be transmitted over unencrypted HTTP connections',
    remediation: 'Set the Secure flag on all cookies containing sensitive data. This ensures cookies are only sent over HTTPS connections.',
    code_example: 'Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Strict',
    references: [
      'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
      'https://owasp.org/www-community/controls/SecureCookieAttribute'
    ]
  },
  'cookie_no_httponly': {
    category: OWASP_CATEGORIES.A03_INJECTION,
    title: 'Cookie Missing HttpOnly Flag',
    description: 'Cookie is accessible via JavaScript, making it vulnerable to XSS attacks',
    remediation: 'Set the HttpOnly flag on session cookies to prevent JavaScript access. This mitigates XSS-based cookie theft.',
    code_example: 'Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Strict',
    references: [
      'https://owasp.org/Top10/A03_2021-Injection/',
      'https://owasp.org/www-community/HttpOnly'
    ]
  },
  'cookie_weak_samesite': {
    category: OWASP_CATEGORIES.A01_BROKEN_ACCESS_CONTROL,
    title: 'Cookie Weak SameSite Policy',
    description: 'Cookie vulnerable to cross-site request forgery (CSRF) attacks',
    remediation: 'Set SameSite=Strict or SameSite=Lax on cookies. Use Strict for session cookies, Lax for general authentication.',
    code_example: 'Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Strict',
    references: [
      'https://owasp.org/Top10/A01_2021-Broken_Access_Control/',
      'https://owasp.org/www-community/SameSite'
    ]
  },

  // Session-related findings
  'session_insecure_transmission': {
    category: OWASP_CATEGORIES.A07_IDENTIFICATION_FAILURES,
    title: 'Session Transmitted Over Insecure Channel',
    description: 'Session cookie transmitted over HTTP, vulnerable to interception',
    remediation: 'Always use HTTPS for your entire application. Redirect HTTP to HTTPS and set HSTS headers.',
    code_example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
    references: [
      'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html'
    ]
  },
  'session_javascript_accessible': {
    category: OWASP_CATEGORIES.A03_INJECTION,
    title: 'Session Accessible via JavaScript',
    description: 'Session cookie vulnerable to XSS attacks due to missing HttpOnly flag',
    remediation: 'Set HttpOnly flag on all session cookies to prevent JavaScript access.',
    code_example: 'Set-Cookie: SESSIONID=xyz789; Secure; HttpOnly; SameSite=Strict; Path=/',
    references: [
      'https://owasp.org/Top10/A03_2021-Injection/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html'
    ]
  },

  // CSP-related findings
  'csp_missing': {
    category: OWASP_CATEGORIES.A05_SECURITY_MISCONFIGURATION,
    title: 'Missing Content Security Policy',
    description: 'No CSP header found, site vulnerable to XSS and data injection attacks',
    remediation: 'Implement a strict Content Security Policy to control which resources can be loaded.',
    code_example: "Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; object-src 'none'",
    references: [
      'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'
    ]
  },
  'csp_unsafe_inline': {
    category: OWASP_CATEGORIES.A03_INJECTION,
    title: 'CSP Allows Unsafe Inline Scripts',
    description: 'CSP allows inline scripts, reducing XSS protection',
    remediation: 'Remove unsafe-inline from CSP. Use nonces or hashes for necessary inline scripts.',
    code_example: "Content-Security-Policy: script-src 'self' 'nonce-{random}'",
    references: [
      'https://owasp.org/Top10/A03_2021-Injection/',
      'https://content-security-policy.com/'
    ]
  },
  'csp_unsafe_eval': {
    category: OWASP_CATEGORIES.A03_INJECTION,
    title: 'CSP Allows Unsafe Eval',
    description: 'CSP allows eval(), enabling potential code injection',
    remediation: 'Remove unsafe-eval from CSP. Refactor code to avoid eval() and Function() constructors.',
    code_example: "Content-Security-Policy: script-src 'self'",
    references: [
      'https://owasp.org/Top10/A03_2021-Injection/',
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval'
    ]
  },
  'csp_wildcard': {
    category: OWASP_CATEGORIES.A05_SECURITY_MISCONFIGURATION,
    title: 'CSP Uses Wildcard Source',
    description: 'CSP uses wildcard (*) source, reducing effectiveness',
    remediation: 'Specify exact domains instead of wildcards in CSP directives.',
    code_example: "Content-Security-Policy: script-src 'self' https://cdn.example.com",
    references: [
      'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/'
    ]
  },

  // Phishing-related findings
  'phishing_idn_homograph': {
    category: OWASP_CATEGORIES.A04_INSECURE_DESIGN,
    title: 'IDN Homograph Attack Detected',
    description: 'URL uses punycode to impersonate legitimate domain',
    remediation: 'Verify the actual domain. Be cautious of internationalized domain names that look similar to known brands.',
    references: [
      'https://owasp.org/www-community/attacks/IDN_homograph_attack'
    ]
  },
  'phishing_suspicious_subdomain': {
    category: OWASP_CATEGORIES.A04_INSECURE_DESIGN,
    title: 'Suspicious Subdomain Depth',
    description: 'Unusually deep subdomain structure may indicate phishing',
    remediation: 'Verify the domain is legitimate. Check SSL certificate and contact site owner if unsure.',
    references: [
      'https://owasp.org/www-community/attacks/Phishing'
    ]
  },
  'phishing_ip_address': {
    category: OWASP_CATEGORIES.A04_INSECURE_DESIGN,
    title: 'IP Address Instead of Domain',
    description: 'Site uses IP address instead of domain name, common in phishing',
    remediation: 'Avoid entering credentials on sites accessed via IP address. Verify authenticity.',
    references: [
      'https://owasp.org/www-community/attacks/Phishing'
    ]
  },
  'phishing_http_sensitive': {
    category: OWASP_CATEGORIES.A02_CRYPTOGRAPHIC_FAILURES,
    title: 'Sensitive Keywords on Non-HTTPS Site',
    description: 'Site contains login/banking keywords but uses HTTP instead of HTTPS',
    remediation: 'Never enter sensitive information on non-HTTPS sites. Verify SSL certificate.',
    references: [
      'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/'
    ]
  },
  'phishing_openphish_match': {
    category: OWASP_CATEGORIES.A04_INSECURE_DESIGN,
    title: 'Known Phishing Site',
    description: 'This URL is listed in OpenPhish database as a known phishing site',
    remediation: 'DO NOT enter any credentials or personal information. Leave this site immediately.',
    references: [
      'https://openphish.com/',
      'https://owasp.org/www-community/attacks/Phishing'
    ]
  },

  // DOM-related findings
  'dom_inline_script': {
    category: OWASP_CATEGORIES.A03_INJECTION,
    title: 'Inline Script Detected',
    description: 'Inline scripts found, potential XSS vector',
    remediation: 'Move inline scripts to external files and use CSP with nonces or hashes.',
    code_example: '<script nonce="{random}">...</script>',
    references: [
      'https://owasp.org/Top10/A03_2021-Injection/'
    ]
  },
  'dom_inline_handler': {
    category: OWASP_CATEGORIES.A03_INJECTION,
    title: 'Inline Event Handler Detected',
    description: 'Inline event handlers (onclick, etc.) found, violates CSP best practices',
    remediation: 'Use addEventListener() instead of inline event handlers.',
    code_example: "document.getElementById('btn').addEventListener('click', handleClick);",
    references: [
      'https://owasp.org/Top10/A03_2021-Injection/'
    ]
  },
  'dom_no_csrf_token': {
    category: OWASP_CATEGORIES.A01_BROKEN_ACCESS_CONTROL,
    title: 'Form Missing CSRF Token',
    description: 'Form found without CSRF protection token',
    remediation: 'Implement CSRF tokens for all state-changing operations. Use SameSite cookies as additional protection.',
    code_example: '<input type="hidden" name="csrf_token" value="{secure_random_token}">',
    references: [
      'https://owasp.org/www-community/attacks/csrf',
      'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html'
    ]
  },
  'dom_autocomplete_password': {
    category: OWASP_CATEGORIES.A07_IDENTIFICATION_FAILURES,
    title: 'Password Field Allows Autocomplete',
    description: 'Password field has autocomplete enabled',
    remediation: 'Consider the security implications. For highly sensitive forms, use autocomplete="off" on password fields.',
    code_example: '<input type="password" name="password" autocomplete="new-password">',
    references: [
      'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/'
    ]
  },
  'dom_mixed_content': {
    category: OWASP_CATEGORIES.A02_CRYPTOGRAPHIC_FAILURES,
    title: 'Mixed Content Detected',
    description: 'HTTPS page loading HTTP resources, vulnerable to MITM attacks',
    remediation: 'Load all resources over HTTPS. Update resource URLs to use HTTPS or relative paths.',
    code_example: '<script src="https://cdn.example.com/script.js"></script>',
    references: [
      'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
      'https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content'
    ]
  }
};

// Helper function to map a finding type to OWASP category
function mapFindingToOWASP(findingType) {
  return FINDING_TO_OWASP[findingType] || {
    category: OWASP_CATEGORIES.A05_SECURITY_MISCONFIGURATION,
    title: 'Security Issue Detected',
    description: 'A security configuration issue was detected',
    remediation: 'Review security best practices for this component',
    references: ['https://owasp.org/Top10/']
  };
}

// Get OWASP category badge HTML
function getOwaspBadge(category) {
  const colors = {
    critical: '#d32f2f',
    high: '#f57c00',
    medium: '#fbc02d',
    low: '#388e3c'
  };

  return `<span class="owasp-badge" style="background: ${colors[category.severity]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${category.id}</span>`;
}

// Get detailed OWASP guidance HTML
function getOwaspGuidance(mapping) {
  return `
    <div class="owasp-guidance" style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea;">
      <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #333;">
        ${getOwaspBadge(mapping.category)} ${mapping.category.name}
      </h4>
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #555;"><strong>Issue:</strong> ${mapping.description}</p>
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #555;"><strong>Fix:</strong> ${mapping.remediation}</p>
      ${mapping.code_example ? `
        <details style="margin-top: 8px;">
          <summary style="cursor: pointer; font-size: 12px; color: #667eea; font-weight: 600;">Show code example</summary>
          <pre style="margin-top: 8px; padding: 8px; background: #263238; color: #aed581; border-radius: 4px; font-size: 11px; overflow-x: auto;"><code>${mapping.code_example}</code></pre>
        </details>
      ` : ''}
      <div style="margin-top: 8px;">
        ${mapping.references.map(ref => `<a href="${ref}" target="_blank" style="font-size: 11px; color: #667eea; margin-right: 12px;">📚 Learn more</a>`).join('')}
      </div>
    </div>
  `;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OWASP_CATEGORIES,
    FINDING_TO_OWASP,
    mapFindingToOWASP,
    getOwaspBadge,
    getOwaspGuidance
  };
}
