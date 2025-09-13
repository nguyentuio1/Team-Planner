const express = require('express');
const Joi = require('joi');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Validation schemas
const createTaskSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(2000).allow(''),
  status: Joi.string().valid('pending', 'in-progress', 'completed').default('pending'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  assigneeId: Joi.string().uuid().allow(null),
  dueDate: Joi.date().iso().allow(null),
  estimate: Joi.string().max(100).allow(''),
  tags: Joi.array().items(Joi.string()).default([]),
  milestoneId: Joi.string().uuid().allow(null)
});

// Get tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Check access to project
    const accessQuery = `
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
    `;
    
    const access = await db.query(accessQuery, [projectId, req.user.id]);
    
    if (access.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to project'
      });
    }

    const query = `
      SELECT 
        t.*,
        u.name as assignee_name,
        u.email as assignee_email,
        u.role as assignee_role
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assignee_id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `;

    const result = await db.query(query, [projectId]);

    res.json({
      success: true,
      data: {
        tasks: result.rows
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details[0].message
      });
    }

    const { projectId, title, description, status, priority, assigneeId, dueDate, estimate, tags, milestoneId } = value;

    // Check permissions
    const permissionQuery = `
      SELECT p.owner_id, p.settings, pm.user_id as is_member
      FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
      WHERE p.id = $1
    `;
    
    const permissionResult = await db.query(permissionQuery, [projectId, req.user.id]);
    
    if (permissionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = permissionResult.rows[0];
    const isOwner = project.owner_id === req.user.id;
    const isMember = project.is_member !== null;
    const canCreate = isOwner || (isMember && project.settings?.allowMemberTaskCreate);

    if (!canCreate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create tasks in this project'
      });
    }

    // Create task
    const insertQuery = `
      INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date, estimate, tags, milestone_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      projectId, title, description, status, priority, assigneeId, dueDate, estimate, tags, milestoneId
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;

    // Get task and check permissions
    const taskQuery = `
      SELECT t.*, p.owner_id, p.settings, pm.user_id as is_member
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
      WHERE t.id = $1
    `;

    const taskResult = await db.query(taskQuery, [taskId, req.user.id]);

    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const task = taskResult.rows[0];
    const isOwner = task.owner_id === req.user.id;
    const isAssignee = task.assignee_id === req.user.id;
    const isMember = task.is_member !== null;
    const canEdit = isOwner || isAssignee || (isMember && task.settings?.allowMemberTaskEdit);

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this task'
      });
    }

    // Build dynamic update - exclude problematic array fields for TaskBoard dropdown updates
    const allowedFields = ['title', 'description', 'status', 'priority', 'assignee_id', 'due_date', 'estimate', 'milestone_id', 'time_spent', 'styling'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    

    for (const field of allowedFields) {
      const snakeField = field;
      const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      if (req.body[camelField] !== undefined || req.body[snakeField] !== undefined) {
        const value = req.body[camelField] !== undefined ? req.body[camelField] : req.body[snakeField];
        
        updateFields.push(`${snakeField} = $${paramCount}`);
        
        if (snakeField === 'assignee_id') {
          values.push(value === '' || value === undefined ? null : value);
        } else if (snakeField === 'styling') {
          values.push(value ? JSON.stringify(value) : null);
        } else {
          values.push(value ?? null);
        }
        
        paramCount++;        
      }
    }

    if (req.body.status === 'completed' && task.status !== 'completed') {
      updateFields.push(`completed_at = NOW()`);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(taskId);

    const updateQuery = `
      UPDATE tasks 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;

    // Check if user is project owner
    const ownerQuery = `
      SELECT t.id FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = $1 AND p.owner_id = $2
    `;

    const ownerCheck = await db.query(ownerQuery, [taskId, req.user.id]);

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete tasks'
      });
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

module.exports = router;