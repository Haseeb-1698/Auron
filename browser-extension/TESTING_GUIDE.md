# Browser Extension Testing Guide

## Quick Verification Checklist

This guide helps you test the Auron Security Analyzer browser extension to ensure all features work correctly.

## Pre-Installation Verification

### File Structure Check

```bash
cd browser-extension

# Verify all required files exist
ls -la manifest.json                    # ✅ Manifest V3 configuration
ls -la popup/popup.html                # ✅ Main UI
ls -la popup/popup.js                  # ✅ Analysis logic (400 lines)
ls -la popup/popup.css                 # ✅ Styling
ls -la js/background.js                # ✅ Service worker (200 lines)
ls -la js/content.js                   # ✅ Content script (127 lines)
ls -la js/owasp-mapper.js              # ✅ OWASP Top 10 mapping (329 lines)
ls -la js/openphish-service.js         # ✅ Phishing detection (185 lines)
ls -la settings/settings.html          # ✅ Settings page
ls -la settings/settings.js            # ✅ Settings logic (130 lines)
ls -la icons/*.png                     # ✅ Extension icons (16, 48, 128)
```

### Syntax Validation

```bash
# Check all JavaScript files for syntax errors
node -c popup/popup.js
node -c js/background.js
node -c js/content.js
node -c js/owasp-mapper.js
node -c js/openphish-service.js
node -c settings/settings.js

# Validate manifest.json
python3 -m json.tool manifest.json > /dev/null && echo "✅ Valid"
```

**Expected**: All files should pass syntax validation with no errors.

---

## Installation in Chrome/Chromium

### Step 1: Enable Developer Mode

1. Open Chrome/Chromium browser
2. Navigate to `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top-right corner)

### Step 2: Load Extension

1. Click **"Load unpacked"** button
2. Navigate to and select the `browser-extension/` directory
3. Click "Select Folder"

### Step 3: Verify Installation

**Expected Results**:
- ✅ Extension appears in the extensions list
- ✅ Extension name: "Auron Security Analyzer"
- ✅ Version: 1.0.0
- ✅ Shield icon (🛡️) appears in Chrome toolbar
- ✅ No error messages in the extension details

**Troubleshooting**:
- If you see errors, check the browser console (F12)
- Ensure all files are present in the directory
- Verify manifest.json is valid JSON

---

## Feature Testing

### Test 1: Basic Popup Functionality

**Steps**:
1. Click the Auron extension icon in the toolbar
2. Popup should open (400px x 500px)

**Expected Results**:
- ✅ Popup displays with purple gradient header
- ✅ "🛡️ Auron Security" title visible
- ✅ Four tabs visible: Cookies, Sessions, CSP, Phishing
- ✅ Status indicator shows "Analyzing..." (orange dot)
- ✅ Two buttons: "Refresh Analysis" and "Export Report"
- ✅ Settings gear icon (⚙️) in top-right

**Screenshot Test Sites**:
- Test on: `https://example.com`
- Should complete analysis in 1-2 seconds

---

### Test 2: Cookie Analysis

**Test Site**: `https://github.com` (has many cookies)

**Steps**:
1. Navigate to GitHub
2. Click Auron extension icon
3. Wait for analysis to complete
4. Click "Cookies" tab (should be active by default)

**Expected Results**:
- ✅ Displays list of cookies with security analysis
- ✅ Shows cookie names (e.g., `logged_in`, `_gh_sess`)
- ✅ Each cookie shows:
  - Domain (with 3rd party indicator if applicable)
  - Security flags: Secure, HttpOnly, SameSite
  - Issues (if any): "Missing Secure flag", etc.
- ✅ Color-coded severity:
  - 🟢 Green = Secure (all flags present)
  - 🟡 Yellow = Warning (1-2 issues)
  - 🔴 Red = Error (3+ issues)
- ✅ Badge shows "Issues Found" or "Secure"

**Advanced Check** (if OWASP mapping enabled):
- Enable OWASP mapping in settings
- Should show OWASP category badges (A02:2021, A03:2021, etc.)
- Should show remediation guidance with code examples

---

### Test 3: Session Management Analysis

**Test Site**: `https://github.com` (has session cookies)

**Steps**:
1. Navigate to GitHub (logged in if possible)
2. Click Auron extension icon
3. Click "Sessions" tab

**Expected Results**:
- ✅ Detects session cookies (names containing "session", "sess", "token")
- ✅ For each session cookie, checks:
  - Secure flag (should be ✅ for HTTPS sites)
  - HttpOnly flag (critical for XSS protection)
