import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Clock, Crown, AlertCircle } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { User } from '../types';

interface InvitationAcceptanceProps {
  invitationId: string;
  onAccepted: (userId: string) => void;
  onRejected: () => void;
}

export const InvitationAcceptance: React.FC<InvitationAcceptanceProps> = ({
  invitationId,
  onAccepted,
  onRejected
}) => {
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'general' as User['role']
  });
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  useEffect(() => {
    loadInvitationDetails();
  }, [invitationId]);

  const loadInvitationDetails = () => {
    setLoading(true);
    try {
      const details = dataService.getInvitationDetails(invitationId);
      if (details) {
        setInvitation(details);
        setUserForm(prev => ({ ...prev, email: details.inviteeEmail }));
        
        // Check if user already exists
        const existingUser = dataService.findUserByEmail(details.inviteeEmail);
        if (!existingUser) {
          setShowRegistrationForm(true);
        }
      } else {
        setError('Invitation not found');
      }
    } catch (err) {
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (showRegistrationForm && (!userForm.name.trim())) {
      setError('Please enter your name to continue');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = dataService.acceptInvitation(
        invitationId,
        invitation.inviteeEmail,
        showRegistrationForm ? {
          name: userForm.name.trim(),
          role: userForm.role
        } : undefined
      );

      if (result.success && result.userId) {
        onAccepted(result.userId);
      } else {
        setError(result.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectInvitation = async () => {
    setProcessing(true);
    try {
      const rejected = dataService.rejectInvitation(invitationId);
      if (rejected) {
        onRejected();
      } else {
        setError('Failed to reject invitation');
      }
    } catch (err) {
      setError('Failed to reject invitation');
    } finally {
      setProcessing(false);
    }
  };

  const formatTimeLeft = (expiresAt: Date) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Not Found</h2>
          <p className="text-gray-600">This invitation may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Invitation</h2>
          <p className="text-gray-600">
            You've been invited to join <strong>{invitation.projectTitle}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            by {invitation.inviterName}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">
                {formatTimeLeft(invitation.expiresAt)}
              </span>
            </div>
            <div className="flex items-center">
              <Crown className="h-4 w-4 text-yellow-600 mr-1" />
              <span className="text-sm text-gray-600">Team Project</span>
            </div>
          </div>
        </div>

        {showRegistrationForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Complete Your Profile</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your full name"
                  disabled={processing}
                />
              </div>
              
              <div>
                <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Role
                </label>
                <select
                  id="user-role"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as User['role'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={processing}
                >
                  <option value="general">General</option>
                  <option value="frontend">Frontend Developer</option>
                  <option value="backend">Backend Developer</option>
                  <option value="design">Designer</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">This email is from the invitation</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleRejectInvitation}
            disabled={processing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {processing ? (
              <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full mx-auto"></div>
            ) : (
              <>
                <X className="h-4 w-4 inline mr-1" />
                Decline
              </>
            )}
          </button>
          
          <button
            onClick={handleAcceptInvitation}
            disabled={processing || (showRegistrationForm && !userForm.name.trim())}
            className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {processing ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
            ) : (
              <>
                <Check className="h-4 w-4 inline mr-1" />
                Accept & Join
              </>
            )}
          </button>
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-green-800">
            <strong>Secure Invitation:</strong> This creates a real account that you can use to log in and collaborate with your team. 
            All team members will see real user information and can work together on the project.
          </p>
        </div>
      </div>
    </div>
  );
};