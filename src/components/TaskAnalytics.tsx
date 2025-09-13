import React from 'react';
import { 
  BarChart3, Star, Target, Clock, TrendingUp, 
  CheckCircle, AlertTriangle, Calendar, Timer, Crown, Shield
} from 'lucide-react';
import type { Task, User } from '../types';

interface TaskAnalyticsProps {
  tasks: Task[];
  teamMembers: User[];
  currentUserId?: string;
  ownerId?: string;
}

export const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ tasks, teamMembers, currentUserId, ownerId }) => {
  const getAnalytics = () => {
    const completed = tasks.filter(t => t.status === 'completed');
    const inProgress = tasks.filter(t => t.status === 'in-progress');
    const overdue = tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      t.status !== 'completed'
    );
    
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completed.length / totalTasks) * 100 : 0;
    
    // Time analytics
    const totalTimeSpent = completed.reduce((sum, task) => sum + (task.time_spent || 0), 0);
    const avgTimePerTask = completed.length > 0 ? totalTimeSpent / completed.length : 0;
    
    // Success metrics
    const tasksWithMetrics = completed.filter(t => t.successMetrics);
    const avgQuality = tasksWithMetrics.length > 0 
      ? tasksWithMetrics.reduce((sum, t) => sum + (t.successMetrics?.quality || 0), 0) / tasksWithMetrics.length
      : 0;
    const avgSatisfaction = tasksWithMetrics.length > 0
      ? tasksWithMetrics.reduce((sum, t) => sum + (t.successMetrics?.satisfaction || 0), 0) / tasksWithMetrics.length
      : 0;
    const onTimeRate = tasksWithMetrics.length > 0
      ? (tasksWithMetrics.filter(t => t.successMetrics?.onTime).length / tasksWithMetrics.length) * 100
      : 0;
    
    // Priority distribution
    const priorityStats = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
    
    // Team performance
    const teamStats = teamMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assignee_id === member.id);
      const memberCompleted = memberTasks.filter(t => t.status === 'completed');
      const memberTimeSpent = memberCompleted.reduce((sum, t) => sum + (t.time_spent || 0), 0);
      
      return {
        ...member,
        totalTasks: memberTasks.length,
        completedTasks: memberCompleted.length,
        completionRate: memberTasks.length > 0 ? (memberCompleted.length / memberTasks.length) * 100 : 0,
        timeSpent: memberTimeSpent,
        avgQuality: memberCompleted.length > 0
          ? memberCompleted
              .filter(t => t.successMetrics?.quality)
              .reduce((sum, t) => sum + (t.successMetrics?.quality || 0), 0) / 
            memberCompleted.filter(t => t.successMetrics?.quality).length
          : 0
      };
    }).filter(member => member.totalTasks > 0);

    return {
      totalTasks,
      completed: completed.length,
      inProgress: inProgress.length,
      overdue: overdue.length,
      completionRate,
      totalTimeSpent,
      avgTimePerTask,
      avgQuality,
      avgSatisfaction,
      onTimeRate,
      priorityStats,
      teamStats
    };
  };

  const analytics = getAnalytics();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const StatCard: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    value: string | number; 
    subtitle?: string;
    color?: string;
  }> = ({ icon, title, value, subtitle, color = 'text-indigo-600' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${color} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<CheckCircle className="h-8 w-8" />}
          title="Completion Rate"
          value={`${Math.round(analytics.completionRate)}%`}
          color="text-green-600"
        />
        <StatCard
          icon={<Timer className="h-8 w-8" />}
          title="Total Time Spent"
          value={formatTime(analytics.totalTimeSpent)}
          subtitle={`Avg: ${formatTime(Math.round(analytics.avgTimePerTask))}/task`}
          color="text-blue-600"
        />
        <StatCard
          icon={<Star className="h-8 w-8" />}
          title="Average Quality"
          value={`${analytics.avgQuality.toFixed(1)}/5`}
          color="text-yellow-600"
        />
        <StatCard
          icon={<Target className="h-8 w-8" />}
          title="On-Time Rate"
          value={`${Math.round(analytics.onTimeRate)}%`}
          color="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.priorityStats).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`}></div>
                  <span className="capitalize text-sm font-medium">{priority}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{count}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                      style={{ width: `${(count / analytics.totalTasks) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Quality Rating</span>
                <span className="text-sm text-gray-600">{analytics.avgQuality.toFixed(1)}/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(analytics.avgQuality / 5) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Satisfaction Rating</span>
                <span className="text-sm text-gray-600">{analytics.avgSatisfaction.toFixed(1)}/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(analytics.avgSatisfaction / 5) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">On-Time Completion</span>
                <span className="text-sm text-gray-600">{Math.round(analytics.onTimeRate)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${analytics.onTimeRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      {analytics.teamStats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Quality
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.teamStats.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          ownerId === member.id 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                            : currentUserId === member.id
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            : 'bg-gradient-to-r from-gray-500 to-gray-600'
                        }`}>
                          {ownerId === member.id ? (
                            <Crown className="h-4 w-4" />
                          ) : (
                            <span className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            {ownerId === member.id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-yellow-800 bg-yellow-100 border border-yellow-200">
                                <Crown className="h-3 w-3 mr-1" />
                                Owner
                              </span>
                            )}
                            {currentUserId === member.id && ownerId !== member.id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-blue-800 bg-blue-100 border border-blue-200">
                                <Shield className="h-3 w-3 mr-1" />
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.completedTasks}/{member.totalTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${member.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{Math.round(member.completionRate)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(member.timeSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.avgQuality > 0 ? `${member.avgQuality.toFixed(1)}/5` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues & Alerts */}
      {(analytics.overdue > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-red-900">Action Required</h4>
              <p className="text-sm text-red-700 mt-1">
                You have {analytics.overdue} overdue task{analytics.overdue !== 1 ? 's' : ''} that need attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};