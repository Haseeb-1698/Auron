#!/usr/bin/env node

/**
 * Example script to interact with Auron Backend API
 * Demonstrates authentication and basic API usage
 */

const API_BASE_URL = process.env.AURON_API_URL || 'http://localhost:4000/api';

// Simple fetch wrapper for Node.js < 18 compatibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class AuronClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  async register(username, email, password) {
    console.log('Registering user...');
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Registration failed: ${error.error}`);
    }

    const data = await response.json();
    this.token = data.token;
    console.log('✓ Registration successful');
    return data;
  }

  async login(username, password) {
    console.log('Logging in...');
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Login failed: ${error.error}`);
    }

    const data = await response.json();
    this.token = data.token;
    console.log('✓ Login successful');
    return data;
  }

  async updateProgress(labId, moduleId, completed = true, score = 100) {
    console.log(`Updating progress for ${labId}/${moduleId}...`);
    const response = await fetch(`${this.baseUrl}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ lab_id: labId, module_id: moduleId, completed, score })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Update failed: ${error.error}`);
    }

    const data = await response.json();
    console.log('✓ Progress updated');
    return data;
  }

  async getProgress() {
    console.log('Fetching progress...');
    const response = await fetch(`${this.baseUrl}/progress`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Fetch failed: ${error.error}`);
    }

    const data = await response.json();
    console.log('✓ Progress fetched');
    return data;
  }

  async getStats() {
    console.log('Fetching statistics...');
    const response = await fetch(`${this.baseUrl}/progress/stats`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Fetch failed: ${error.error}`);
    }

    const data = await response.json();
    console.log('✓ Statistics fetched');
    return data;
  }

  async createReport(reportData) {
    console.log('Creating report...');
    const response = await fetch(`${this.baseUrl}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Report creation failed: ${error.error}`);
    }

    const data = await response.json();
    console.log('✓ Report created');
    return data;
  }

  async getLabs() {
    console.log('Fetching labs...');
    const response = await fetch(`${this.baseUrl}/labs`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Fetch failed: ${error.error}`);
    }

    const data = await response.json();
    console.log('✓ Labs fetched');
    return data;
  }
}

// Example usage
async function main() {
  console.log('========================================');
  console.log('   Auron API Example');
  console.log('========================================\n');

  const client = new AuronClient();

  try {
    // Register a new user (or login if already exists)
    const username = 'demo_user';
    const email = 'demo@example.com';
    const password = 'Demo123456!';

    try {
      await client.register(username, email, password);
    } catch (error) {
      console.log('User already exists, logging in instead...');
      await client.login(username, password);
    }

    console.log('\n--- Fetching Available Labs ---');
    const labs = await client.getLabs();
    console.log(`Found ${labs.labs.length} labs`);
    labs.labs.forEach(lab => {
      console.log(`  - ${lab.name} (${lab.difficulty})`);
    });

    console.log('\n--- Updating Progress ---');
    await client.updateProgress('dvwa', 'sql-injection-1', true, 100);
    await client.updateProgress('dvwa', 'xss-reflected-1', true, 85);
    await client.updateProgress('juiceshop', 'login-admin', true, 100);

    console.log('\n--- Viewing Progress ---');
    const progress = await client.getProgress();
    console.log(`Total modules attempted: ${progress.progress.length}`);

    console.log('\n--- Statistics ---');
    const stats = await client.getStats();
    console.log(`Total modules: ${stats.stats.total_modules}`);
    console.log(`Completed modules: ${stats.stats.completed_modules}`);
    console.log(`Average score: ${stats.stats.average_score?.toFixed(2) || 0}`);

    console.log('\n--- Creating Report ---');
    await client.createReport({
      report_type: 'vulnerability',
      title: 'SQL Injection in DVWA Login',
      description: 'Found SQL injection vulnerability in login form',
      severity: 'high',
      findings: {
        url: 'http://localhost:8080/login.php',
        parameter: 'username',
        payload: "' OR '1'='1",
        impact: 'Authentication bypass'
      }
    });

    console.log('\n========================================');
    console.log('   Example completed successfully!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = AuronClient;
