[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/YHSq4TPZ)
# To-Do App – Preliminary Assignment Submission
⚠️ Please complete **all sections marked with the ✍️ icon** — these are required for your submission.

👀 Please Check ASSIGNMENT.md file in this repository for assignment requirements.

## 🚀 Project Setup & Usage
**How to install and run your project:**

**Frontend:**
- `npm install`
- `npm run dev` (for development)
- `npm run build` (for production)

**Backend:**
- `cd backend`
- `npm install`
- `npm run migrate` (setup database)
- `npm start` (production) or `npm run dev` (development)

**Environment Variables:**
- Copy `.env.example` to `.env` and configure your database and API keys

## 🔗 Deployed Web URL or APK file
🌐 **Live App:** https://team-planner-henna.vercel.app


## 🎥 Demo Video
**Demo video link (≤ 2 minutes):**
📌 **Video Upload Guideline:** when uploading your demo video to YouTube, please set the visibility to **Unlisted**.
- "Unlisted" videos can only be viewed by users who have the link.
- The video will not appear in search results or on your channel.
- Share the link in your README so mentors can access it.

✍️ [Paste your video link here]


## 💻 Project Introduction

### a. Overview

**Team Planner** is a collaborative project management application that helps teams organize tasks, track progress, and collaborate effectively. The app features role-based user management, real-time task tracking, team invitations, and AI-powered task management assistance using Google's Gemini AI.

### b. Key Features & Function Manual

**🔐 User Authentication:**
- Secure user registration and login system
- Role-based access (Frontend, Backend, Design, Marketing, General)
- JWT token-based authentication

**📋 Project Management:**
- Create and manage multiple projects
- Project ownership and member management
- Configurable project settings (member permissions)

**✅ Task Management:**
- Create, edit, delete, and complete tasks
- Task status tracking (Pending, In-Progress, Completed)
- Priority levels (Low, Medium, High, Urgent)
- Due date tracking and time estimation
- Task assignment to team members
- Rich task descriptions and tags

**👥 Team Collaboration:**
- Invite team members via email
- Role-based permissions system
- Member management (add/remove members)
- Invitation system with acceptance/rejection

**🤖 AI Integration:**
- Google Gemini AI for intelligent task assignment
- AI-powered task suggestions and optimization
- Smart project planning assistance

### c. Unique Features (What's special about this app?)

**🚀 AI-Powered Task Management:**
- Utilizes Google Gemini AI to intelligently assign tasks based on team member roles and skills
- AI suggestions for task optimization and project planning

**🎨 Modern UI/UX:**
- Clean, intuitive interface built with React and Tailwind CSS
- Responsive design that works on all devices
- Real-time updates and smooth user experience

**⚡ Full-Stack Architecture:**
- Serverless deployment on Vercel for scalability
- PostgreSQL database with Supabase for reliability
- RESTful API architecture with comprehensive error handling

**🔒 Enterprise-Ready Security:**
- JWT authentication with secure token management
- Role-based access control
- Data validation and sanitization
- CORS and helmet security middleware

### d. Technology Stack and Implementation Methods

**Frontend:**
- **React 19** with TypeScript for type-safe development
- **Vite** for fast development and building
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons

**Backend:**
- **Node.js** with Express.js framework
- **PostgreSQL** database with raw SQL queries
- **JWT** for authentication
- **bcrypt** for password hashing
- **Joi** for data validation
- **Helmet** and CORS for security

**AI Integration:**
- **Google Generative AI (Gemini)** for intelligent features

**Deployment & Infrastructure:**
- **Vercel** for frontend and serverless functions
- **Supabase** for PostgreSQL database hosting
- **Environment-based configuration** for different stages

### e. Service Architecture & Database structure (when used)

**Architecture:**
```
Frontend (React) → API Gateway → Backend Services → Database
                ↓
            Vercel Serverless Functions
                ↓
            Supabase PostgreSQL
```

**Database Schema:**
- **Users Table:** Store user profiles, roles, and authentication data
- **Projects Table:** Project information with owner relationships
- **Project_Members Table:** Many-to-many relationship between users and projects
- **Tasks Table:** Task details with assignee, status, priority, and metadata
- **Invitations Table:** Email invitations with status tracking
- **Milestones Table:** Project milestone tracking

**Key Relationships:**
- Users can own multiple projects
- Users can be members of multiple projects
- Tasks belong to projects and can be assigned to users
- Invitations link projects to potential members

## 🧠 Reflection

### a. If you had more time, what would you expand?

**Enhanced AI Features:**
- AI-powered project timeline generation
- Intelligent task priority suggestions based on deadlines
- Natural language task creation ("Create a task to fix the login bug")
- Automated progress reporting and insights

**Real-time Collaboration:**
- WebSocket integration for live updates
- Real-time chat within projects
- Live cursor tracking for collaborative editing
- Push notifications for task updates

**Advanced Analytics:**
- Team productivity dashboards
- Time tracking and reporting
- Project velocity metrics
- Performance analytics and insights

**Mobile Application:**
- React Native mobile app
- Offline capabilities
- Push notifications
- Mobile-optimized task management

### b. If you integrate AI APIs more for your app, what would you do?

**Multi-AI Integration:**
- **OpenAI GPT** for natural language task descriptions and smart search
- **Claude AI** for code review tasks and technical documentation
- **Google Gemini Vision** for processing uploaded images and documents
- **Azure Cognitive Services** for sentiment analysis of team feedback

**Advanced AI Features:**
- **Smart Scheduling:** AI that considers team availability, task dependencies, and project deadlines
- **Risk Prediction:** AI analysis to predict project delays and suggest mitigation strategies
- **Automated Testing:** AI-generated test cases for development tasks
- **Code Review Assistant:** AI that reviews code changes and suggests improvements
- **Meeting Summarization:** AI that processes meeting recordings and creates actionable tasks
- **Resource Optimization:** AI that analyzes team workload and suggests optimal task distribution


## ✅ Checklist
- [x] Code runs without errors
- [x] All required features implemented (add/edit/delete/complete tasks)
- [x] All ✍️ sections are filled