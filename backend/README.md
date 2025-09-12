# Team Planner Backend

Real backend API with PostgreSQL database and JWT authentication.

## Features

- ✅ **Real Database**: PostgreSQL with proper schema and relationships
- ✅ **JWT Authentication**: Secure token-based auth with bcrypt password hashing
- ✅ **Real Email**: Nodemailer integration for invitation emails
- ✅ **Permission System**: Role-based access control for projects and tasks
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **Input Validation**: Joi schemas for all endpoints
- ✅ **Database Migrations**: Automated schema setup
- ✅ **CORS Support**: Configured for frontend integration

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

Install PostgreSQL and create a database:

```sql
CREATE DATABASE team_planner;
CREATE USER team_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE team_planner TO team_user;
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL=postgresql://team_user:your_password@localhost:5432/team_planner
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3001
NODE_ENV=development

# Email settings (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. Run Migrations

```bash
npm run migrate
```

### 5. Start Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

### Projects
- `GET /api/projects` - Get user's projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/tasks/project/:projectId` - Get project tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Invitations
- `POST /api/invitations` - Send invitation
- `GET /api/invitations/received` - Get user's invitations
- `GET /api/invitations/:id` - Get invitation details (public)
- `POST /api/invitations/:id/accept` - Accept invitation
- `POST /api/invitations/:id/reject` - Reject invitation

### Users
- `GET /api/users` - Get all users
- `GET /api/users/search?email=...` - Search users by email

## Database Schema

### Tables
- `users` - User accounts with bcrypt passwords
- `projects` - Project information and settings
- `project_members` - Many-to-many project membership
- `tasks` - Tasks with full feature support
- `invitations` - Email-based project invitations
- `milestones` - Task grouping and deadlines

### Key Features
- UUID primary keys
- Automatic timestamps with triggers
- JSON fields for complex data
- Foreign key constraints with CASCADE
- Performance indexes

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- SQL injection protection via parameterized queries

## Email Integration

The system sends real emails for invitations:

- **Development**: Logs email content to console
- **Production**: Uses SMTP configuration

Example invitation email includes:
- Project name and inviter information
- Secure invitation link
- Expiration date
- Professional HTML formatting

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret for JWT signing | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `EMAIL_FROM` | From email address | noreply@teamplanner.com |
| `SMTP_HOST` | SMTP server host | smtp.gmail.com |
| `SMTP_USER` | SMTP username | Required for email |
| `SMTP_PASS` | SMTP password | Required for email |

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Heroku Deployment

```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret
git push heroku main
heroku run npm run migrate
```

### Railway Deployment

```bash
# Install Railway CLI
railway login
railway new
railway add postgresql
railway up
railway run npm run migrate
```

## Testing

Health check endpoint:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development"
}
```

## Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure database exists
4. Check firewall settings

### Migration Failures
1. Ensure database user has proper permissions
2. Check if tables already exist
3. Review migration logs for specific errors

### Authentication Issues
1. Verify JWT_SECRET is set
2. Check token expiration settings
3. Ensure bcrypt is working properly

### Email Issues
1. Verify SMTP credentials
2. Check if less secure apps are enabled (Gmail)
3. Use app-specific passwords for Gmail
4. Check spam folder for test emails