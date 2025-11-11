const express = require('express');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create a new report
router.post('/', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { report_type, title, description, severity, findings } = req.body;

  if (!report_type || !title) {
    return res.status(400).json({ error: 'report_type and title are required' });
  }

  db.run(
    `INSERT INTO reports (user_id, report_type, title, description, severity, findings)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, report_type, title, description, severity, JSON.stringify(findings)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create report' });
      }
      res.status(201).json({
        message: 'Report created successfully',
        id: this.lastID
      });
    }
  );
});

// Get all reports for user
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.userId;

  db.all(
    'SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, reports) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch reports' });
      }
      
      // Parse findings JSON
      const parsedReports = reports.map(report => ({
        ...report,
        findings: report.findings ? JSON.parse(report.findings) : null
      }));
      
      res.json({ reports: parsedReports });
    }
  );
});

// Get specific report
router.get('/:id', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  db.get(
    'SELECT * FROM reports WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, report) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch report' });
      }
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      res.json({
        report: {
          ...report,
          findings: report.findings ? JSON.parse(report.findings) : null
        }
      });
    }
  );
});

// Save extension finding
router.post('/extension-finding', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { url, finding_type, details, risk_level } = req.body;

  if (!url || !finding_type) {
    return res.status(400).json({ error: 'url and finding_type are required' });
  }

  db.run(
    `INSERT INTO extension_findings (user_id, url, finding_type, details, risk_level)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, url, finding_type, JSON.stringify(details), risk_level],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save finding' });
      }
      res.status(201).json({
        message: 'Finding saved successfully',
        id: this.lastID
      });
    }
  );
});

// Get extension findings
router.get('/extension-findings', authMiddleware, (req, res) => {
  const userId = req.user.userId;

  db.all(
    'SELECT * FROM extension_findings WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
    [userId],
    (err, findings) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch findings' });
      }
      
      const parsedFindings = findings.map(finding => ({
        ...finding,
        details: finding.details ? JSON.parse(finding.details) : null
      }));
      
      res.json({ findings: parsedFindings });
    }
  );
});

module.exports = router;
