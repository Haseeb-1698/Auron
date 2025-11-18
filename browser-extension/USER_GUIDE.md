# Auron Security Analyzer - User Guide

## 📖 Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Features](#features)
4. [Getting Started](#getting-started)
5. [Using the Extension](#using-the-extension)
6. [Settings Configuration](#settings-configuration)
7. [Understanding Security Findings](#understanding-security-findings)
8. [OWASP Top 10 Integration](#owasp-top-10-integration)
9. [Integration with Auron Platform](#integration-with-auron-platform)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

---

## 🛡️ Introduction

The **Auron Security Analyzer** is a browser extension designed to enhance web security awareness by providing real-time analysis of:

- **Cookie Security**: Identifies insecure cookie configurations
- **Session Management**: Detects vulnerable session handling
- **Content Security Policy (CSP)**: Analyzes CSP headers for weaknesses
- **Phishing Detection**: Checks URLs against known phishing databases

This extension is part of the Auron Cybersecurity Training Platform and helps users learn about web security in a hands-on, practical way.

---

## 💾 Installation

### Chrome/Chromium

1. Download or clone the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `browser-extension` folder
6. The extension icon should appear in your toolbar

### Firefox

*Note: Firefox support coming soon. Current version uses Manifest V3 (Chrome only).*

---

## ✨ Features

### 🍪 Cookie Analysis

- Detects missing `Secure` flags
- Identifies missing `HttpOnly` attributes
- Checks `SameSite` policy configuration
- **New**: Third-party cookie detection
- **New**: Cookie lifespan analysis
- **New**: Tracking cookie identification

### 🔐 Session Security

- Identifies session cookies by name patterns
- Checks secure transmission (HTTPS)
- Detects XSS vulnerabilities in session handling
- Validates HttpOnly protection

### 🛡️ Content Security Policy (CSP)

- Analyzes CSP headers from meta tags and HTTP headers
- Detects `unsafe-inline` scripts
- Identifies `unsafe-eval()` usage
- Checks for wildcard sources (*)
- Reports missing CSP headers

### 🎣 Phishing Detection

- **OpenPhish Integration**: Real-time checks against OpenPhish database
- IDN homograph attack detection (punycode)
- Suspicious subdomain depth checking
- IP address instead of domain detection
- Suspicious keyword detection
- SSL/HTTPS validation

### 📚 OWASP Top 10 Mapping

- Maps security findings to OWASP Top 10:2021 categories
- Provides detailed remediation guidance
- Includes code examples for fixes
- Links to official OWASP documentation

### 🤖 Real-time Monitoring

- Auto-scan on page load (optional)
- Browser notifications for critical issues
- Badge indicators showing risk level
- Background security monitoring

### ☁️ Backend Integration

- Sync findings to Auron platform
- AI-powered vulnerability explanations
- Progress tracking for cybersecurity labs
- Historical analysis and trends

---

## 🚀 Getting Started

### First-Time Setup

1. **Install the Extension** (see Installation section)

2. **Open Settings**
   - Click the extension icon
   - Click the ⚙️ (gear) icon in the top-right corner

3. **Configure API Connection** (Optional)
   - Enter your Auron backend API URL (default: `http://localhost:4000`)
   - Enter your authentication token (JWT)
   - Click "Test Connection" to verify
   - Click "Save Settings"

4. **Enable Features**
   - Check "Sync findings to backend" to save analysis results
   - Check "Enable notifications" for security alerts
   - Check "Auto-scan on page load" for continuous monitoring
   - Check "AI-powered explanations" for detailed guidance

---

## 🔍 Using the Extension

### Basic Analysis

1. Navigate to any website
2. Click the Auron Security extension icon
3. Wait for analysis to complete (usually 1-2 seconds)
4. Review findings in each tab:
   - **Cookies**: Security issues with cookies
   - **Sessions**: Session management vulnerabilities
   - **CSP**: Content Security Policy analysis
   - **Phishing**: Phishing indicators and database checks

### Refreshing Analysis

- Click the **"Refresh Analysis"** button to re-scan the current page
- Useful after page updates or when investigating specific issues

### Exporting Reports

1. Click **"Export Report"** button
2. Save the JSON file to your computer
3. Report includes:
   - All security findings
   - Timestamps
   - URL information
   - Summary statistics

---

## ⚙️ Settings Configuration

### API Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Backend API URL | URL of your Auron platform | `http://localhost:4000` |
| Authentication Token | JWT token from your account | (empty) |
| OpenPhish API Key | Optional key for enhanced phishing detection | (empty) |

### Analysis Options

| Option | Description | Recommended |
|--------|-------------|-------------|
| Sync findings to backend | Automatically save findings to your account | ✅ On |
| Enable notifications | Show alerts for critical issues | ✅ On |
| Auto-scan on page load | Automatically analyze pages as you browse | ⚠️ Optional |
| AI-powered explanations | Use AI for detailed security guidance | ✅ On |

### OWASP Integration

| Option | Description | Recommended |
|--------|-------------|-------------|
| Show OWASP Top 10 categories | Map findings to OWASP categories | ✅ On |
| Show remediation guidance | Display fix suggestions | ✅ On |

---

## 🔎 Understanding Security Findings

### Severity Levels

| Badge | Severity | Risk | Action Required |
|-------|----------|------|-----------------|
| 🔴 High | Critical | Immediate threat | Fix immediately |
| 🟠 Medium | Moderate | Potential vulnerability | Fix soon |
| 🟡 Low | Minor | Best practice issue | Consider fixing |
| 🟢 Safe | None | Secure configuration | No action needed |

### Common Findings

#### Cookie Issues

**Missing Secure Flag**
- **Risk**: Cookie can be transmitted over unencrypted HTTP
- **Impact**: Man-in-the-middle attacks
- **Fix**: Set `Secure` flag on all cookies
- **OWASP**: A02:2021 - Cryptographic Failures

**Missing HttpOnly Flag**
- **Risk**: Cookie accessible via JavaScript
- **Impact**: XSS-based cookie theft
- **Fix**: Set `HttpOnly` flag on session cookies
- **OWASP**: A03:2021 - Injection

**Weak SameSite Policy**
- **Risk**: Vulnerable to CSRF attacks
- **Impact**: Unauthorized actions on behalf of user
- **Fix**: Use `SameSite=Strict` or `SameSite=Lax`
- **OWASP**: A01:2021 - Broken Access Control

#### Session Issues

**Session Transmitted Over HTTP**
- **Risk**: Session tokens sent in cleartext
- **Impact**: Session hijacking
- **Fix**: Use HTTPS for entire application
- **OWASP**: A07:2021 - Identification and Authentication Failures

#### CSP Issues

**Missing CSP Header**
- **Risk**: No protection against XSS attacks
- **Impact**: Code injection vulnerabilities
- **Fix**: Implement strict Content Security Policy
- **OWASP**: A05:2021 - Security Misconfiguration

**CSP Allows unsafe-inline**
- **Risk**: Inline scripts can execute
- **Impact**: Reduced XSS protection
- **Fix**: Use nonces or hashes for inline scripts
- **OWASP**: A03:2021 - Injection

#### Phishing Indicators

**IDN Homograph Attack**
- **Risk**: Domain uses punycode to impersonate legitimate site
- **Impact**: User deception, credential theft
- **Action**: Verify actual domain, avoid entering credentials

**Listed in OpenPhish Database**
- **Risk**: Confirmed phishing site
- **Impact**: HIGH - Credential theft, malware
- **Action**: Leave site immediately, do not enter any information

---

## 📚 OWASP Top 10 Integration

The extension maps all findings to the [OWASP Top 10:2021](https://owasp.org/Top10/) categories:

| Category | Description |
|----------|-------------|
| A01:2021 | Broken Access Control |
| A02:2021 | Cryptographic Failures |
| A03:2021 | Injection |
| A04:2021 | Insecure Design |
| A05:2021 | Security Misconfiguration |
| A06:2021 | Vulnerable and Outdated Components |
| A07:2021 | Identification and Authentication Failures |
| A08:2021 | Software and Data Integrity Failures |
| A09:2021 | Security Logging and Monitoring Failures |
| A10:2021 | Server-Side Request Forgery (SSRF) |

### Remediation Guidance

Each finding includes:
- **OWASP category badge**
- **Detailed explanation** of the vulnerability
- **Step-by-step fix instructions**
- **Code examples** showing secure implementation
- **Links to official documentation**

### Code Examples

When remediation guidance is enabled, you'll see code examples like:

```http
Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Strict
```

```html
<script nonce="{random}">...</script>
```

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'
```

---

## ☁️ Integration with Auron Platform

### Syncing Findings

When backend sync is enabled:
1. All security findings are automatically sent to your Auron account
2. Findings include full context (URL, type, details, risk level)
3. View historical data and trends in the Auron dashboard

### AI-Powered Explanations

When connected to Auron backend:
1. Click on any finding to get detailed AI explanation
2. Powered by LiquidMetal AI service
3. Provides context-aware security guidance
4. Adapts to your learning level

### Lab Integration

The extension integrates with Auron cybersecurity labs:
1. Automatically detects when browsing lab environments
2. Tracks progress and completion
3. Provides context-aware hints
4. Records findings for assessment

---

## 🔧 Troubleshooting

### Extension Not Loading

**Problem**: Extension icon doesn't appear

**Solutions**:
1. Check that Developer Mode is enabled
2. Verify all extension files are present
3. Look for errors in `chrome://extensions/`
4. Try removing and re-adding the extension

### Analysis Not Working

**Problem**: No results shown after clicking extension

**Solutions**:
1. Check browser console for errors (F12)
2. Verify the website uses HTTP/HTTPS (not chrome://, file://, etc.)
3. Try refreshing the page
4. Ensure content script is injected (check console for "content script loaded")

### Backend Connection Failed

**Problem**: "Connection failed" error in settings

**Solutions**:
1. Verify the API URL is correct
2. Check that the Auron backend is running
3. Ensure your JWT token is valid
4. Check for CORS issues in browser console
5. Try testing with `curl` to verify backend is accessible

### OpenPhish Not Working

**Problem**: Phishing detection shows errors

**Solutions**:
1. Check internet connection
2. OpenPhish feed may be temporarily unavailable
3. Wait a few minutes and try again
4. Extension will fall back to basic pattern matching

### Notifications Not Showing

**Problem**: No browser notifications appear

**Solutions**:
1. Check that notifications are enabled in settings
2. Verify browser has permission to show notifications
3. Check system notification settings
4. Ensure critical issues were actually detected

---

## ❓ FAQ

### Q: Does this extension send my browsing data anywhere?

**A**: Only if you enable "Sync findings to backend" and configure an API URL. When enabled, it sends:
- URLs you analyze
- Security findings
- Risk levels
- Timestamps

Your browsing data is NOT sent anywhere unless you explicitly enable backend sync.

### Q: Will this slow down my browsing?

**A**: No. The extension only analyzes pages when:
1. You click the extension icon (manual analysis)
2. Auto-scan is enabled (optional feature)

Analysis takes 1-2 seconds and runs in the background.

### Q: Can I use this without the Auron platform?

**A**: Yes! The extension works standalone. Backend integration is optional and provides:
- AI-powered explanations
- Historical tracking
- Lab integration

### Q: Is my data secure?

**A**: Yes. When using backend sync:
- All communication uses HTTPS
- Authentication via JWT tokens
- Data stored securely in Auron platform
- You control what data is sent

### Q: Does this detect all phishing sites?

**A**: No security tool is 100% perfect. This extension:
- Checks OpenPhish database (thousands of known phishing URLs)
- Uses pattern matching for suspicious indicators
- Should be used alongside other security tools
- Always verify URLs before entering sensitive information

### Q: Can I use this for my company/organization?

**A**: Yes! The extension can be:
- Deployed to your organization
- Connected to your Auron instance
- Customized for your needs
- Integrated with your security training program

### Q: How often is the OpenPhish database updated?

**A**: The extension caches the OpenPhish feed for 1 hour. The feed itself is updated by OpenPhish multiple times per day.

### Q: What's the difference between cookies and sessions?

**A**:
- **Cookies**: Small pieces of data stored by the browser
- **Sessions**: Cookies specifically used for authentication/user state
- The extension analyzes all cookies, with special focus on session cookies

### Q: Why do I see warnings on legitimate sites?

**A**: Security best practices aren't always followed, even by legitimate sites. Warnings indicate:
- Potential vulnerabilities
- Configuration issues
- Best practice violations

Use your judgment - not all warnings indicate malicious intent.

### Q: Can I contribute to this project?

**A**: Yes! The extension is part of the Auron platform:
- Report issues on GitHub
- Submit pull requests
- Suggest new features
- Help with documentation

---

## 📞 Support

For help, issues, or feedback:

- **Email**: support@auron-platform.com
- **GitHub**: [Auron Repository](https://github.com/your-org/auron)
- **Documentation**: [Auron Docs](https://docs.auron-platform.com)

---

## 📄 License

This extension is part of the Auron Cybersecurity Training Platform.

**Copyright © 2024 Auron Platform**

---

## 🎓 Learning Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Cookie Security](https://owasp.org/www-community/controls/SecureCookieAttribute)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Phishing Detection](https://owasp.org/www-community/attacks/Phishing)

---

**Version 1.0.0** | Last Updated: November 2024