- ✅ Shows issues:
  - "Session transmitted over insecure channel" (if not HTTPS)
  - "Session accessible via JavaScript (XSS risk)" (if no HttpOnly)
- ✅ Badge: "Vulnerable" (red) or "Secure" (green)

**Edge Case**: Navigate to `http://example.com`
- Should warn about insecure transmission

---

### Test 4: Content Security Policy (CSP)

**Test Site**: `https://github.com` (has CSP)

**Steps**:
1. Navigate to GitHub
2. Click Auron extension icon
3. Click "CSP" tab
4. Wait for content script to respond

**Expected Results**:
- ✅ Shows "CSP Header Found" if CSP exists
- ✅ Displays first 100 characters of CSP policy
- ✅ Detects common issues:
  - `'unsafe-inline'` - "Allows unsafe inline scripts"
  - `'unsafe-eval'` - "Allows unsafe eval()"
  - `*` wildcard - "Uses wildcard source"
- ✅ Badge: "Good" (green), "Issues Found" (yellow/red), or "Warning" (orange)

**Edge Case**: Test on site without CSP (e.g., `http://example.com`)
- ✅ Shows "No CSP Detected" warning
- ✅ Message: "Site may be vulnerable to XSS attacks"

---

### Test 5: Phishing Detection

**Test Site**: Use multiple test cases

**Test Case 1: Legitimate Site** (`https://github.com`)

**Expected Results**:
- ✅ Shows "No Phishing Indicators"
- ✅ Badge: "Safe" (green)
- ✅ "URL appears legitimate"
- ✅ "OpenPhish: Not listed in phishing database"

**Test Case 2: IP Address URL** (`http://127.0.0.1`)

**Expected Results**:
- ✅ Detects: "Uses IP address instead of domain name"
- ✅ Badge: "Warning" (orange)
- ✅ Lists phishing indicators

**Test Case 3: Punycode/IDN** (if available)

**Expected Results**:
- ✅ Detects IDN homograph attack (xn-- prefix)
- ✅ Shows warning indicator

**Test Case 4: Suspicious Keywords**
Navigate to: `http://secure-login-banking-update.example.com`

**Expected Results**:
- ✅ Detects suspicious keywords + non-HTTPS
- ✅ Warning indicator

**OpenPhish Integration**:
- ✅ Extension fetches OpenPhish free feed
- ✅ Feed cached for 1 hour
- ✅ Shows "Last checked" timestamp

---

### Test 6: Settings Panel

**Steps**:
1. Click Auron extension icon
2. Click settings gear icon (⚙️) in top-right
3. Settings page opens in new tab

**Expected Results**:
- ✅ Settings page displays
- ✅ Three sections visible:
  1. API Configuration
  2. Analysis Options
  3. OWASP Integration

**Section 1: API Configuration**
- ✅ Backend API URL field (default: `http://localhost:4000`)
- ✅ Authentication Token field (password type)
- ✅ OpenPhish API Key field (optional)

**Section 2: Analysis Options**
- ✅ Sync findings to backend (checkbox)
- ✅ Enable notifications (checkbox)
- ✅ Auto-scan on page load (checkbox)
- ✅ AI-powered explanations (checkbox)

**Section 3: OWASP Integration**
- ✅ Show OWASP Top 10 categories (checkbox)
- ✅ Show remediation guidance (checkbox)

**Buttons**:
- ✅ "Save Settings" button (primary, blue)
- ✅ "Test Connection" button (secondary, gray)
- ✅ "Clear All Data" button (danger, red)

**Test Save Functionality**:
1. Change API URL to `http://test.example.com`
2. Enable "Show OWASP Top 10 categories"
3. Click "Save Settings"
4. Refresh extension popup
5. Re-open settings
6. ✅ Settings should be persisted

---

### Test 7: Export Report

**Steps**:
1. Browse several websites (e.g., GitHub, Google, Example.com)
2. Let extension analyze each site
3. Open extension popup
4. Click "Export Report" button

**Expected Results**:
- ✅ Browser download dialog appears
- ✅ Filename: `auron-security-report-{timestamp}.json`
- ✅ File downloads successfully
- ✅ File contains valid JSON

