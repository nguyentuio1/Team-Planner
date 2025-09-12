# 🚀 Real Backend Setup Guide

Transform your team planner from localStorage to a real PostgreSQL database with authentication, email sending, and proper API architecture!

## ✅ What You Get

- **Real PostgreSQL Database** - No more localStorage limitations
- **JWT Authentication** - Secure token-based auth with password hashing
- **Real Email Invitations** - Actual emails sent to team members
- **Permission System** - Role-based access control
- **Professional API** - RESTful endpoints with validation
- **Production Ready** - Rate limiting, security headers, CORS

## 🛠 Quick Setup (5 minutes)

### Step 1: Install PostgreSQL

**Windows:**
```bash
# Using chocolatey
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

**macOS:**
```bash
# Using homebrew
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE team_planner;
CREATE USER team_user WITH ENCRYPTED PASSWORD 'secure_password123';
GRANT ALL PRIVILEGES ON DATABASE team_planner TO team_user;
\q
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
```

**Edit `.env` file:**
```env
# Database - Update with your credentials
DATABASE_URL=postgresql://team_user:secure_password123@localhost:5432/team_planner

# Security - Generate a secure secret
JWT_SECRET=your-super-secure-jwt-secret-key-change-this

# Server
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173

# Email (optional for development)
EMAIL_FROM=noreply@yourapp.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Step 5: Run Database Migrations

```bash
npm run migrate
```

You should see:
```
✅ All migrations completed successfully!
```

### Step 6: Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3001
🌍 Environment: development
✅ Connected to PostgreSQL database
📊 Health check: http://localhost:3001/health
```

### Step 7: Configure Frontend

```bash
# In the root directory (not backend folder)
cp .env.example .env
```

**Edit `.env` file:**
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_ENABLE_REAL_BACKEND=true
```

### Step 8: Start Frontend

```bash
# In root directory
npm run dev
```

## ✨ Test Real Backend Features

### 1. Test Database Connection
Visit: `http://localhost:3001/health`

Should show:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development"
}
```

### 2. Test Registration
1. Go to your frontend app
2. Click "Sign up" 
3. Create a new account
4. ✅ User is stored in PostgreSQL database

### 3. Test Real Team Invitations
1. Create a project
2. Go to "Invite Members"
3. Enter an email address
4. ✅ Real email sent (check console in development)
5. ✅ Invitation stored in database
6. Use the invitation link to join as team member

### 4. Test Real Data Persistence
1. Create projects and tasks
2. Restart the backend server
3. ✅ All data persists (no more localStorage loss!)

## 🗄️ Database Verification

Connect to your database to see real data:

```bash
psql -U team_user -d team_planner

# View users
SELECT id, name, email, role, created_at FROM users;

# View projects  
SELECT id, title, owner_id, created_at FROM projects;

# View invitations
SELECT id, invitee_email, status, expires_at FROM invitations;

# Exit
\q
```

## 📧 Email Setup (Optional)

For **real email sending** in production:

### Gmail Setup
1. Enable 2-factor authentication
2. Generate app-specific password
3. Update `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Other Email Providers
- **SendGrid**: Set up API key
- **Mailgun**: Configure domain and API
- **AWS SES**: Set up AWS credentials

## 🚀 Production Deployment

### Heroku (Easy)
```bash
heroku create your-team-planner
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret
git push heroku main
heroku run npm run migrate
```

### Railway (Simple)
```bash
railway login
railway new
railway add postgresql
railway up
railway run npm run migrate
```

### Docker (Flexible)
```dockerfile
# Dockerfile already created in backend folder
docker build -t team-planner-backend backend/
docker run -p 3001:3001 team-planner-backend
```

## 🔧 Troubleshooting

### "Connection refused" Error
- ✅ PostgreSQL is running: `pg_ctl status`
- ✅ Database exists: `psql -l`
- ✅ Credentials correct in `.env`

### "Relation does not exist" Error
- ✅ Run migrations: `npm run migrate`
- ✅ Check database permissions

### "JWT Secret" Error
- ✅ Set strong JWT_SECRET in `.env`
- ✅ Restart server after changes

### Email Not Sending
- ✅ Check SMTP credentials
- ✅ Enable "Less secure apps" (Gmail)
- ✅ Check spam folder

## 🎯 Benefits You Get

| Feature | Before (localStorage) | After (Real Backend) |
|---------|----------------------|---------------------|
| **Data Storage** | Browser only, lost on clear | PostgreSQL database, permanent |
| **Authentication** | Fake login | Real JWT with password hashing |
| **Team Invitations** | Mock URLs | Real emails with working links |
| **Multi-device** | Single browser | Works across all devices |
| **Collaboration** | Fake sharing | Real multi-user collaboration |
| **Production Ready** | Demo only | Deploy anywhere |
| **Data Security** | Client-side only | Server-side validation |
| **Scalability** | Single user | Unlimited users |

## 📈 What's Different Now

### Before (localStorage):
```javascript
// Fake data in browser
localStorage.setItem('users', JSON.stringify(users));
```

### After (Real Backend):
```javascript
// Real API calls to PostgreSQL
const user = await apiService.register({
  name, email, password, role
});
```

### Before (Mock Invitations):
```javascript
// Just URLs, no real invitations
const inviteLink = `?invite=${fakeId}`;
```

### After (Real Invitations):
```javascript
// Real emails sent via SMTP
await apiService.sendInvitation(projectId, email);
// Real invitation email delivered to inbox
```

## 🔥 Next Steps

1. **Deploy to Production** - Use Heroku/Railway for instant deployment
2. **Custom Domain** - Set up your own domain name
3. **Advanced Features** - Add file uploads, notifications, analytics
4. **Mobile App** - Use the same API for mobile development
5. **Integrations** - Connect to Slack, GitHub, other tools

---

**🎉 Congratulations!** You now have a production-ready team collaboration platform with real database, authentication, and email integration!