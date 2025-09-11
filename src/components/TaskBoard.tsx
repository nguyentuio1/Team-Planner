import React, { useState } from 'react';
import { 
  Clock, User, Tag, Calendar, Edit, Star, Target, 
  Timer, AlertTriangle, CheckCircle, Circle
} from 'lucide-react';
import type { Task } from '../types';
import { TaskEditor } from './TaskEditor';

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  teamMembers: { userId: string; name: string; role: string; email: string }[];
  currentUserId: string;
  isOwner: boolean;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTaskUpdate, teamMembers, currentUserId, isOwner }) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'border-gray-300 bg-gray-50';
      case 'in-progress':
        return 'border-yellow-300 bg-yellow-50';
      case 'completed':
        return 'border-green-300 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    const updatedTask = {
      ...task,
      status: newStatus,
      updatedAt: new Date(),
    };
    onTaskUpdate(updatedTask);
  };

  const handleAssigneeChange = (task: Task, assigneeId: string) => {
    const updatedTask = {
      ...task,
      assignee: assigneeId,
      updatedAt: new Date(),
    };
    onTaskUpdate(updatedTask);
  };


  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-3 w-3" />;
      case 'high': return <Circle className="h-3 w-3 fill-current" />;
      case 'medium': return <Circle className="h-3 w-3" />;
      case 'low': return <CheckCircle className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };

  const canEditTask = (task: Task) => {
    return isOwner || task.assignee === currentUserId;
  };

  const formatTimeSpent = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
    
    return (
      <div 
        className={`border-2 rounded-lg p-4 mb-3 transition-all hover:shadow-md cursor-pointer group relative ${getStatusColor(task.status)}`}
        style={{
          backgroundColor: task.styling?.backgroundColor || '#ffffff',
          borderColor: isOverdue ? '#ef4444' : undefined
        }}
        onClick={() => canEditTask(task) && setEditingTask(task)}
      >
        {/* Priority Badge */}
        {task.priority && task.priority !== 'medium' && (
          <div className={`absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-xs font-medium border flex items-center space-x-1 ${getPriorityColor(task.priority)}`}>
            {getPriorityIcon(task.priority)}
            <span className="capitalize">{task.priority}</span>
          </div>
        )}

        {/* Overdue Indicator */}
        {isOverdue && (
          <div className="absolute -top-1 -left-1 bg-red-500 text-white p-1 rounded-full">
            <AlertTriangle className="h-3 w-3" />
          </div>
        )}

        {/* Edit Button */}
        {canEditTask(task) && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingTask(task);
              }}
              className="p-1 bg-white rounded shadow-sm hover:bg-gray-50 border"
            >
              <Edit className="h-3 w-3 text-gray-600" />
            </button>
          </div>
        )}

        <div className="flex justify-between items-start mb-2">
          <h4 
            className="font-medium text-sm pr-8"
            style={{ 
              color: task.styling?.color || '#111827',
              fontSize: task.styling?.textSize === 'large' ? '16px' : task.styling?.textSize === 'small' ? '12px' : '14px',
              fontWeight: task.styling?.headerStyle === 'bold' ? 'bold' : 'medium',
              fontStyle: task.styling?.headerStyle === 'italic' ? 'italic' : 'normal',
              textDecoration: task.styling?.headerStyle === 'underline' ? 'underline' : 'none'
            }}
          >
            {task.title}
          </h4>
          <select
            value={task.status}
            onChange={(e) => {
              e.stopPropagation();
              handleStatusChange(task, e.target.value as Task['status']);
            }}
            className="text-xs border rounded px-2 py-1 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="pending">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Rich Content Preview */}
        {task.richContent?.blocks && task.richContent.blocks.length > 0 && (
          <div className="text-sm text-gray-600 mb-3">
            {task.richContent.blocks.slice(0, 2).map((block, index) => (
              <div 
                key={block.id} 
                className={`${index > 0 ? 'mt-1' : ''} line-clamp-2`}
                style={{
                  color: block.styling?.color,
                  backgroundColor: block.styling?.backgroundColor,
                  fontWeight: block.styling?.bold ? 'bold' : 'normal',
                  fontStyle: block.styling?.italic ? 'italic' : 'normal',
                  textDecoration: block.styling?.underline ? 'underline' : 'none',
                  fontFamily: block.type === 'code' ? 'monospace' : 'inherit',
                  fontSize: block.type === 'heading' ? '15px' : '13px'
                }}
              >
                {block.content || task.description}
              </div>
            ))}
            {task.richContent.blocks.length > 2 && (
              <span className="text-xs text-gray-400">+{task.richContent.blocks.length - 2} more blocks...</span>
            )}
          </div>
        )}

        {/* Legacy description fallback */}
        {(!task.richContent?.blocks || task.richContent.blocks.length === 0) && task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="space-y-2">
          {/* Time tracking */}
          <div className="flex items-center justify-between text-xs">
            {task.estimate && (
              <div className="flex items-center text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>{task.estimate}</span>
              </div>
            )}
            {task.timeSpent && task.timeSpent > 0 && (
              <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                <Timer className="h-3 w-3 mr-1" />
                <span>{formatTimeSpent(task.timeSpent)}</span>
              </div>
            )}
          </div>

          {/* Assignee */}
          <div className="flex items-center text-xs">
            <User className="h-3 w-3 mr-1 text-gray-500" />
            <select
              value={task.assignee || ''}
              onChange={(e) => {
                e.stopPropagation();
                handleAssigneeChange(task, e.target.value);
              }}
              className="text-xs border rounded px-1 py-0.5 bg-white min-w-0 flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <div className={`flex items-center text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              <Calendar className="h-3 w-3 mr-1" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              {isOverdue && <span className="ml-1 font-medium">(Overdue)</span>}
            </div>
          )}

          {/* Success Metrics for Completed Tasks */}
          {task.status === 'completed' && task.successMetrics && (
            <div className="flex items-center space-x-3 text-xs pt-2 border-t">
              {task.successMetrics.quality > 0 && (
                <div className="flex items-center text-yellow-600">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  <span>{task.successMetrics.quality}/5</span>
                </div>
              )}
              {task.successMetrics.satisfaction > 0 && (
                <div className="flex items-center text-green-600">
                  <Target className="h-3 w-3 mr-1 fill-current" />
                  <span>{task.successMetrics.satisfaction}/5</span>
                </div>
              )}
              {task.successMetrics.onTime && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>On time</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-1 text-xs">
              <Tag className="h-3 w-3 text-gray-500" />
              {task.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-gray-400">+{task.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const statuses: Task['status'][] = ['pending', 'in-progress', 'completed'];

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Board</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statuses.map(status => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{getStatusText(status)}</h4>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {getTasksByStatus(status).length}
                </span>
              </div>
              
              <div className="space-y-3">
                {getTasksByStatus(status).map(task => (
                  <TaskCard key={task.taskId} task={task} />
                ))}
                
                {getTasksByStatus(status).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No tasks in {getStatusText(status).toLowerCase()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Editor Modal */}
      {editingTask && (
        <TaskEditor
          task={editingTask}
          onSave={onTaskUpdate}
          onClose={() => setEditingTask(null)}
          teamMembers={teamMembers}
          isOwner={isOwner}
          canEdit={canEditTask(editingTask)}
        />
      )}
    </>
  );
};