**File Contents Should Include**:
```json
{
  "generatedAt": "2024-01-15T12:34:56.789Z",
  "findings": [
    {
      "url": "https://github.com",
      "type": "cookie",
      "details": { "issues": [...] },
      "timestamp": "2024-01-15T12:30:00.000Z"
    }
  ],
  "summary": {
    "total": 3,
    "byType": {
      "cookie": 1,
      "session": 1,
      "phishing": 1
    }
  }
}
```

---

### Test 8: Background Auto-Scan (Optional)

**Prerequisites**: Enable "Auto-scan on page load" in settings

**Steps**:
1. Open settings
2. Enable "Auto-scan on page load"
3. Save settings
4. Navigate to a new website

**Expected Results**:
- ✅ Extension analyzes page automatically on load
- ✅ Extension badge updates with risk level:
  - `✓` = Safe/Low (green)
  - `!` = Medium (yellow)
  - `!!` = High (orange)
  - `!!!` = Critical (red)

**Test Notifications** (if enabled):
1. Enable "Enable notifications" in settings
2. Navigate to site with critical issues
3. ✅ Browser notification appears
4. ✅ Title: "Auron Security Alert"
5. ✅ Message: "Security issues detected on {hostname}"

---

### Test 9: Backend Integration

**Prerequisites**:
- Auron backend running (default: `http://localhost:4000`)
- Valid JWT token from login

**Steps**:
1. Start Auron backend: `cd backend && npm start`
2. Login to Auron web app and copy JWT token
3. Open extension settings
4. Paste JWT token in "Authentication Token" field
5. Enable "Sync findings to backend"
6. Click "Save Settings"
7. Click "Test Connection"
8. Browse websites and analyze them

**Expected Results**:
- ✅ "Test Connection" shows success message
- ✅ Findings automatically sent to backend
- ✅ Check backend logs: Should see "Finding synced to backend"
- ✅ Findings stored in `extension_findings` table

**Backend Endpoint Test**:
```bash
# After analyzing some sites, check backend
curl -H "Authorization: Bearer {TOKEN}" \
  http://localhost:4000/api/reports/extension-findings
```

Expected: Returns array of findings

---

### Test 10: OWASP Mapping & Guidance

**Steps**:
1. Open extension settings
2. Enable both OWASP options:
   - ✅ Show OWASP Top 10 categories
   - ✅ Show remediation guidance
3. Save settings
4. Navigate to a site with security issues
5. Open extension popup

**Expected Results**:
- ✅ Each finding shows OWASP badge (e.g., `A02:2021`)
- ✅ Shows OWASP category name (e.g., "Cryptographic Failures")
- ✅ Displays guidance section with:
  - Issue description
  - Remediation steps
  - Code example (in collapsible `<details>`)
  - Links to OWASP documentation
- ✅ Properly styled guidance box (blue left border, gray background)

---

## Edge Cases & Error Handling

### Test 11: Error Scenarios

**Test Case 1: Content Script Not Loaded**
1. Open extension on `chrome://extensions/` page
2. Try to analyze

**Expected**:
- ✅ CSP tab shows: "Unable to analyze CSP (inject content script first)"
- ✅ Other tabs still work (cookies, sessions, phishing)

**Test Case 2: No Cookies**
1. Open extension in incognito mode
2. Navigate to `https://example.com`

**Expected**:
- ✅ Cookies tab shows: "No cookies found"

**Test Case 3: OpenPhish Feed Unavailable**
1. Disconnect internet
2. Analyze a site

**Expected**:
- ✅ Phishing tab still works (pattern matching)
- ✅ Shows: "OpenPhish check failed" in console (visible if developer mode)
- ✅ Falls back to pattern-based detection

**Test Case 4: Backend Connection Failed**
1. Stop backend server
2. Enable backend sync
3. Analyze a site

**Expected**:
- ✅ Extension still works
- ✅ Console shows: "Failed to sync finding to backend"
- ✅ Findings stored locally

---

## Performance Testing

### Test 12: Analysis Speed

**Steps**:
1. Navigate to complex site (e.g., `https://github.com`)
2. Click extension icon
3. Time analysis completion

**Expected**:
- ✅ Initial analysis: < 2 seconds
- ✅ Re-analysis (cache hit): < 500ms
- ✅ Status changes from "Analyzing..." to "Analysis complete"

**Memory Test**:
1. Analyze 20 different websites
2. Check extension memory usage in Task Manager

**Expected**:
- ✅ Memory usage: < 50 MB
- ✅ Findings history limited to 100 items

---

## Browser Compatibility

