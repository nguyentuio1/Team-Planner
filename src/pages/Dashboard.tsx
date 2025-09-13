import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BarChart3, Target, CheckSquare, Clock, LogOut, Crown, Shield, Plus, Mail } from 'lucide-react';
import type { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { apiService } from '../services/apiService';
import { GoalInput } from '../components/GoalInput';
import { TaskBoard } from '../components/TaskBoard';
import { InvitationManager } from '../components/InvitationManager';
import { TaskAnalytics } from '../components/TaskAnalytics';
import { TeamManager } from '../components/TeamManager';
import { DemoInstructions } from '../components/DemoInstructions';
import { DebugPanel } from '../components/DebugPanel';
import InvitationNotifications from '../components/InvitationNotifications';
import type { AITaskBreakdown, Task, User, Project } from '../types';

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [currentView, setCurrentView] = useState<'projects' | 'goal' | 'tasks' | 'team' | 'analytics' | 'invitations'>('projects');

  // Wrapper function to save view to localStorage
  const changeView = (view: typeof currentView) => {
    setCurrentView(view);
    localStorage.setItem('dashboard_current_view', view);
  };
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user's accessible projects
      const projects = await apiService.getProjects();
      setUserProjects(projects);
      
      // If no projects, stay on projects view to create one
      if (projects.length === 0) {
        setCurrentView('projects');
      } else {
        // Try to restore last project and view from localStorage
        const lastProjectId = localStorage.getItem('dashboard_current_project');
        const lastView = localStorage.getItem('dashboard_current_view') as typeof currentView;
        
        // Check if the saved project still exists in user's projects
        const savedProject = lastProjectId ? projects.find(p => p.id === lastProjectId) : null;
        
        if (savedProject && lastView) {
          // Restore saved state
          await loadProject(savedProject.id);
          setCurrentView(lastView);
        } else {
          // Load the first project by default
          const firstProject = projects[0];
          await loadProject(firstProject.id);
          setCurrentView('goal');
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (projectId: string) => {
    if (!user) return;
    
    try {
      const project = await apiService.getProject(projectId);
      setCurrentProject(project);
      
      // Save current project to localStorage
      localStorage.setItem('dashboard_current_project', projectId);
      
      // Load project tasks
      const tasks = await apiService.getTasks(projectId);
      setProjectTasks(tasks);
      
      // Load team members from project data (already included in project response)
      const projectMembers = project.members || [];
      setTeamMembers(projectMembers);
      
      // Load pending invitations count
      const invitations = await apiService.getReceivedInvitations();
      setPendingInvitationsCount(invitations.length);
      
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const refreshTasks = async () => {
    if (!currentProject) return;
    
    try {
      const tasks = await apiService.getTasks(currentProject.id);
      setProjectTasks(tasks);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    }
  };

  const handleLogout = () => {
    apiService.clearToken();
    dispatch(logout());
  };

  const handleCreateProject = async (title: string, description: string) => {
    if (!user) return;
    
    try {
      const newProject = await apiService.createProject({
        title,
        description,
        settings: {
          allowMemberTaskEdit: true,
          allowMemberTaskCreate: false,
          allowMemberInvite: false
        }
      });
      
      setUserProjects([...userProjects, newProject]);
      await loadProject(newProject.id);
      changeView('goal');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleTaskBreakdown = async (breakdown: AITaskBreakdown) => {
    if (!user || !currentProject) return;

    try {
      // Create all tasks sequentially to avoid race conditions
      for (const milestone of breakdown.milestones) {
        for (const taskData of milestone.tasks) {
          const taskToCreate = {
            project_id: currentProject.id,
            title: taskData.title,
            description: taskData.description,
            status: 'pending' as const,
            estimate: taskData.estimate,
            priority: 'medium' as const,
            richContent: {
              blocks: [
                {
                  id: '1',
                  type: 'text' as const,
                  content: taskData.description,
                  styling: {}
                }
              ]
            }
          };
          
          if (taskData.suggestedRole) {
            const suggestedMember = teamMembers.find(m => m.role === taskData.suggestedRole);
            if (suggestedMember) {
              (taskToCreate as any).assignee_id = suggestedMember.id;
            }
          }

          await apiService.createTask(taskToCreate);
        }
      }

      // Reload tasks
      const tasks = await apiService.getTasks(currentProject.id);
      setProjectTasks(tasks);
      changeView('tasks');
    } catch (error) {
      console.error('Failed to create tasks:', error);
    }
  };

  const handleTaskUpdate = async (updatedTask: Task) => {
    if (!user || !currentProject) return;
    
    try {
      await apiService.updateTask(updatedTask.id, updatedTask);
      
      // Reload tasks
      const tasks = await apiService.getTasks(currentProject.id);
      setProjectTasks(tasks);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleInvitationAccepted = () => {
    // Reload all data when invitation is accepted
    loadUserData(); 
    // Switch to projects view to see newly accessible projects
    changeView('projects');
  };

  const getProgressStats = () => {
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = projectTasks.filter(t => t.status === 'in-progress').length;
    const pendingTasks = projectTasks.filter(t => t.status === 'pending').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate,
    };
  };

  const stats = getProgressStats();
  
  const isOwner = currentProject && user && currentProject.owner_id === user.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  // Projects Selection View - only show if explicitly on projects view OR no projects exist AND not currently viewing a loaded project
  if (currentView === 'projects' || (userProjects.length === 0 && !currentProject)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AI Project Planner</h1>
                  <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Projects</h2>
            <p className="text-lg text-gray-600">Select a project to work on, or create a new one</p>
          </div>

          <InvitationNotifications
            user={user!}
            onInvitationAccepted={(projectId) => {
              // Refresh projects list and navigate to the accepted project
              loadUserData();
              loadProject(projectId);
              changeView('goal');
            }}
          />

          {/* Existing Projects */}
          {userProjects.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      loadProject(project.id);
                      changeView('goal');
                    }}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{project.title}</h4>
                      {project.owner_id === user?.id && (
                        <Crown className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{project.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create New Project */}
          <div className="mt-8">
            <CreateProjectForm onCreateProject={handleCreateProject} />
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  const NavButton: React.FC<{ 
    view: Exclude<typeof currentView, 'projects'>; 
    icon: React.ReactNode; 
    label: string; 
    count?: number 
  }> = ({ view, icon, label, count }) => (
    <button
      onClick={() => changeView(view)}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        currentView === view
          ? 'bg-indigo-600 text-white'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
      {count !== undefined && (
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
          currentView === view ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => changeView('projects')}
                className="mr-3 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Back to projects"
              >
                <Target className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{currentProject?.title}</h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">{user?.name}</p>
                  {isOwner && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-yellow-800 bg-yellow-100 border border-yellow-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Owner
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projectTasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckSquare className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex space-x-1 mb-8">
          <NavButton 
            view="goal" 
            icon={<Target className="h-4 w-4" />} 
            label="Goal Input" 
          />
          <NavButton 
            view="tasks" 
            icon={<CheckSquare className="h-4 w-4" />} 
            label="Tasks" 
            count={projectTasks.length}
          />
          <NavButton 
            view="analytics" 
            icon={<BarChart3 className="h-4 w-4" />} 
            label="Analytics" 
          />
          <NavButton 
            view="invitations" 
            icon={<Mail className="h-4 w-4" />} 
            label={isOwner ? "Invite Members" : "My Invitations"}
            count={!isOwner ? pendingInvitationsCount : undefined}
          />
          <NavButton 
            view="team" 
            icon={<Shield className="h-4 w-4" />} 
            label="Team" 
            count={teamMembers.length}
          />
        </nav>

        <div className="space-y-6">
          {currentView === 'goal' && (
            <GoalInput 
              onTaskBreakdown={handleTaskBreakdown}
              teamMembers={teamMembers}
            />
          )}

          {currentView === 'tasks' && currentProject && (
            <TaskBoard 
              tasks={projectTasks}
              onTaskUpdate={handleTaskUpdate}
              onRefreshTasks={refreshTasks}
              teamMembers={teamMembers}
              currentUserId={user?.id || ''}
              isOwner={isOwner || false}
            />
          )}

          {currentView === 'analytics' && currentProject && (
            <TaskAnalytics 
              tasks={projectTasks}
              teamMembers={teamMembers}
              currentUserId={user?.id}
              ownerId={currentProject.owner_id}
            />
          )}

          {currentView === 'invitations' && currentProject && (
            <InvitationManager
              currentUser={user!}
              projectId={isOwner ? currentProject.id : ""}
              onInvitationAccepted={handleInvitationAccepted}
            />
          )}

          {currentView === 'team' && currentProject && (
            <TeamManager
              teamMembers={teamMembers}
              onAddMember={(member: User) => {
                setTeamMembers([...teamMembers, member]);
              }}
              onRemoveMember={(userId: string) => {
                apiService.removeMember(currentProject.id, userId);
                setTeamMembers(teamMembers.filter(m => m.id !== userId));
              }}
              currentUserId={user?.id || ''}
              ownerId={currentProject.owner_id}
              projectId={currentProject.id}
              onTeamUpdate={() => loadProject(currentProject.id)}
            />
          )}

          {projectTasks.length === 0 && currentView === 'tasks' && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-500 mb-4">
                Start by defining your project goal to generate AI-powered task breakdown.
              </p>
              <button
                onClick={() => changeView('goal')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Target className="h-4 w-4 mr-2" />
                Set Project Goal
              </button>
            </div>
          )}
        </div>
        
        {/* Demo Instructions */}
        <DemoInstructions />
        
        {/* Debug Panel */}
        <DebugPanel />
      </div>
    </div>
  );
};

// Create Project Form Component
const CreateProjectForm: React.FC<{ onCreateProject: (title: string, description: string) => void }> = ({ onCreateProject }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    try {
      await onCreateProject(title.trim(), description.trim());
      setTitle('');
      setDescription('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <Plus className="h-6 w-6 text-indigo-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Create New Project</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project-title" className="block text-sm font-medium text-gray-700 mb-2">
            Project Title
          </label>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., E-commerce Website"
            disabled={creating}
            required
          />
        </div>

        <div>
          <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Brief description of your project..."
            disabled={creating}
          />
        </div>

        <button
          type="submit"
          disabled={creating || !title.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <>
              <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </>
          )}
        </button>
      </form>
    </div>
  );
};