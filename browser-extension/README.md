# 🛡️ Auron Security Analyzer - Browser Extension

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-yellow.svg)

**A comprehensive browser extension for real-time web security analysis and cybersecurity education**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

The **Auron Security Analyzer** is a browser extension designed for the **Auron Cybersecurity Training Platform**. It provides real-time security analysis of websites, helping users and developers identify common web vulnerabilities and learn about secure coding practices.

### 🎯 Learning Outcomes

- Understanding browser security mechanisms (cookies, sessions, CSP)
- Practical experience in phishing detection and web security
- Hands-on application security (AppSec) skills
- OWASP Top 10 vulnerability awareness
- Secure web development practices

---

## ✨ Features

### 🍪 Cookie Security Analysis

- **Security Flag Detection**
  - Missing `Secure` flag identification
  - `HttpOnly` attribute checking
  - `SameSite` policy validation

- **Advanced Analysis** (New!)
  - Third-party cookie detection
  - Cookie lifespan analysis
  - Tracking cookie identification
  - GDPR compliance insights

### 🔐 Session Management Analysis

- Session cookie identification (by pattern matching)
- Secure transmission verification (HTTPS)
- XSS vulnerability detection in session handling
- HttpOnly protection validation
- Session hijacking risk assessment

### 🛡️ Content Security Policy (CSP)

- CSP header analysis (meta tags & HTTP headers)
- Detection of:
  - `unsafe-inline` scripts
  - `unsafe-eval()` usage
  - Wildcard sources (*)
  - Missing CSP headers
- XSS protection evaluation

### 🎣 Phishing Detection

- **OpenPhish Integration** ✅
  - Real-time database checks
  - Free feed integration (hourly updates)
  - Premium API support
  - Domain-level and exact URL matching

- **Pattern Analysis**
  - IDN homograph attack detection (punycode)
  - Suspicious subdomain depth checking
  - IP address usage detection
  - Suspicious keyword identification
  - Non-HTTPS sensitive page detection

### 📚 OWASP Top 10:2021 Mapping

- Maps all findings to OWASP Top 10 categories
- Provides detailed remediation guidance
- Includes code examples for secure implementations
- Links to official OWASP documentation
- Educational tooltips and explanations

### 🤖 Real-time Monitoring

- **Auto-scan on page load** (optional)
- **Browser notifications** for critical issues
- **Badge indicators** showing risk level:
  - 🔴 Critical (!!!)
  - 🟠 High (!!)
  - 🟡 Medium (!)
  - 🟢 Low/Safe (✓)
- Background security monitoring

### ☁️ Backend Integration

- **Sync findings** to Auron platform
- **AI-powered explanations** (LiquidMetal/Claude integration)
- **Progress tracking** for cybersecurity labs
- **Historical analysis** and trends
- **JWT authentication**

### 📊 Reporting & Export

- JSON export of all findings
- Summary statistics
- Timestamp tracking
- Historical data retention (1000 findings)

---

## 🚀 Installation

### Prerequisites

- Google Chrome or Chromium-based browser (Version 88+)
- Manifest V3 support

### Install from Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/Haseeb-1698/Auron.git
   cd Auron/browser-extension
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top-right)
   - Click **"Load unpacked"**
   - Select the `browser-extension` directory
   - The Auron Security icon should appear in your toolbar

3. **Verify Installation**
   - Click the extension icon
   - You should see the Auron Security popup
   - Navigate to any website and run an analysis

### Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store for one-click installation.

---

## 🔧 Configuration

### First-Time Setup

1. **Click the extension icon** to open the popup
2. **Click the ⚙️ (settings) icon** in the top-right
3. **Configure settings** (see below)

### Settings Options

#### API Configuration

```
Backend API URL:    http://localhost:4000
Auth Token:         (Your JWT token from Auron account)
OpenPhish API Key:  (Optional - for enhanced phishing detection)
```

#### Analysis Options

- ✅ **Sync findings to backend** - Save analysis to Auron platform
- ✅ **Enable notifications** - Show alerts for critical issues
- ⚠️ **Auto-scan on page load** - Automatic analysis (may impact performance)
- ✅ **AI-powered explanations** - Detailed security guidance

#### OWASP Integration

- ✅ **Show OWASP Top 10 categories** - Map findings to OWASP standards
- ✅ **Show remediation guidance** - Display fix suggestions and code examples

---

## 📘 Usage

### Basic Analysis

