const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function viewDatabase() {
  try {
    console.log('🗄️ TEAM PLANNER DATABASE VIEWER\n');
    
    // Show all tables
    console.log('📋 TABLES:');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    for (let table of tables.rows) {
      console.log(`  - ${table.table_name}`);
    }
    
    // Show users
    console.log('\n👥 USERS:');
    const users = await pool.query('SELECT id, name, email, role FROM users');
    console.table(users.rows);
    
    // Show projects
    console.log('\n📂 PROJECTS:');
    const projects = await pool.query('SELECT id, title, description, owner_id FROM projects');
    console.table(projects.rows);
    
    // Show tasks
    console.log('\n📝 TASKS:');
    const tasks = await pool.query(`
      SELECT id, title, status, priority, assignee_id, project_id, created_at 
      FROM tasks 
      ORDER BY created_at DESC
    `);
    console.table(tasks.rows);
    
    // Show project members
    console.log('\n👥 PROJECT MEMBERS:');
    const members = await pool.query(`
      SELECT pm.*, u.name as user_name, p.title as project_title
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      JOIN projects p ON pm.project_id = p.id
    `);
    console.table(members.rows);
    
  } catch (error) {
    console.error('❌ Error viewing database:', error.message);
  } finally {
    await pool.end();
  }
}

viewDatabase();