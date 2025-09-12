const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get all users (for team member selection)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE is_active = true
      ORDER BY name ASC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: {
        users: result.rows
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Search users by email
router.get('/search', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter required'
      });
    }

    const query = `
      SELECT id, name, email, role
      FROM users
      WHERE email ILIKE $1 AND is_active = true
      LIMIT 10
    `;

    const result = await db.query(query, [`%${email}%`]);

    res.json({
      success: true,
      data: {
        users: result.rows
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

module.exports = router;