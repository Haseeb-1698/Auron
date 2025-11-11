# Auron Security Analyzer - Browser Extension

A Chrome browser extension that performs real-time security analysis of web pages, including cookie analysis, session management, Content Security Policy (CSP) checking, and phishing detection.

## Features

### 🍪 Cookie Analysis
- Detects missing Secure flags
- Identifies HttpOnly attribute issues
- Checks SameSite policy configuration
- Highlights potential security risks

### 🔐 Session Analysis
- Identifies session cookies
- Checks for secure transmission
- Detects XSS vulnerabilities in session handling

### 🛡️ Content Security Policy (CSP)
- Analyzes CSP headers
- Detects unsafe inline scripts
- Identifies wildcard sources
- Reports missing CSP headers

### 🎣 Phishing Detection
- URL pattern analysis
- IDN homograph attack detection
- Suspicious subdomain checking
- OpenPhish API integration ready

## Installation

### From Source
1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `browser-extension` directory

### Production Build
```bash
# Build the extension (if using a build process)
cd browser-extension
# Package as .crx or .zip for distribution
```

## Usage

1. Click the Auron extension icon in your browser toolbar
2. The extension will automatically analyze the current page
3. Navigate through tabs to see different analysis results:
   - **Cookies**: Security analysis of all cookies
   - **Sessions**: Session cookie security check
   - **CSP**: Content Security Policy evaluation
   - **Phishing**: Phishing indicator detection

4. Use the "Refresh Analysis" button to re-scan the page
5. Use the "Export Report" button to download findings as JSON

## Backend Integration

The extension can sync findings with the Auron backend API:

1. Configure the backend API URL in extension settings
2. Authenticate with your Auron account
3. Findings will be automatically synced for progress tracking

## Development

### File Structure
```
browser-extension/
├── manifest.json          # Extension configuration
├── popup/
│   ├── popup.html        # Extension popup UI
│   ├── popup.css         # Popup styles
│   └── popup.js          # Popup logic
├── js/
│   ├── background.js     # Background service worker
│   └── content.js        # Content script for page analysis
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Adding New Features

1. **New Analysis Module**: Add to `popup.js` and create corresponding UI tab
2. **Background Processing**: Extend `background.js` for continuous monitoring
3. **Page Interaction**: Enhance `content.js` for DOM-based analysis

## API Integration

### OpenPhish API
To enable OpenPhish integration:

1. Get an API key from [OpenPhish](https://openphish.com/)
2. Add to extension settings or environment configuration
3. Update the `checkPhishing()` function in `popup.js`

```javascript
// Example OpenPhish API integration
async function checkWithOpenPhish(url) {
  const response = await fetch('https://openphish.com/feed.txt');
  const phishingUrls = await response.text();
  return phishingUrls.includes(url);
}
```

## Security Considerations

- Extension requires minimal permissions
- No data is collected without user consent
- Findings stored locally by default
- Backend sync requires explicit authentication

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- New features include documentation
- Security implications are considered

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: [Repository Issues](https://github.com/Haseeb-1698/Auron/issues)
- Documentation: See main project README
