const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('frontend', 'backend', 'design', 'marketing', 'general').default('general')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { name, email, password, role } = value;

    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await db.query(existingUserQuery, [email.toLowerCase()]);
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const insertUserQuery = `
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, role, created_at
    `;
    
    const newUser = await db.query(insertUserQuery, [
      name,
      email.toLowerCase(),
      passwordHash,
      role
    ]);

    const user = newUser.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { email, password } = value;

    // Find user
    const userQuery = 'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1';
    const userResult = await db.query(userQuery, [email.toLowerCase()]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current user profile
router.get('/profile', require('../middleware/auth').authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

module.exports = router;