### Supported Browsers

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Google Chrome | 88+ | ✅ Full Support | Manifest V3 |
| Microsoft Edge | 88+ | ✅ Full Support | Chromium-based |
| Brave | Latest | ✅ Full Support | Chromium-based |
| Opera | 74+ | ✅ Full Support | Chromium-based |
| Firefox | - | ❌ Not Supported | Requires Manifest V2 port |

---

## Common Issues & Solutions

### Issue 1: Extension Won't Load

**Symptoms**:
- Error when loading unpacked extension
- "Manifest file is missing or unreadable"

**Solutions**:
1. Verify `manifest.json` exists in the root of `browser-extension/`
2. Validate JSON syntax: `python3 -m json.tool manifest.json`
3. Ensure you selected the correct directory

---

### Issue 2: Popup Not Opening

**Symptoms**:
- Clicking icon does nothing
- Popup appears blank

**Solutions**:
1. Check browser console (F12) for errors
2. Verify `popup/popup.html` exists
3. Check if popup.js has syntax errors: `node -c popup/popup.js`
4. Reload extension: `chrome://extensions/` → Click reload icon

---

### Issue 3: Analysis Not Working

**Symptoms**:
- Status stuck on "Analyzing..."
- No results appear

**Solutions**:
1. Open browser DevTools on the popup: Right-click popup → Inspect
2. Check console for JavaScript errors
3. Verify site has cookies/CSP to analyze
4. Try refreshing the page and re-analyzing

---

### Issue 4: Content Script Issues

**Symptoms**:
- "Unable to analyze CSP" error
- DOM analysis not working

**Solutions**:
1. Refresh the target webpage
2. Ensure content script injection is allowed (not on `chrome://` pages)
3. Check extension permissions in manifest.json
4. Reload extension

---

### Issue 5: Backend Sync Failing

**Symptoms**:
- "Test Connection" fails
- Findings not appearing in backend

**Solutions**:
1. Verify backend is running: `curl http://localhost:4000/api/health`
2. Check JWT token is valid (login again if needed)
3. Verify CORS is configured correctly in backend
4. Check backend logs for errors
5. Ensure `extension_findings` table exists (run migrations)

---

## Code Quality Checks

### Syntax Validation

```bash
cd browser-extension

# JavaScript syntax check (all files)
find . -name "*.js" -not -path "./node_modules/*" -exec node -c {} \;

# JSON validation
python3 -m json.tool manifest.json > /dev/null
```

### Line Count Statistics

```bash
wc -l popup/popup.js        # 400 lines
wc -l js/background.js      # 200 lines
wc -l js/content.js         # 127 lines
wc -l js/owasp-mapper.js    # 329 lines
wc -l js/openphish-service.js # 185 lines
wc -l settings/settings.js  # 130 lines
# Total: 1371 lines
```

---

## Security Considerations

### Extension Permissions

The extension requests these permissions (see manifest.json):
- `activeTab` - Access current tab (minimal scope)
- `cookies` - Read cookies for analysis (read-only)
- `storage` - Store settings and findings locally
- `webRequest` - Intercept headers (for CSP analysis)
- `notifications` - Show security alerts
- `downloads` - Export reports
- `<all_urls>` - Analyze any website

### Privacy Guarantees

✅ **No Tracking**: Extension does not track browsing history
✅ **Local-First**: Findings stored locally by default
✅ **Opt-in Sync**: Backend sync disabled by default
✅ **No Analytics**: No third-party analytics or telemetry
✅ **User Control**: User decides what data to send

---

## Success Criteria

The extension is production-ready when:

- ✅ All 12 feature tests pass
- ✅ No JavaScript syntax errors
- ✅ Manifest V3 compliant
- ✅ All referenced files exist
- ✅ Backend integration working
- ✅ OpenPhish integration working
- ✅ OWASP mapping functional
- ✅ Settings persistence working
- ✅ Export functionality working
- ✅ Error handling graceful
- ✅ Performance acceptable (< 2s analysis)
- ✅ Memory usage reasonable (< 50 MB)

---

## Next Steps

After successful testing:

1. ✅ Document any bugs found
2. ✅ Update CURRENT_STATUS.md
3. ✅ Create user tutorial video (optional)
4. ✅ Submit to Chrome Web Store (optional)
5. ✅ Add Firefox support (Manifest V2 port)

---

**Version**: 1.0.0
**Last Updated**: 2024-11-20
**Status**: Feature Complete, Ready for Testing
