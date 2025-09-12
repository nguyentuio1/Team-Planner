require('dotenv').config();
const db = require('../config/database');

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'general' CHECK (role IN ('frontend', 'backend', 'design', 'marketing', 'general')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  // Projects table
  `CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{"allowMemberTaskEdit": true, "allowMemberTaskCreate": false, "allowMemberInvite": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  // Project members (many-to-many relationship)
  `CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
  );`,

  // Tasks table
  `CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    estimate VARCHAR(100),
    tags TEXT[],
    milestone_id UUID,
    time_spent INTEGER DEFAULT 0,
    success_metrics JSONB,
    styling JSONB,
    rich_content JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  // Invitations table
  `CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  // Milestones table
  `CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  // Add foreign key constraint for milestone_id in tasks
  `ALTER TABLE tasks ADD CONSTRAINT fk_tasks_milestone 
   FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL;`,

  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);`,
  `CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(invitee_email);`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_project ON invitations(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);`,

  // Updated_at trigger function
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ language 'plpgsql';`,

  // Triggers for updated_at
  `DROP TRIGGER IF EXISTS update_users_updated_at ON users;
   CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,

  `DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
   CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,

  `DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
   CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
];

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    for (let i = 0; i < migrations.length; i++) {
      console.log(`⏳ Running migration ${i + 1}/${migrations.length}`);
      await db.query(migrations[i]);
    }
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };