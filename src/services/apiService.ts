import type { User, Project, Task } from '../types';

// Get API base URL, prioritizing environment variable, then production URL
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Check if we're in production - use current origin for API calls
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  // Fallback for SSR or initial load
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; message?: string; details?: string }> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ========== AUTH METHODS ==========
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: User['role'];
  }): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
      return response.data;
    }

    throw new Error(response.message || 'Registration failed');
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setToken(response.data.token);
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/profile');

    if (response.success && response.data) {
      return response.data.user;
    }

    throw new Error(response.message || 'Failed to get user profile');
  }

  // ========== PROJECT METHODS ==========
  async getProjects(): Promise<Project[]> {
    const response = await this.request<{ projects: any[] }>('/projects');

    if (response.success && response.data) {
      return response.data.projects.map((project: any) => ({
        ...project,
        ownerId: project.owner_id,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at)
      }));
    }

    throw new Error(response.message || 'Failed to fetch projects');
  }

  async getProject(projectId: string): Promise<Project> {
    const response = await this.request<{ project: any }>(`/projects/${projectId}`);

    if (response.success && response.data) {
      const project = response.data.project;
      // Transform backend snake_case to frontend camelCase
      return {
        ...project,
        ownerId: project.owner_id,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at)
      };
    }

    throw new Error(response.message || 'Failed to fetch project');
  }

  async createProject(projectData: {
    title: string;
    description: string;
    settings?: {
      allowMemberTaskEdit?: boolean;
      allowMemberTaskCreate?: boolean;
      allowMemberInvite?: boolean;
    };
  }): Promise<Project> {
    const response = await this.request<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });

    if (response.success && response.data) {
      const project = response.data.project;
      return {
        ...project,
        ownerId: project.owner_id,
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at)
      };
    }

    throw new Error(response.message || 'Failed to create project');
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const response = await this.request<{ project: Project }>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.success && response.data) {
      return response.data.project;
    }

    throw new Error(response.message || 'Failed to update project');
  }

  async deleteProject(projectId: string): Promise<void> {
    const response = await this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete project');
    }
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    const response = await this.request(`/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to remove member');
    }
  }

  // ========== TASK METHODS ==========
  async getTasks(projectId: string): Promise<Task[]> {
    const response = await this.request<{ tasks: Task[] }>(`/tasks/project/${projectId}`);

    if (response.success && response.data) {
      return response.data.tasks;
    }

    throw new Error(response.message || 'Failed to fetch tasks');
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await this.request<{ task: Task }>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        projectId: taskData.project_id,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        assigneeId: taskData.assignee_id,
        dueDate: taskData.due_date,
        estimate: taskData.estimate,
        tags: taskData.tags,
        milestoneId: taskData.milestone_id,
      }),
    });

    if (response.success && response.data) {
      return response.data.task;
    }

    throw new Error(response.message || 'Failed to create task');
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.request<{ task: Task }>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.success && response.data) {
      return response.data.task;
    }

    throw new Error(response.message || 'Failed to update task');
  }

  async deleteTask(taskId: string): Promise<void> {
    const response = await this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete task');
    }
  }

  // ========== INVITATION METHODS ==========
  async sendInvitation(projectId: string, email: string): Promise<{
    invitation: any;
  }> {
    const response = await this.request<{ invitation: any }>('/invitations', {
      method: 'POST',
      body: JSON.stringify({ projectId, email }),
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to send invitation');
  }

  async getReceivedInvitations(): Promise<any[]> {
    const response = await this.request<{ invitations: any[] }>('/invitations/received');

    if (response.success && response.data) {
      return response.data.invitations;
    }

    throw new Error(response.message || 'Failed to fetch invitations');
  }

  async getInvitationDetails(invitationId: string): Promise<any> {
    // This endpoint doesn't require authentication for invitation acceptance
    const url = `${API_BASE_URL}/invitations/${invitationId}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch invitation details');
      }

      if (data.success && data.data) {
        return data.data.invitation;
      }

      throw new Error(data.message || 'Failed to fetch invitation details');
    } catch (error) {
      console.error('Get invitation details failed:', error);
      throw error;
    }
  }

  async acceptInvitation(invitationId: string): Promise<{ projectId: string }> {
    const response = await this.request<{ projectId: string }>(`/invitations/${invitationId}/accept`, {
      method: 'POST',
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to accept invitation');
  }

  async rejectInvitation(invitationId: string): Promise<void> {
    const response = await this.request(`/invitations/${invitationId}/reject`, {
      method: 'POST',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to reject invitation');
    }
  }

  // ========== USER METHODS ==========
  async getUsers(): Promise<User[]> {
    const response = await this.request<{ users: User[] }>('/users');

    if (response.success && response.data) {
      return response.data.users;
    }

    throw new Error(response.message || 'Failed to fetch users');
  }

  async searchUsers(email: string): Promise<User[]> {
    const response = await this.request<{ users: User[] }>(`/users/search?email=${encodeURIComponent(email)}`);

    if (response.success && response.data) {
      return response.data.users;
    }

    throw new Error(response.message || 'Failed to search users');
  }
}

export const apiService = new ApiService();