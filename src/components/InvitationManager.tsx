import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Clock, UserPlus, Send } from 'lucide-react';
import { dataService, type ProjectInvitation } from '../services/dataService';
import type { User } from '../types';

interface InvitationManagerProps {
  currentUser: User;
  projectId: string;
  onInvitationAccepted: () => void;
}

export const InvitationManager: React.FC<InvitationManagerProps> = ({
  currentUser,
  projectId,
  onInvitationAccepted
}) => {
  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [currentUser.email]);

  const loadInvitations = () => {
    const invitations = dataService.getInvitationsForEmail(currentUser.email);
    setPendingInvitations(invitations);
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    if (inviteEmail === currentUser.email) {
      setMessage({ type: 'error', text: 'Cannot invite yourself' });
      return;
    }

    setInviting(true);
    
    try {
      await dataService.createInvitation(projectId, currentUser.userId, inviteEmail.trim());
      
      setMessage({ 
        type: 'success', 
        text: `Invitation sent to ${inviteEmail}. They will be able to access the project once they accept.` 
      });
      setInviteEmail('');
      
      // In a real app, you would send an email here
      // await sendInvitationEmail(inviteEmail, invitation);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to send invitation' 
      });
    } finally {
      setInviting(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const accepted = dataService.acceptInvitation(invitationId, currentUser.userId);
      
      if (accepted) {
        setMessage({ type: 'success', text: 'Invitation accepted! You now have access to the project.' });
        loadInvitations();
        onInvitationAccepted();
      } else {
        setMessage({ type: 'error', text: 'Failed to accept invitation. It may have expired.' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to accept invitation' 
      });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      const rejected = dataService.rejectInvitation(invitationId);
      
      if (rejected) {
        setMessage({ type: 'success', text: 'Invitation rejected.' });
        loadInvitations();
      } else {
        setMessage({ type: 'error', text: 'Failed to reject invitation.' });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to reject invitation' 
      });
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

  return (
    <div className="space-y-6">
      {/* Send Invitation Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <UserPlus className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
        </div>

        <form onSubmit={handleSendInvitation} className="space-y-4">
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="colleague@company.com"
              disabled={inviting}
            />
          </div>

          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inviting ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Privacy Note:</strong> Only invited members will be able to see this project and its tasks. 
            The invitation will be valid for 7 days.
          </p>
        </div>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Mail className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
            <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {pendingInvitations.length}
            </span>
          </div>

          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.invitationId}
                className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Project Invitation
                    </h4>
                    <p className="text-sm text-gray-600">
                      You've been invited to join a project
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeLeft(invitation.expiresAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAcceptInvitation(invitation.invitationId)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectInvitation(invitation.invitationId)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};