1. **Navigate to any website**
2. **Click the Auron Security extension icon**
3. **Wait for analysis** (1-2 seconds)
4. **Review findings** in each tab:
   - **Cookies**: Cookie security issues
   - **Sessions**: Session management vulnerabilities
   - **CSP**: Content Security Policy analysis
   - **Phishing**: Phishing indicators and database checks

### Advanced Usage

#### Manual Re-scan
Click **"Refresh Analysis"** to re-run security checks

#### Export Report
Click **"Export Report"** to download findings as JSON

#### View OWASP Guidance
Enable "Show OWASP Top 10 categories" in settings to see:
- OWASP category badges
- Detailed vulnerability explanations
- Remediation steps with code examples
- Links to official documentation

#### Backend Sync
Configure backend settings to:
- Save findings to your account
- Get AI-powered explanations
- Track progress across labs
- View historical trends

---

## 🏗️ Architecture

### File Structure

```
browser-extension/
├── manifest.json              # Extension configuration (Manifest V3)
├── README.md                  # This file
├── USER_GUIDE.md             # Comprehensive user documentation
│
├── popup/                     # Extension popup UI
│   ├── popup.html            # Main UI structure
│   ├── popup.css             # Styling
│   └── popup.js              # Analysis logic & UI updates
│
├── settings/                  # Settings panel (NEW)
│   ├── settings.html         # Settings UI
│   ├── settings.css          # Settings styling
│   └── settings.js           # Settings management
│
├── js/                        # Core JavaScript modules
│   ├── background.js         # Service worker (auto-scan, badges, sync)
│   ├── content.js            # Content script (DOM analysis)
│   ├── owasp-mapper.js       # OWASP Top 10 mapping (NEW)
│   └── openphish-service.js  # OpenPhish API integration (NEW)
│
└── icons/                     # Extension icons
    ├── icon16.png            # Toolbar icon
    ├── icon48.png            # Extension management
    └── icon128.png           # Chrome Web Store
```

### Key Components

#### 1. Popup (Main UI)
- **popup.html/js**: Main analysis interface with 4 tabs
- Performs cookie, session, CSP, and phishing analysis
- Displays OWASP guidance when enabled
- Handles report export

#### 2. Background Service Worker
- **background.js**: Runs continuously in the background
- Auto-scan on page load (when enabled)
- Badge management (risk level indicators)
- Notifications for critical issues
- Backend sync for findings

#### 3. Content Script
- **content.js**: Injected into all pages
- DOM-based security analysis
- CSP header extraction from meta tags
- Detects inline scripts, event handlers, CSRF tokens, etc.

#### 4. OWASP Mapper
- **owasp-mapper.js**: Maps findings to OWASP Top 10:2021
- Provides remediation guidance
- Generates code examples
- Links to documentation

#### 5. OpenPhish Service
- **openphish-service.js**: Phishing detection service
- Free feed integration (text file, hourly cache)
- Premium API support
- Domain-level and exact URL matching

