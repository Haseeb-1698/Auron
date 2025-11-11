const express = require('express');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user progress
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.userId;

  db.all(
    'SELECT * FROM user_progress WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, progress) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch progress' });
      }
      res.json({ progress });
    }
  );
});

// Get progress for specific lab
router.get('/lab/:labId', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { labId } = req.params;

  db.all(
    'SELECT * FROM user_progress WHERE user_id = ? AND lab_id = ?',
    [userId, labId],
    (err, progress) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch lab progress' });
      }
      res.json({ progress });
    }
  );
});

// Update progress
router.post('/', authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { lab_id, module_id, completed, score } = req.body;

  if (!lab_id || !module_id) {
    return res.status(400).json({ error: 'lab_id and module_id are required' });
  }

  const completedAt = completed ? new Date().toISOString() : null;

  db.run(
    `INSERT INTO user_progress (user_id, lab_id, module_id, completed, score, completed_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, lab_id, module_id, completed ? 1 : 0, score || 0, completedAt],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update progress' });
      }
      res.status(201).json({
        message: 'Progress updated successfully',
        id: this.lastID
      });
    }
  );
});

// Get overall statistics
router.get('/stats', authMiddleware, (req, res) => {
  const userId = req.user.userId;

  db.all(
    `SELECT 
      COUNT(*) as total_modules,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_modules,
      AVG(score) as average_score
     FROM user_progress
     WHERE user_id = ?`,
    [userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch statistics' });
      }
      res.json({ stats: stats[0] });
    }
  );
});

module.exports = router;
