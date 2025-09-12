import React, { useState } from 'react';
import { Bug, Users, Mail, Database, X } from 'lucide-react';
import { dataService } from '../services/dataService';

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const getDebugData = () => {
    const allUsers = dataService.getAllUsers();
    const allInvitations = dataService.getFromStoragePublic('ai_planner_invitations');
    const allProjects = dataService.getFromStoragePublic('ai_planner_projects');
    
    return { allUsers, allInvitations, allProjects };
  };

  const { allUsers, allInvitations, allProjects } = getDebugData();

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white rounded-full p-3 shadow-lg hover:bg-purple-700 transition-colors"
          title="Debug Panel"
        >
          <Bug className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🐛 Debug Panel</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Users */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-blue-900">All Users ({allUsers.length})</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allUsers.map((user) => (
                  <div key={user.userId} className="text-xs bg-white p-2 rounded border">
                    <div className="font-semibold text-gray-900">{user.name}</div>
                    <div className="text-gray-600">{user.email}</div>
                    <div className="text-gray-500">ID: {user.userId.slice(0, 8)}...</div>
                    <div className="text-purple-600">{user.role}</div>
                  </div>
                ))}
                {allUsers.length === 0 && (
                  <div className="text-sm text-gray-500 italic">No users found</div>
                )}
              </div>
            </div>

            {/* Invitations */}
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Mail className="h-5 w-5 text-orange-600 mr-2" />
                <h3 className="font-medium text-orange-900">All Invitations ({allInvitations.length})</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allInvitations.map((inv: any) => (
                  <div key={inv.invitationId} className="text-xs bg-white p-2 rounded border">
                    <div className="font-semibold text-gray-900">{inv.inviteeEmail}</div>
                    <div className="text-gray-600">Status: {inv.status}</div>
                    <div className="text-gray-500">Project: {inv.projectId.slice(0, 8)}...</div>
                    <div className="text-green-600">
                      Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {allInvitations.length === 0 && (
                  <div className="text-sm text-gray-500 italic">No invitations found</div>
                )}
              </div>
            </div>

            {/* Projects */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Database className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-medium text-green-900">All Projects ({allProjects.length})</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allProjects.map((project: any) => (
                  <div key={project.projectId} className="text-xs bg-white p-2 rounded border">
                    <div className="font-semibold text-gray-900">{project.title}</div>
                    <div className="text-gray-600">Owner: {project.ownerId.slice(0, 8)}...</div>
                    <div className="text-gray-500">Members: {project.members.length}</div>
                    <div className="text-purple-600">
                      {project.members.map((m: string) => m.slice(0, 6)).join(', ')}
                    </div>
                  </div>
                ))}
                {allProjects.length === 0 && (
                  <div className="text-sm text-gray-500 italic">No projects found</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">🔍 Troubleshooting Tips</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Check if the invited user's email matches exactly in both Users and Invitations</li>
              <li>• Verify that invitation status is "pending" and not expired</li>
              <li>• Make sure project members array includes the user's ID</li>
              <li>• Login with the exact email used in the invitation</li>
            </ul>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close Debug Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};