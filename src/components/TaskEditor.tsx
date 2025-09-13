import React, { useState, useEffect } from 'react';
import { 
  X, Save, Clock, Calendar, User, Tag, Palette, 
  Bold, Italic, Underline, Type, AlignLeft, 
  CheckSquare, List, Code, Quote, Plus,
  Star, Timer, Target, Trash2
} from 'lucide-react';
import type { Task, User as UserType, ContentBlock } from '../types';

interface TaskEditorProps {
  task: Task | null;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
  teamMembers: UserType[];
  isOwner: boolean;
  canEdit: boolean;
}

export const TaskEditor: React.FC<TaskEditorProps> = ({
  task,
  onSave,
  onDelete,
  onClose,
  teamMembers,
  isOwner,
  canEdit
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'details' | 'success' | 'style'>('content');

  useEffect(() => {
    if (task) {
      setEditedTask({
        ...task,
        priority: task.priority || 'medium',
        styling: task.styling || {
          color: '#374151',
          backgroundColor: '#ffffff',
          headerStyle: 'default',
          textSize: 'medium'
        },
        richContent: task.richContent || {
          blocks: [
            {
              id: '1',
              type: 'text',
              content: task.description || '',
              styling: {}
            }
          ]
        }
      });
    }
  }, [task]);

  if (!task || !editedTask) return null;

  const handleSave = () => {
    if (editedTask) {
      console.log('DEBUG: TaskEditor saving task:', {
        taskId: editedTask.id,
        assignee_id: editedTask.assignee_id,
        fullTask: editedTask
      });
      
      onSave({
        ...editedTask,
        updated_at: new Date()
      });
      onClose();
    }
  };

  const updateTask = (updates: Partial<Task>) => {
    if (editedTask) {
      setEditedTask({ ...editedTask, ...updates });
    }
  };

  const addContentBlock = (type: ContentBlock['type']) => {
    if (!editedTask?.richContent) return;
    
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      styling: {}
    };

    updateTask({
      richContent: {
        blocks: [...editedTask.richContent.blocks, newBlock]
      }
    });
  };

  const updateContentBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    if (!editedTask?.richContent) return;

    const updatedBlocks = editedTask.richContent.blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );

    updateTask({
      richContent: { blocks: updatedBlocks }
    });
  };

  const deleteContentBlock = (blockId: string) => {
    if (!editedTask?.richContent) return;

    const filteredBlocks = editedTask.richContent.blocks.filter(block => block.id !== blockId);
    updateTask({
      richContent: { blocks: filteredBlocks }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const renderContentEditor = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Task Title
        </label>
        <input
          type="text"
          value={editedTask.title}
          onChange={(e) => updateTask({ title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ 
            color: editedTask.styling?.color,
            fontSize: editedTask.styling?.textSize === 'large' ? '18px' : editedTask.styling?.textSize === 'small' ? '14px' : '16px',
            fontWeight: editedTask.styling?.headerStyle === 'bold' ? 'bold' : 'normal',
            fontStyle: editedTask.styling?.headerStyle === 'italic' ? 'italic' : 'normal',
            textDecoration: editedTask.styling?.headerStyle === 'underline' ? 'underline' : 'none'
          }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Content</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => addContentBlock('text')}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Add Text Block"
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              onClick={() => addContentBlock('heading')}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Add Heading"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => addContentBlock('list')}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Add List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => addContentBlock('checklist')}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Add Checklist"
            >
              <CheckSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => addContentBlock('code')}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Add Code Block"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={() => addContentBlock('quote')}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Add Quote"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
          {editedTask.richContent?.blocks.map((block, index) => (
            <div key={block.id} className="group relative">
              <div className="flex items-start space-x-2">
                <div className="flex-1">
                  {block.type === 'heading' ? (
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateContentBlock(block.id, { content: e.target.value })}
                      className="w-full text-xl font-bold border-none outline-none bg-transparent"
                      placeholder="Enter heading..."
                      style={{
                        color: block.styling?.color,
                        backgroundColor: block.styling?.backgroundColor,
                        fontWeight: block.styling?.bold ? 'bold' : 'normal',
                        fontStyle: block.styling?.italic ? 'italic' : 'normal',
                        textDecoration: block.styling?.underline ? 'underline' : 'none'
                      }}
                    />
                  ) : (
                    <textarea
                      value={block.content}
                      onChange={(e) => updateContentBlock(block.id, { content: e.target.value })}
                      className="w-full border-none outline-none bg-transparent resize-none"
                      placeholder={
                        block.type === 'list' ? 'Enter list items...' :
                        block.type === 'checklist' ? 'Enter checklist items...' :
                        block.type === 'code' ? 'Enter code...' :
                        block.type === 'quote' ? 'Enter quote...' :
                        'Enter content...'
                      }
                      rows={block.type === 'text' ? 3 : 2}
                      style={{
                        color: block.styling?.color,
                        backgroundColor: block.styling?.backgroundColor,
                        fontWeight: block.styling?.bold ? 'bold' : 'normal',
                        fontStyle: block.styling?.italic ? 'italic' : 'normal',
                        textDecoration: block.styling?.underline ? 'underline' : 'none',
                        fontFamily: block.type === 'code' ? 'monospace' : 'inherit',
                        borderLeft: block.type === 'quote' ? '4px solid #d1d5db' : 'none',
                        paddingLeft: block.type === 'quote' ? '16px' : '0'
                      }}
                    />
                  )}
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                  <button
                    onClick={() => updateContentBlock(block.id, {
                      styling: { ...block.styling, bold: !block.styling?.bold }
                    })}
                    className={`p-1 text-xs rounded ${block.styling?.bold ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <Bold className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => updateContentBlock(block.id, {
                      styling: { ...block.styling, italic: !block.styling?.italic }
                    })}
                    className={`p-1 text-xs rounded ${block.styling?.italic ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <Italic className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteContentBlock(block.id)}
                    className="p-1 text-xs text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDetailsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={editedTask.priority}
            onChange={(e) => updateTask({ priority: e.target.value as Task['priority'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignee
          </label>
          <select
            value={editedTask.assignee_id || ''}
            onChange={(e) => updateTask({ assignee_id: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Unassigned</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <input
            type="datetime-local"
            value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().slice(0, 16) : ''}
            onChange={(e) => updateTask({ dueDate: e.target.value ? new Date(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimate
          </label>
          <input
            type="text"
            value={editedTask.estimate || ''}
            onChange={(e) => updateTask({ estimate: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., 2 hours, 3 days"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Spent (minutes)
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={editedTask.timeSpent || 0}
            onChange={(e) => updateTask({ timeSpent: parseInt(e.target.value) || 0 })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min="0"
          />
          <Timer className="h-5 w-5 text-gray-500" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <input
          type="text"
          value={editedTask.tags?.join(', ') || ''}
          onChange={(e) => updateTask({ 
            tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter tags separated by commas"
        />
      </div>
    </div>
  );

  const renderSuccessTab = () => (
    <div className="space-y-4">
      {editedTask.status === 'completed' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality Rating (1-5)
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => updateTask({
                    successMetrics: {
                      ...editedTask.successMetrics,
                      quality: rating
                    }
                  })}
                  className={`p-2 rounded ${
                    (editedTask.successMetrics?.quality || 0) >= rating
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className="h-5 w-5 fill-current" />
                </button>
              ))}
              <span className="text-sm text-gray-600">
                {editedTask.successMetrics?.quality || 0}/5
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Satisfaction Rating (1-5)
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => updateTask({
                    successMetrics: {
                      ...editedTask.successMetrics,
                      satisfaction: rating
                    }
                  })}
                  className={`p-2 rounded ${
                    (editedTask.successMetrics?.satisfaction || 0) >= rating
                      ? 'text-green-500'
                      : 'text-gray-300 hover:text-green-400'
                  }`}
                >
                  <Target className="h-5 w-5 fill-current" />
                </button>
              ))}
              <span className="text-sm text-gray-600">
                {editedTask.successMetrics?.satisfaction || 0}/5
              </span>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editedTask.successMetrics?.onTime || false}
                onChange={(e) => updateTask({
                  successMetrics: {
                    ...editedTask.successMetrics,
                    onTime: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Completed on time</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Success Notes
            </label>
            <textarea
              value={editedTask.successMetrics?.notes || ''}
              onChange={(e) => updateTask({
                successMetrics: {
                  ...editedTask.successMetrics,
                  notes: e.target.value
                }
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What went well? What could be improved?"
            />
          </div>
        </>
      )}

      {editedTask.status !== 'completed' && (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Success metrics will be available once the task is completed.</p>
        </div>
      )}
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Color
          </label>
          <input
            type="color"
            value={editedTask.styling?.color || '#374151'}
            onChange={(e) => updateTask({
              styling: { ...editedTask.styling, color: e.target.value }
            })}
            className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Color
          </label>
          <input
            type="color"
            value={editedTask.styling?.backgroundColor || '#ffffff'}
            onChange={(e) => updateTask({
              styling: { ...editedTask.styling, backgroundColor: e.target.value }
            })}
            className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Header Style
        </label>
        <select
          value={editedTask.styling?.headerStyle || 'default'}
          onChange={(e) => updateTask({
            styling: { ...editedTask.styling, headerStyle: e.target.value as any }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="default">Default</option>
          <option value="bold">Bold</option>
          <option value="italic">Italic</option>
          <option value="underline">Underline</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Size
        </label>
        <select
          value={editedTask.styling?.textSize || 'medium'}
          onChange={(e) => updateTask({
            styling: { ...editedTask.styling, textSize: e.target.value as any }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
        <div 
          className="p-3 rounded border"
          style={{ 
            backgroundColor: editedTask.styling?.backgroundColor,
            color: editedTask.styling?.color 
          }}
        >
          <h5 
            className="font-medium mb-1"
            style={{
              fontSize: editedTask.styling?.textSize === 'large' ? '18px' : editedTask.styling?.textSize === 'small' ? '14px' : '16px',
              fontWeight: editedTask.styling?.headerStyle === 'bold' ? 'bold' : 'normal',
              fontStyle: editedTask.styling?.headerStyle === 'italic' ? 'italic' : 'normal',
              textDecoration: editedTask.styling?.headerStyle === 'underline' ? 'underline' : 'none'
            }}
          >
            {editedTask.title || 'Task Title'}
          </h5>
          <p className="text-sm opacity-75">This is how your task will appear</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(editedTask.priority)}`}>
              {editedTask.priority.charAt(0).toUpperCase() + editedTask.priority.slice(1)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'content', label: 'Content', icon: AlignLeft },
            { id: 'details', label: 'Details', icon: Calendar },
            { id: 'success', label: 'Success', icon: Target },
            { id: 'style', label: 'Style', icon: Palette }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'content' && renderContentEditor()}
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'success' && renderSuccessTab()}
          {activeTab === 'style' && renderStyleTab()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${editedTask.title}"? This action cannot be undone.`)) {
                onDelete(editedTask.id);
                onClose();
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Task</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};