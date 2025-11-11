// Content script for Auron Security Analyzer
// Injected into all pages to perform analysis

(function() {
  'use strict';

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCSP') {
      const csp = getCSPHeader();
      sendResponse({ csp });
    }
    
    if (request.action === 'analyzeDOM') {
      const analysis = analyzeDOM();
      sendResponse({ analysis });
    }
  });

  // Get CSP from meta tag or response headers
  function getCSPHeader() {
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (metaCSP) {
      return metaCSP.getAttribute('content');
    }
    
    // CSP from response headers will be captured by background script
    return null;
  }

  // Analyze DOM for security issues
  function analyzeDOM() {
    const issues = [];
    
    // Check for inline scripts
    const inlineScripts = document.querySelectorAll('script:not([src])');
    if (inlineScripts.length > 0) {
      issues.push({
        type: 'inline-script',
        severity: 'medium',
        count: inlineScripts.length,
        message: `Found ${inlineScripts.length} inline script(s)`
      });
    }
    
    // Check for inline event handlers
    const elementsWithEvents = document.querySelectorAll('[onclick], [onload], [onerror], [onmouseover]');
    if (elementsWithEvents.length > 0) {
      issues.push({
        type: 'inline-event',
        severity: 'medium',
        count: elementsWithEvents.length,
        message: `Found ${elementsWithEvents.length} inline event handler(s)`
      });
    }
    
    // Check for forms without CSRF protection
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
      const hasCSRFToken = form.querySelector('input[name*="csrf"], input[name*="token"]');
      if (!hasCSRFToken && form.method.toLowerCase() === 'post') {
        issues.push({
          type: 'csrf',
          severity: 'high',
          message: `Form #${index + 1} may lack CSRF protection`
        });
      }
    });
    
    // Check for password fields without autocomplete="off"
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach((field, index) => {
      if (!field.hasAttribute('autocomplete') || field.getAttribute('autocomplete') !== 'off') {
        issues.push({
          type: 'password-autocomplete',
          severity: 'low',
          message: `Password field #${index + 1} allows autocomplete`
        });
      }
    });
    
    // Check for mixed content
    const httpResources = document.querySelectorAll('img[src^="http://"], script[src^="http://"], link[href^="http://"]');
    if (httpResources.length > 0 && window.location.protocol === 'https:') {
      issues.push({
        type: 'mixed-content',
        severity: 'high',
        count: httpResources.length,
        message: `Found ${httpResources.length} HTTP resource(s) on HTTPS page`
      });
    }
    
    return {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      issues
    };
  }

  // Automatically report findings to background script
  function reportFindings() {
    const analysis = analyzeDOM();
    
    if (analysis.issues.length > 0) {
      chrome.runtime.sendMessage({
        action: 'reportFinding',
        data: {
          url: analysis.url,
          finding_type: 'dom-analysis',
          details: analysis,
          risk_level: analysis.issues.some(i => i.severity === 'high') ? 'high' : 'medium'
        }
      });
    }
  }

  // Run analysis when page is fully loaded
  if (document.readyState === 'complete') {
    setTimeout(reportFindings, 1000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(reportFindings, 1000);
    });
  }

  console.log('Auron Security Analyzer content script loaded');
})();
