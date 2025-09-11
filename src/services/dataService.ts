import { v4 as uuidv4 } from 'uuid';
import type { User, Project, Task, Milestone } from '../types';

// Local Storage Keys
const STORAGE_KEYS = {
  PROJECTS: 'ai_planner_projects',
  TASKS: 'ai_planner_tasks',
  MILESTONES: 'ai_planner_milestones',
  USER_SESSIONS: 'ai_planner_user_sessions',
  INVITATIONS: 'ai_planner_invitations',
} as const;

export interface ProjectInvitation {
  invitationId: string;
  projectId: string;
  inviterUserId: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  expiresAt: Date;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: User['role'];
  accessibleProjects: string[];
  isActive: boolean;
  lastLoginAt: Date;
}

class DataService {
  // ========== UTILITY METHODS ==========
  private getFromStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return [];
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage key ${key}:`, error);
    }
  }

  private generateId(): string {
    return uuidv4();
  }

  // ========== PROJECT METHODS ==========
  createProject(project: Omit<Project, 'projectId' | 'createdAt' | 'updatedAt'>): Project {
    const projects = this.getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    
    const newProject: Project = {
      ...project,
      projectId: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        allowMemberTaskEdit: true,
        allowMemberTaskCreate: false,
        allowMemberInvite: false,
        ...project.settings,
      },
    };

    projects.push(newProject);
    this.saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    
    return newProject;
  }

  getProjectsByUser(userId: string): Project[] {
    const projects = this.getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    return projects.filter(project => 
      project.ownerId === userId || project.members.includes(userId)
    );
  }

  getProject(projectId: string, userId: string): Project | null {
    const projects = this.getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const project = projects.find(p => p.projectId === projectId);
    
    if (!project) return null;
    
    // Access control: only owner and invited members can see the project
    if (project.ownerId !== userId && !project.members.includes(userId)) {
      return null;
    }
    
    return project;
  }

  updateProject(projectId: string, updates: Partial<Project>, userId: string): Project | null {
    const projects = this.getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const projectIndex = projects.findIndex(p => p.projectId === projectId);
    
    if (projectIndex === -1) return null;
    
    const project = projects[projectIndex];
    
    // Only owner can update project
    if (project.ownerId !== userId) {
      throw new Error('Only the project owner can update project settings');
    }
    
    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };
    
    projects[projectIndex] = updatedProject;
    this.saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    
    return updatedProject;
  }

  // ========== INVITATION METHODS ==========
  createInvitation(projectId: string, inviterUserId: string, inviteeEmail: string): ProjectInvitation {
    const project = this.getProject(projectId, inviterUserId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }
    
    if (project.ownerId !== inviterUserId) {
      throw new Error('Only the project owner can invite members');
    }

    const invitations = this.getFromStorage<ProjectInvitation>(STORAGE_KEYS.INVITATIONS);
    
    // Check if invitation already exists
    const existingInvitation = invitations.find(
      inv => inv.projectId === projectId && 
             inv.inviteeEmail === inviteeEmail && 
             inv.status === 'pending'
    );
    
    if (existingInvitation) {
      throw new Error('Invitation already sent to this email');
    }

    const invitation: ProjectInvitation = {
      invitationId: this.generateId(),
      projectId,
      inviterUserId,
      inviteeEmail,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    invitations.push(invitation);
    this.saveToStorage(STORAGE_KEYS.INVITATIONS, invitations);
    
    return invitation;
  }

  getInvitationsForEmail(email: string): ProjectInvitation[] {
    const invitations = this.getFromStorage<ProjectInvitation>(STORAGE_KEYS.INVITATIONS);
    return invitations.filter(inv => 
      inv.inviteeEmail === email && 
      inv.status === 'pending' && 
      new Date(inv.expiresAt) > new Date()
    );
  }

  acceptInvitation(invitationId: string, userId: string): boolean {
    const invitations = this.getFromStorage<ProjectInvitation>(STORAGE_KEYS.INVITATIONS);
    const invitationIndex = invitations.findIndex(inv => inv.invitationId === invitationId);
    
    if (invitationIndex === -1) return false;
    
    const invitation = invitations[invitationIndex];
    
    // Check if invitation is still valid
    if (invitation.status !== 'pending' || new Date(invitation.expiresAt) <= new Date()) {
      return false;
    }

    // Update invitation status
    invitations[invitationIndex].status = 'accepted';
    this.saveToStorage(STORAGE_KEYS.INVITATIONS, invitations);

    // Add user to project members
    const projects = this.getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const projectIndex = projects.findIndex(p => p.projectId === invitation.projectId);
    
    if (projectIndex !== -1) {
      if (!projects[projectIndex].members.includes(userId)) {
        projects[projectIndex].members.push(userId);
        projects[projectIndex].updatedAt = new Date();
        this.saveToStorage(STORAGE_KEYS.PROJECTS, projects);
      }
    }

    return true;
  }

  rejectInvitation(invitationId: string): boolean {
    const invitations = this.getFromStorage<ProjectInvitation>(STORAGE_KEYS.INVITATIONS);
    const invitationIndex = invitations.findIndex(inv => inv.invitationId === invitationId);
    
    if (invitationIndex === -1) return false;
    
    invitations[invitationIndex].status = 'rejected';
    this.saveToStorage(STORAGE_KEYS.INVITATIONS, invitations);
    
    return true;
  }

  // ========== USER SESSION METHODS ==========
  createUserSession(user: User): UserSession {
    const sessions = this.getFromStorage<UserSession>(STORAGE_KEYS.USER_SESSIONS);
    
    // Remove existing session for this user
    const filteredSessions = sessions.filter(s => s.userId !== user.userId);
    
    const session: UserSession = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      accessibleProjects: this.getProjectsByUser(user.userId).map(p => p.projectId),
      isActive: true,
      lastLoginAt: new Date(),
    };

    filteredSessions.push(session);
    this.saveToStorage(STORAGE_KEYS.USER_SESSIONS, filteredSessions);
    
    return session;
  }

  getUserSession(userId: string): UserSession | null {
    const sessions = this.getFromStorage<UserSession>(STORAGE_KEYS.USER_SESSIONS);
    return sessions.find(s => s.userId === userId && s.isActive) || null;
  }

  updateUserSession(userId: string, updates: Partial<UserSession>): UserSession | null {
    const sessions = this.getFromStorage<UserSession>(STORAGE_KEYS.USER_SESSIONS);
    const sessionIndex = sessions.findIndex(s => s.userId === userId);
    
    if (sessionIndex === -1) return null;
    
    const updatedSession = {
      ...sessions[sessionIndex],
      ...updates,
    };
    
    sessions[sessionIndex] = updatedSession;
    this.saveToStorage(STORAGE_KEYS.USER_SESSIONS, sessions);
    
    return updatedSession;
  }

  logoutUser(userId: string): void {
    const sessions = this.getFromStorage<UserSession>(STORAGE_KEYS.USER_SESSIONS);
    const sessionIndex = sessions.findIndex(s => s.userId === userId);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].isActive = false;
      this.saveToStorage(STORAGE_KEYS.USER_SESSIONS, sessions);
    }
  }

  // ========== TASK METHODS ==========
  createTask(task: Omit<Task, 'taskId' | 'createdAt' | 'updatedAt'>, userId: string): Task | null {
    const project = this.getProject(task.projectId, userId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Check permissions
    const isOwner = project.ownerId === userId;
    const isMember = project.members.includes(userId);
    const canCreate = isOwner || (isMember && project.settings?.allowMemberTaskCreate);

    if (!canCreate) {
      throw new Error('You do not have permission to create tasks in this project');
    }

    const tasks = this.getFromStorage<Task>(STORAGE_KEYS.TASKS);
    
    const newTask: Task = {
      ...task,
      taskId: this.generateId(),
      priority: task.priority || 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tasks.push(newTask);
    this.saveToStorage(STORAGE_KEYS.TASKS, tasks);
    
    return newTask;
  }

  getTasksByProject(projectId: string, userId: string): Task[] {
    const project = this.getProject(projectId, userId);
    if (!project) {
      return []; // No access to project = no access to tasks
    }

    const tasks = this.getFromStorage<Task>(STORAGE_KEYS.TASKS);
    return tasks.filter(task => task.projectId === projectId);
  }

  getTask(taskId: string, userId: string): Task | null {
    const tasks = this.getFromStorage<Task>(STORAGE_KEYS.TASKS);
    const task = tasks.find(t => t.taskId === taskId);
    
    if (!task) return null;
    
    // Check if user has access to the project
    const project = this.getProject(task.projectId, userId);
    if (!project) return null;
    
    return task;
  }

  updateTask(taskId: string, updates: Partial<Task>, userId: string): Task | null {
    const tasks = this.getFromStorage<Task>(STORAGE_KEYS.TASKS);
    const taskIndex = tasks.findIndex(t => t.taskId === taskId);
    
    if (taskIndex === -1) return null;
    
    const task = tasks[taskIndex];
    const project = this.getProject(task.projectId, userId);
    
    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Check permissions
    const isOwner = project.ownerId === userId;
    const isAssignee = task.assignee === userId;
    const canEdit = isOwner || (isAssignee && project.settings?.allowMemberTaskEdit);

    if (!canEdit) {
      throw new Error('You do not have permission to edit this task');
    }

    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date(),
    };

    // Set completion date when task is completed
    if (updates.status === 'completed' && task.status !== 'completed') {
      updatedTask.completedAt = new Date();
    }

    tasks[taskIndex] = updatedTask;
    this.saveToStorage(STORAGE_KEYS.TASKS, tasks);
    
    return updatedTask;
  }

  deleteTask(taskId: string, userId: string): boolean {
    const tasks = this.getFromStorage<Task>(STORAGE_KEYS.TASKS);
    const taskIndex = tasks.findIndex(t => t.taskId === taskId);
    
    if (taskIndex === -1) return false;
    
    const task = tasks[taskIndex];
    const project = this.getProject(task.projectId, userId);
    
    if (!project) return false;

    // Only owner can delete tasks
    if (project.ownerId !== userId) {
      throw new Error('Only the project owner can delete tasks');
    }

    tasks.splice(taskIndex, 1);
    this.saveToStorage(STORAGE_KEYS.TASKS, tasks);
    
    return true;
  }

  // ========== MEMBER MANAGEMENT ==========
  removeMember(projectId: string, memberUserId: string, currentUserId: string): boolean {
    const project = this.getProject(projectId, currentUserId);
    if (!project) return false;

    // Only owner can remove members
    if (project.ownerId !== currentUserId) {
      throw new Error('Only the project owner can remove members');
    }

    // Cannot remove the owner
    if (memberUserId === project.ownerId) {
      throw new Error('Cannot remove the project owner');
    }

    const projects = this.getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
    const projectIndex = projects.findIndex(p => p.projectId === projectId);
    
    if (projectIndex !== -1) {
      projects[projectIndex].members = projects[projectIndex].members.filter(
        memberId => memberId !== memberUserId
      );
      projects[projectIndex].updatedAt = new Date();
      this.saveToStorage(STORAGE_KEYS.PROJECTS, projects);
      return true;
    }

    return false;
  }

  // ========== UTILITY METHODS ==========
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  exportData(): Record<string, any> {
    const data: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      data[name] = this.getFromStorage(key);
    });
    return data;
  }

  importData(data: Record<string, any>): void {
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (data[name]) {
        this.saveToStorage(key, data[name]);
      }
    });
  }
}

export const dataService = new DataService();