#### 6. Settings Panel
- **settings/**: Configuration interface
- API connection testing
- Option toggles
- Data management

---

## 🔐 Security & Privacy

### Permissions Required

```json
{
  "permissions": [
    "activeTab",        // Access current tab
    "cookies",          // Read cookies for analysis
    "storage",          // Store settings & findings locally
    "webRequest",       // Intercept headers for CSP analysis
    "notifications",    // Show security alerts
    "downloads"         // Export reports
  ],
  "host_permissions": ["<all_urls>"]
}
```

### Privacy Guarantees

- ✅ **No tracking**: Extension doesn't track browsing history
- ✅ **Local-first**: Findings stored locally by default
- ✅ **Opt-in sync**: Backend sync requires explicit configuration
- ✅ **No analytics**: No third-party analytics or telemetry
- ✅ **User control**: You decide what data to send

### Data Handling

**Stored Locally:**
- Extension settings
- Last 1000 findings
- OpenPhish feed cache (1 hour)

**Sent to Backend (when sync enabled):**
- URLs analyzed
- Security findings
- Risk levels
- Timestamps

**Never Sent:**
- Page content
- Forms data
- Passwords
- Personal information

---

## 🧪 Development

### Prerequisites

- Node.js (optional, for tooling)
- Chrome/Chromium browser
- Text editor / IDE

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/Haseeb-1698/Auron.git
cd Auron/browser-extension

# No build step required - pure JavaScript
# Load unpacked extension in Chrome
```

### Making Changes

1. **Edit files** in `popup/`, `js/`, or `settings/`
2. **Reload extension** in Chrome:
   - Go to `chrome://extensions/`
   - Click the reload icon on Auron Security card
3. **Test changes** on various websites
4. **Check console** for errors (F12)

### Adding New Features

#### New Analysis Module

1. Add analysis function to `popup/popup.js`:
   ```javascript
   async function analyzeNewFeature(tab) {
     // Analysis logic
   }
   ```

2. Add UI tab in `popup/popup.html`:
   ```html
   <button class="tab" data-tab="newfeature">New Feature</button>
   <div id="newfeature-tab" class="tab-content">
     <h2>New Feature Analysis</h2>
     <div id="newfeatureResults"></div>
   </div>
   ```

3. Call from `analyzeCurrentPage()`:
   ```javascript
   await Promise.all([
     analyzeCookies(tab),
     analyzeSessions(tab),
     analyzeCSP(tab),
     checkPhishing(tab),
     analyzeNewFeature(tab)  // Add here
   ]);
   ```

#### Background Processing

Extend `js/background.js` for continuous monitoring:

```javascript
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Your monitoring logic
  }
});
```

---

## 📚 Documentation

- **[USER_GUIDE.md](./USER_GUIDE.md)** - Comprehensive user documentation
- **[OWASP Top 10](https://owasp.org/Top10/)** - Vulnerability categories
- **[OpenPhish](https://openphish.com/)** - Phishing database
- **[Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)** - Chrome extension docs

---

## 🎓 Educational Use

### For Students

This extension is designed to teach:
- Browser security mechanisms
- Common web vulnerabilities
- Secure coding practices
- OWASP Top 10 awareness
- AppSec fundamentals

### For Educators

Use this extension to:
- Demonstrate real-world vulnerabilities
- Provide hands-on security training
- Assess student understanding
- Create lab exercises
- Track progress via Auron platform

### Lab Integration

When connected to Auron platform:
1. Extension detects lab environments
2. Tracks completion progress
3. Provides context-aware hints
4. Records findings for assessment

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Consider security implications
- Ensure browser compatibility

---

## 🐛 Troubleshooting

### Common Issues

**Extension Not Loading**
- Enable Developer Mode in `chrome://extensions/`
- Check for errors in extension details
- Verify all files are present

**Analysis Not Working**
- Refresh the page
- Check browser console (F12)
- Ensure content script is loaded

**Backend Connection Failed**
- Verify API URL and token
- Check CORS configuration
- Ensure backend is running

**OpenPhish Not Working**
- Check internet connection
- Feed may be temporarily unavailable
- Falls back to pattern matching

See [USER_GUIDE.md](./USER_GUIDE.md#troubleshooting) for detailed troubleshooting.

---

## 📊 Project Status

### Completed Features ✅

- ✅ Cookie security analysis (basic + advanced)
- ✅ Session management analysis
- ✅ Content Security Policy analysis
- ✅ Phishing detection (pattern + OpenPhish)
- ✅ OWASP Top 10 mapping
- ✅ Remediation guidance with code examples
- ✅ Settings panel
- ✅ Backend integration (sync, auth)
- ✅ Real-time monitoring
- ✅ Notifications
- ✅ Badge indicators
- ✅ Report export
- ✅ Extension icons

### In Progress 🚧

- 🚧 AI-powered explanations
- 🚧 Advanced security checks (SRI, CORS, Referrer Policy)
- 🚧 Firefox support (Manifest V2)

### Planned Features 📋

- 📋 Dark mode
- 📋 PDF report generation
- 📋 Browser history analysis
- 📋 Keyboard shortcuts
- 📋 Multi-language support

---

## 📄 License

MIT License

Copyright (c) 2024 Auron Cybersecurity Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[Full license text...]

---

## 🙏 Acknowledgments

- **OWASP** - For the Top 10 vulnerability framework
- **OpenPhish** - For the phishing detection feed
- **Chrome Extensions Team** - For Manifest V3 documentation
- **Auron Community** - For testing and feedback

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Haseeb-1698/Auron/issues)
- **Email**: support@auron-platform.com
- **Documentation**: [USER_GUIDE.md](./USER_GUIDE.md)
- **Platform**: [Auron Dashboard](https://auron-platform.com)

---

<div align="center">

**Built with ❤️ for the Auron Cybersecurity Training Platform**

[⬆ Back to Top](#-auron-security-analyzer---browser-extension)

</div>
