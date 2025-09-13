import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Clock, UserPlus, Send, Copy, ExternalLink } from 'lucide-react';
import { apiService } from '../services/apiService';
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
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; link?: string } | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [currentUser.email]);

  const loadInvitations = async () => {
    try {
      const invitations = await apiService.getReceivedInvitations();
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
      setPendingInvitations([]);
    }
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
      const invitation = await apiService.sendInvitation(projectId, inviteEmail.trim());
      
      // Generate invitation link
      const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${invitation.invitation.id}`;
      
      setMessage({ 
        type: 'success', 
        text: `Invitation created for ${inviteEmail}! Share the invitation link below:`,
        link: inviteLink
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
      await apiService.acceptInvitation(invitationId);
      
      setMessage({ type: 'success', text: 'Invitation accepted! You now have access to the project.' });
      loadInvitations();
      onInvitationAccepted();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to accept invitation' 
      });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await apiService.rejectInvitation(invitationId);
      
      setMessage({ type: 'success', text: 'Invitation rejected.' });
      loadInvitations();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to reject invitation' 
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage(prev => prev ? { ...prev, text: prev.text + ' (Link copied!)' } : null);
      setTimeout(() => {
        setMessage(prev => prev ? { ...prev, text: prev.text.replace(' (Link copied!)', '') } : null);
      }, 2000);
    });
  };

  const formatTimeLeft = (expiresAt: Date | string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    
    if (isNaN(expires.getTime())) return 'Invalid date';
    
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

  const canInvite = projectId && projectId !== "";
  
  return (
    <div className="space-y-6">
      {/* Send Invitation Form - only for project owners */}
      {canInvite && (
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
            <strong>Real Team Invitations:</strong> Share the invitation link with team members. They'll create real accounts and join your project. 
            All team members will see the same real team data. Invitations expire in 7 days.
          </p>
        </div>
        </div>
      )}

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
                key={invitation.id}
                className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {invitation.project_title || 'Project Invitation'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Invited by {invitation.inviter_name || 'Unknown'} to join the project
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeLeft(invitation.expires_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectInvitation(invitation.id)}
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

      {/* No Invitations Message */}
      {!canInvite && pendingInvitations.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Invitations</h3>
            <p className="text-gray-600">
              You don't have any pending team invitations at the moment.
            </p>
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
          
          {message.link && (
            <div className="mt-3 p-3 bg-white rounded-md border border-green-300">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-mono truncate mr-2">{message.link}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(message.link!)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200"
                    title="Copy link"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </button>
                  <button
                    onClick={() => window.open(message.link!, '_blank')}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200"
                    title="Open link"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </button>
                </div>
              </div>
            </div>
          )}
          
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