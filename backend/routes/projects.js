const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createProjectSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).allow(''),
  settings: Joi.object({
    allowMemberTaskEdit: Joi.boolean().default(true),
    allowMemberTaskCreate: Joi.boolean().default(false),
    allowMemberInvite: Joi.boolean().default(false)
  }).default({})
});

const updateProjectSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  description: Joi.string().max(1000).allow(''),
  settings: Joi.object({
    allowMemberTaskEdit: Joi.boolean(),
    allowMemberTaskCreate: Joi.boolean(),
    allowMemberInvite: Joi.boolean()
  })
});

// Get all projects for authenticated user
router.get('/', async (req, res) => {
  try {
    // First get the basic project info
    const projectQuery = `
      SELECT DISTINCT 
        p.id,
        p.title,
        p.description,
        p.owner_id,
        p.settings,
        p.created_at,
        p.updated_at,
        u.name as owner_name,
        u.email as owner_email
      FROM projects p
      LEFT JOIN users u ON u.id = p.owner_id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.owner_id = $1 OR pm.user_id = $1
      ORDER BY p.updated_at DESC
    `;

    const projectResult = await db.query(projectQuery, [req.user.id]);
    
    // For each project, get members and task count
    const projects = await Promise.all(
      projectResult.rows.map(async (project) => {
        // Get members
        const membersQuery = `
          SELECT ARRAY_AGG(pm.user_id) as members
          FROM project_members pm
          WHERE pm.project_id = $1
        `;
        const membersResult = await db.query(membersQuery, [project.id]);
        
        // Get task count
        const taskCountQuery = `
          SELECT COUNT(*)::int as task_count
          FROM tasks t
          WHERE t.project_id = $1
        `;
        const taskCountResult = await db.query(taskCountQuery, [project.id]);
        
        return {
          ...project,
          members: membersResult.rows[0]?.members || [],
          task_count: taskCountResult.rows[0]?.task_count || 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        projects
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;

    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.owner_id,
        p.settings,
        p.created_at,
        p.updated_at,
        u.name as owner_name,
        u.email as owner_email,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', all_members.id,
              'name', all_members.name,
              'email', all_members.email,
              'role', all_members.role,
              'joinedAt', all_members.joined_at,
              'isOwner', all_members.is_owner
            )
          ), '[]'::json)
          FROM (
            -- Include project owner
            SELECT 
              u.id, u.name, u.email, u.role, 
              p.created_at as joined_at,
              true as is_owner
            FROM users u
            WHERE u.id = p.owner_id
            
            UNION
            
            -- Include project members
            SELECT 
              pm_user.id, pm_user.name, pm_user.email, pm_user.role, 
              pm.joined_at,
              false as is_owner
            FROM project_members pm
            JOIN users pm_user ON pm_user.id = pm.user_id
            WHERE pm.project_id = p.id AND pm_user.id != p.owner_id
          ) as all_members
        ) as members
      FROM projects p
      JOIN users u ON u.id = p.owner_id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
      GROUP BY p.id, u.id
    `;

    const result = await db.query(query, [projectId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or access denied'
      });
    }

    res.json({
      success: true,
      data: {
        project: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { title, description, settings } = value;

    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create project
      const insertProjectQuery = `
        INSERT INTO projects (title, description, owner_id, settings)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, description, owner_id, settings, created_at, updated_at
      `;

      const projectResult = await client.query(insertProjectQuery, [
        title,
        description || '',
        req.user.id,
        JSON.stringify(settings)
      ]);

      const project = projectResult.rows[0];

      // Add owner as project member
      const insertMemberQuery = `
        INSERT INTO project_members (project_id, user_id)
        VALUES ($1, $2)
      `;

      await client.query(insertMemberQuery, [project.id, req.user.id]);

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
          project: {
            ...project,
            owner_name: req.user.name,
            owner_email: req.user.email,
            members: [req.user],
            task_count: 0
          }
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { error, value } = updateProjectSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    // Check if user is owner
    const ownerCheckQuery = 'SELECT id FROM projects WHERE id = $1 AND owner_id = $2';
    const ownerCheck = await db.query(ownerCheckQuery, [projectId, req.user.id]);

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can update project settings'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (value.title !== undefined) {
      updateFields.push(`title = $${paramCount}`);
      values.push(value.title);
      paramCount++;
    }

    if (value.description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(value.description);
      paramCount++;
    }

    if (value.settings !== undefined) {
      updateFields.push(`settings = $${paramCount}`);
      values.push(JSON.stringify(value.settings));
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(projectId);
    
    const updateQuery = `
      UPDATE projects 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, title, description, settings, updated_at
    `;

    const result = await db.query(updateQuery, values);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if user is owner
    const ownerCheckQuery = 'SELECT id FROM projects WHERE id = $1 AND owner_id = $2';
    const ownerCheck = await db.query(ownerCheckQuery, [projectId, req.user.id]);

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete project'
      });
    }

    // Delete project (cascades to members, tasks, etc.)
    const deleteQuery = 'DELETE FROM projects WHERE id = $1';
    await db.query(deleteQuery, [projectId]);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.params.userId;

    // Check if current user is owner
    const ownerCheckQuery = 'SELECT id FROM projects WHERE id = $1 AND owner_id = $2';
    const ownerCheck = await db.query(ownerCheckQuery, [projectId, req.user.id]);

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can remove members'
      });
    }

    // Cannot remove owner
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove project owner'
      });
    }

    // Remove member
    const removeQuery = 'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2';
    const result = await db.query(removeQuery, [projectId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in project'
      });
    }

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
});

module.exports = router;