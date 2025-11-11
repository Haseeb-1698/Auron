const express = require('express');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all labs
router.get('/', (req, res) => {
  db.all('SELECT * FROM labs ORDER BY difficulty, name', (err, labs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch labs' });
    }
    res.json({ labs });
  });
});

// Get specific lab
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM labs WHERE id = ?', [id], (err, lab) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch lab' });
    }
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }
    res.json({ lab });
  });
});

// Initialize default labs (admin only - simplified for demo)
router.post('/initialize', (req, res) => {
  const defaultLabs = [
    {
      id: 'dvwa',
      name: 'DVWA - Damn Vulnerable Web Application',
      description: 'Practice common web vulnerabilities including SQL injection, XSS, CSRF, and more',
      difficulty: 'beginner',
      category: 'web',
      docker_service: 'dvwa'
    },
    {
      id: 'juiceshop',
      name: 'OWASP Juice Shop',
      description: 'Modern vulnerable web application with multiple security challenges',
      difficulty: 'intermediate',
      category: 'web',
      docker_service: 'juiceshop'
    },
    {
      id: 'wazuh',
      name: 'Wazuh Security Monitoring',
      description: 'Learn security monitoring, log analysis, and threat detection',
      difficulty: 'advanced',
      category: 'defense',
      docker_service: 'wazuh'
    },
    {
      id: 'metasploitable',
      name: 'Metasploitable',
      description: 'Practice penetration testing and vulnerability exploitation',
      difficulty: 'advanced',
      category: 'penetration-testing',
      docker_service: 'metasploitable'
    }
  ];

  let completed = 0;
  defaultLabs.forEach(lab => {
    db.run(
      `INSERT OR REPLACE INTO labs (id, name, description, difficulty, category, docker_service)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [lab.id, lab.name, lab.description, lab.difficulty, lab.category, lab.docker_service],
      (err) => {
        completed++;
        if (completed === defaultLabs.length) {
          res.json({ message: 'Labs initialized successfully', count: defaultLabs.length });
        }
      }
    );
  });
});

module.exports = router;
