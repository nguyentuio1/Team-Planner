import React, { useState } from 'react';
import { UserPlus, Users, Mail, X, Crown, Shield, Clock } from 'lucide-react';
import type { User } from '../types';

interface TeamManagerProps {
  teamMembers: User[];
  onAddMember: (member: User) => void;
  onRemoveMember: (userId: string) => void;
  currentUserId: string;
  ownerId?: string;
}

export const TeamManager: React.FC<TeamManagerProps> = ({
  teamMembers,
  onAddMember,
  onRemoveMember,
  currentUserId,
  ownerId,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'general' as User['role'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMember.name.trim() || !newMember.email.trim()) return;

    const member: User = {
      userId: Math.random().toString(36).substr(2, 9),
      name: newMember.name.trim(),
      email: newMember.email.trim(),
      role: newMember.role,
    };

    onAddMember(member);
    
    setNewMember({
      name: '',
      email: '',
      role: 'general',
    });
    setShowAddForm(false);
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'frontend':
        return 'bg-blue-100 text-blue-800';
      case 'backend':
        return 'bg-green-100 text-green-800';
      case 'design':
        return 'bg-purple-100 text-purple-800';
      case 'marketing':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: User['role']) => {
    switch (role) {
      case 'frontend':
        return 'Frontend Dev';
      case 'backend':
        return 'Backend Dev';
      case 'design':
        return 'Designer';
      case 'marketing':
        return 'Marketing';
      case 'general':
        return 'General';
      default:
        return role;
    }
  };

  const isOwner = (userId: string) => {
    return ownerId === userId;
  };

  const isCurrentUser = (userId: string) => {
    return currentUserId === userId;
  };

  const getMemberStatus = (member: User) => {
    if (isOwner(member.userId)) {
      return { label: 'Owner', icon: <Crown className="h-3 w-3" />, color: 'text-yellow-600 bg-yellow-50' };
    }
    if (isCurrentUser(member.userId)) {
      return { label: 'You', icon: <Shield className="h-3 w-3" />, color: 'text-blue-600 bg-blue-50' };
    }
    return null;
  };

  // Sort members: owner first, then current user, then others alphabetically
  const sortedMembers = [...teamMembers].sort((a, b) => {
    if (isOwner(a.userId)) return -1;
    if (isOwner(b.userId)) return 1;
    if (isCurrentUser(a.userId)) return -1;
    if (isCurrentUser(b.userId)) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <span className="ml-2 bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded-full">
            {teamMembers.length}
          </span>
        </div>
        
        {(isOwner(currentUserId)) && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Member
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="member-name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="member-name"
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="member-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="member-email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="member-role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="member-role"
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value as User['role'] })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="general">General</option>
                  <option value="frontend">Frontend Developer</option>
                  <option value="backend">Backend Developer</option>
                  <option value="design">Designer</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border">
          <div className="flex items-center">
            <Crown className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-700">Team Owner</p>
              <p className="text-lg font-semibold text-gray-900">
                {ownerId ? teamMembers.find(m => m.userId === ownerId)?.name || 'Unknown' : 'Not Set'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-700">Total Members</p>
              <p className="text-lg font-semibold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-700">Active Members</p>
              <p className="text-lg font-semibold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedMembers.map((member) => {
          const status = getMemberStatus(member);
          return (
            <div
              key={member.userId}
              className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all hover:bg-gray-50 ${
                isOwner(member.userId) 
                  ? 'border-yellow-200 bg-yellow-50' 
                  : isCurrentUser(member.userId)
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${
                  isOwner(member.userId) 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                    : isCurrentUser(member.userId)
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
                }`}>
                  {isOwner(member.userId) && <Crown className="h-5 w-5" />}
                  {!isOwner(member.userId) && (
                    <span className="text-sm">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-semibold text-gray-900">{member.name}</h4>
                    {status && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Mail className="h-3 w-3 mr-1" />
                    <span className="mr-4">{member.email}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Only owner can remove other members, and members can't remove the owner */}
                {isOwner(currentUserId) && !isOwner(member.userId) && (
                  <button
                    onClick={() => onRemoveMember(member.userId)}
                    className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Remove member"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                {/* Show member joined info */}
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {isOwner(member.userId) ? 'Team Owner' : 'Team Member'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {teamMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-500 mb-4">Add team members to start collaborating on your project!</p>
            {isOwner(currentUserId) && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First Member
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};