import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface Invitation {
  id: string;
  project_id: string;
  project_title: string;
  project_description: string;
  inviter_name: string;
  inviter_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  expires_at: string;
  created_at: string;
}

interface InvitationNotificationsProps {
  user: any;
  onInvitationAccepted?: (projectId: string) => void;
}

const InvitationNotifications: React.FC<InvitationNotificationsProps> = ({ 
  user, 
  onInvitationAccepted 
}) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const receivedInvitations = await apiService.getReceivedInvitations();
      setInvitations(receivedInvitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setProcessingInvitation(invitationId);
      const result = await apiService.acceptInvitation(invitationId);
      
      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // Notify parent component that an invitation was accepted
      if (onInvitationAccepted) {
        onInvitationAccepted(result.projectId);
      }

      // Show success message
      alert('Successfully joined the project!');
      
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      setProcessingInvitation(invitationId);
      await apiService.rejectInvitation(invitationId);
      
      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      alert('Invitation rejected successfully.');
      
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      alert('Failed to reject invitation. Please try again.');
    } finally {
      setProcessingInvitation(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatExpireDate = (dateString: string) => {
    const expireDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 7) return `Expires in ${diffDays} days`;
    return `Expires on ${expireDate.toLocaleDateString()}`;
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-blue-800">Loading invitations...</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
        Team Invitations ({invitations.length})
      </h3>
      
      {invitations.map((invitation) => (
        <div 
          key={invitation.id}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h4 className="font-semibold text-gray-900 mr-2">
                  {invitation.project_title}
                </h4>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Project Invitation
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-2">
                <strong>{invitation.inviter_name}</strong> ({invitation.inviter_email}) 
                invited you to join this project
              </p>
              
              {invitation.project_description && (
                <p className="text-gray-500 text-sm mb-2">
                  "{invitation.project_description}"
                </p>
              )}
              
              <div className="flex items-center text-xs text-gray-500 space-x-4">
                <span>Invited {formatDate(invitation.created_at)}</span>
                <span className="text-orange-600">
                  {formatExpireDate(invitation.expires_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => handleAcceptInvitation(invitation.id)}
              disabled={processingInvitation === invitation.id}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              {processingInvitation === invitation.id ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept Invitation
                </>
              )}
            </button>
            
            <button
              onClick={() => handleRejectInvitation(invitation.id)}
              disabled={processingInvitation === invitation.id}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              {processingInvitation === invitation.id ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Rejecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Decline
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvitationNotifications;