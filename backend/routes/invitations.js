const express = require('express');
const Joi = require('joi');
const nodemailer = require('nodemailer');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Email configuration
const createEmailTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // For development, we'll just log emails
    return {
      sendMail: async (options) => {
        console.log('📧 Email would be sent:');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('HTML:', options.html);
        return { messageId: 'dev-email-' + Date.now() };
      }
    };
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Validation schemas
const createInvitationSchema = Joi.object({
  email: Joi.string().email().required(),
  projectId: Joi.string().uuid().required()
});

// Send invitation
router.post('/', async (req, res) => {
  try {
    const { error, value } = createInvitationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { email, projectId } = value;

    // Check if user has permission to invite
    const projectQuery = `
      SELECT p.id, p.title, p.owner_id, p.settings, pm.user_id as is_member
      FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
      WHERE p.id = $1
    `;
    
    const projectResult = await db.query(projectQuery, [projectId, req.user.id]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];
    const isOwner = project.owner_id === req.user.id;
    const isMember = project.is_member !== null;
    const canInvite = isOwner || (isMember && project.settings?.allowMemberInvite);

    if (!canInvite) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to invite members'
      });
    }

    // Check if user is already a member
    const existingMemberQuery = `
      SELECT pm.id FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1 AND u.email = $2
    `;
    
    const existingMember = await db.query(existingMemberQuery, [projectId, email.toLowerCase()]);
    
    if (existingMember.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Check for existing pending invitation
    const existingInvitationQuery = `
      SELECT id FROM invitations 
      WHERE project_id = $1 AND invitee_email = $2 AND status = 'pending' AND expires_at > NOW()
    `;
    
    const existingInvitation = await db.query(existingInvitationQuery, [projectId, email.toLowerCase()]);
    
    if (existingInvitation.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Invitation already sent to this email'
      });
    }

    // Create invitation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const insertInvitationQuery = `
      INSERT INTO invitations (project_id, inviter_id, invitee_email, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, project_id, inviter_id, invitee_email, status, expires_at, created_at
    `;

    const invitationResult = await db.query(insertInvitationQuery, [
      projectId,
      req.user.id,
      email.toLowerCase(),
      expiresAt
    ]);

    const invitation = invitationResult.rows[0];

    // Send invitation email
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}?invite=${invitation.id}`;
    const transporter = createEmailTransporter();

    const emailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@teamplanner.com',
      to: email,
      subject: `Invitation to join "${project.title}" project`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">You're invited to join a team project!</h2>
          
          <p>Hi there,</p>
          
          <p><strong>${req.user.name}</strong> has invited you to join the project "<strong>${project.title}</strong>" on Team Planner.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${inviteLink}
          </p>
          
          <p style="color: #6b7280; font-size: 14px;">
            This invitation will expire on ${expiresAt.toLocaleDateString()}. 
            If you don't have an account, you'll be able to create one when you accept the invitation.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent by Team Planner. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(emailOptions);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitation: {
          id: invitation.id,
          projectId: invitation.project_id,
          email: invitation.invitee_email,
          status: invitation.status,
          expiresAt: invitation.expires_at,
          inviteLink: inviteLink,
          createdAt: invitation.created_at
        }
      }
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation'
    });
  }
});

// Get invitations for current user
router.get('/received', async (req, res) => {
  try {
    const query = `
      SELECT 
        i.id,
        i.project_id,
        i.status,
        i.expires_at,
        i.created_at,
        p.title as project_title,
        p.description as project_description,
        u.name as inviter_name,
        u.email as inviter_email
      FROM invitations i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.id = i.inviter_id
      WHERE i.invitee_email = $1 AND i.status = 'pending' AND i.expires_at > NOW()
      ORDER BY i.created_at DESC
    `;

    const result = await db.query(query, [req.user.email]);

    res.json({
      success: true,
      data: {
        invitations: result.rows
      }
    });

  } catch (error) {
    console.error('Get received invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitations'
    });
  }
});

// Get invitation details (public endpoint for invitation acceptance)
router.get('/:id', async (req, res) => {
  try {
    const invitationId = req.params.id;

    const query = `
      SELECT 
        i.id,
        i.project_id,
        i.invitee_email,
        i.status,
        i.expires_at,
        i.created_at,
        p.title as project_title,
        p.description as project_description,
        u.name as inviter_name,
        u.email as inviter_email
      FROM invitations i
      JOIN projects p ON p.id = i.project_id
      JOIN users u ON u.id = i.inviter_id
      WHERE i.id = $1
    `;

    const result = await db.query(query, [invitationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    const invitation = result.rows[0];

    // Check if expired
    if (new Date(invitation.expires_at) <= new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // Check if already processed
    if (invitation.status !== 'pending') {
      return res.status(410).json({
        success: false,
        message: `Invitation has already been ${invitation.status}`
      });
    }

    res.json({
      success: true,
      data: {
        invitation
      }
    });

  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitation'
    });
  }
});

// Accept invitation
router.post('/:id/accept', async (req, res) => {
  try {
    const invitationId = req.params.id;

    // Get invitation details
    const invitationQuery = `
      SELECT i.*, p.title as project_title
      FROM invitations i
      JOIN projects p ON p.id = i.project_id
      WHERE i.id = $1 AND i.status = 'pending' AND i.expires_at > NOW()
    `;

    const invitationResult = await db.query(invitationQuery, [invitationId]);

    if (invitationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found, expired, or already processed'
      });
    }

    const invitation = invitationResult.rows[0];

    // Verify email matches current user
    if (invitation.invitee_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'This invitation is not for your email address'
      });
    }

    // Check if already a member
    const memberCheckQuery = 'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2';
    const memberCheck = await db.query(memberCheckQuery, [invitation.project_id, req.user.id]);

    if (memberCheck.rows.length > 0) {
      // Update invitation status but don't add again
      await db.query('UPDATE invitations SET status = $1, accepted_at = NOW() WHERE id = $2', 
        ['accepted', invitationId]);
      
      return res.json({
        success: true,
        message: 'You are already a member of this project'
      });
    }

    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Add user to project
      await client.query(
        'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)',
        [invitation.project_id, req.user.id]
      );

      // Update invitation status
      await client.query(
        'UPDATE invitations SET status = $1, accepted_at = NOW() WHERE id = $2',
        ['accepted', invitationId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Successfully joined "${invitation.project_title}" project!`,
        data: {
          projectId: invitation.project_id
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation'
    });
  }
});

// Reject invitation
router.post('/:id/reject', async (req, res) => {
  try {
    const invitationId = req.params.id;

    const updateQuery = `
      UPDATE invitations 
      SET status = 'rejected' 
      WHERE id = $1 AND invitee_email = $2 AND status = 'pending'
      RETURNING id
    `;

    const result = await db.query(updateQuery, [invitationId, req.user.email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already processed'
      });
    }

    res.json({
      success: true,
      message: 'Invitation rejected successfully'
    });

  } catch (error) {
    console.error('Reject invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject invitation'
    });
  }
});

module.exports = router;