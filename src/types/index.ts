export interface User {
  id: string;
  name: string;
  email: string;
  role: 'frontend' | 'backend' | 'design' | 'marketing' | 'general';
  avatar?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  members: User[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    allowMemberTaskEdit: boolean;
    allowMemberTaskCreate: boolean;
    allowMemberInvite: boolean;
  };
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignee_id?: string;
  due_date?: Date;
  estimate?: string;
  tags?: string[];
  milestone_id?: string;
  created_at: Date;
  updated_at: Date;
  // Enhanced features
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completedAt?: Date;
  timeSpent?: number; // in minutes
  successMetrics?: {
    quality: number; // 1-5 rating
    satisfaction: number; // 1-5 rating
    onTime: boolean;
    notes?: string;
  };
  styling?: {
    color?: string;
    backgroundColor?: string;
    headerStyle?: 'default' | 'bold' | 'italic' | 'underline';
    textSize?: 'small' | 'medium' | 'large';
  };
  richContent?: {
    blocks: ContentBlock[];
  };
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'heading' | 'list' | 'checklist' | 'code' | 'quote';
  content: string;
  styling?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    backgroundColor?: string;
  };
}

export interface Milestone {
  milestoneId: string;
  projectId: string;
  title: string;
  description?: string;
  tasks: Task[];
  dueDate?: Date;
  completed: boolean;
  createdAt: Date;
}

export interface AITaskBreakdown {
  milestones: {
    title: string;
    description?: string;
    tasks: {
      title: string;
      description: string;
      estimate: string;
      suggestedRole?: string;
    }[];
  }[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

export interface TaskState {
  tasks: Task[];
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
}