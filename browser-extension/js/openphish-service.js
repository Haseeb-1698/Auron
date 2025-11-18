// OpenPhish API Service for phishing detection

class OpenPhishService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hour cache
    this.apiEndpoint = 'https://openphish.com/feed.txt';
    this.localFeed = null;
    this.lastUpdate = null;
  }

  /**
   * Load OpenPhish feed
   * Note: The free feed is a text file with one URL per line
   */
  async loadFeed() {
    // Check if we have a recent cache
    if (this.localFeed && this.lastUpdate && (Date.now() - this.lastUpdate) < this.cacheTimeout) {
      return this.localFeed;
    }

    try {
      const response = await fetch(this.apiEndpoint);
      if (!response.ok) {
        throw new Error(`Failed to load OpenPhish feed: ${response.status}`);
      }

      const text = await response.text();
      this.localFeed = new Set(text.split('\n').map(url => url.trim()).filter(url => url));
      this.lastUpdate = Date.now();

      console.log(`OpenPhish feed loaded: ${this.localFeed.size} phishing URLs`);
      return this.localFeed;
    } catch (error) {
      console.error('Failed to load OpenPhish feed:', error);
      // Return empty set on error, don't break the extension
      return new Set();
    }
  }

  /**
   * Check if a URL is in the OpenPhish database
   * @param {string} url - The URL to check
   * @returns {Promise<{isPhishing: boolean, confidence: string, source: string}>}
   */
  async checkURL(url) {
    try {
      // Check cache first
      if (this.cache.has(url)) {
        const cached = this.cache.get(url);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.result;
        }
      }

      // Load feed if not loaded
      const feed = await this.loadFeed();

      // Normalize URL for comparison
      const normalizedUrl = this.normalizeURL(url);

      // Check for exact match
      let isPhishing = feed.has(normalizedUrl);
      let confidence = 'low';
      let matchType = 'none';

      if (isPhishing) {
        confidence = 'high';
        matchType = 'exact';
      } else {
        // Check for partial matches (domain level)
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        for (const phishUrl of feed) {
          try {
            const phishDomain = new URL(phishUrl).hostname;
            if (phishDomain === domain) {
              isPhishing = true;
              confidence = 'medium';
              matchType = 'domain';
              break;
            }
          } catch (e) {
            // Invalid URL in feed, skip
            continue;
          }
        }
      }

      const result = {
        isPhishing,
        confidence,
        source: 'OpenPhish',
        matchType,
        checkedAt: new Date().toISOString()
      };

      // Cache result
      this.cache.set(url, { result, timestamp: Date.now() });

      // Limit cache size
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return result;
    } catch (error) {
      console.error('OpenPhish check error:', error);
      return {
        isPhishing: false,
        confidence: 'unknown',
        source: 'OpenPhish',
        matchType: 'error',
        error: error.message
      };
    }
  }

  /**
   * Normalize URL for consistent comparison
   * @param {string} url
   * @returns {string}
   */
  normalizeURL(url) {
    try {
      const urlObj = new URL(url);
      // Remove trailing slashes and fragments
      let normalized = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.replace(/\/+$/, '');
      if (urlObj.search) {
        normalized += urlObj.search;
      }
      return normalized.toLowerCase();
    } catch (e) {
      return url.toLowerCase();
    }
  }

  /**
   * Check URL with custom API key (premium feature)
   * @param {string} url
   * @param {string} apiKey
   * @returns {Promise<object>}
   */
  async checkURLWithKey(url, apiKey) {
    // This is a placeholder for premium OpenPhish API
    // The free feed doesn't require an API key
    // If users have a premium API key, they can use the REST API
    try {
      const response = await fetch(`https://api.openphish.com/v1/check?url=${encodeURIComponent(url)}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        return await response.json();
      }

      // Fallback to free feed
      return await this.checkURL(url);
    } catch (error) {
      console.warn('Premium API check failed, using free feed:', error);
      return await this.checkURL(url);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.localFeed = null;
    this.lastUpdate = null;
  }
}

// Create singleton instance
const openPhishService = new OpenPhishService();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OpenPhishService, openPhishService };
}
