import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { useSelector, useDispatch } from 'react-redux';
import { store } from './store';
import type { RootState } from './store';
import { loginSuccess } from './store/slices/authSlice';
import { Login } from './components/Login';
import { Dashboard } from './pages/Dashboard';
import { InvitationAcceptance } from './components/InvitationAcceptance';
import { apiService } from './services/apiService';

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'invitation'>('login');
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    // Check if user is already logged in by validating stored token
    const checkStoredAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Verify token is still valid by fetching current user
          const user = await apiService.getCurrentUser();
          dispatch(loginSuccess(user));
        } catch (error) {
          // Token is invalid, clear it
          console.log('Stored token is invalid, clearing...');
          apiService.clearToken();
        }
      }
      setAuthCheckComplete(true);
    };

    if (!authCheckComplete) {
      checkStoredAuth();
    }
  }, [dispatch, authCheckComplete]);

  useEffect(() => {
    if (!authCheckComplete) return;

    // Check URL parameters for invitation
    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get('invite');
    
    if (inviteParam) {
      setInvitationId(inviteParam);
      setCurrentView('invitation');
    } else if (isAuthenticated) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
  }, [isAuthenticated, authCheckComplete]);

  const handleInvitationAccepted = async (projectId: string) => {
    try {
      // The user is already logged in at this point from InvitationAcceptance component
      // Just clear URL params and redirect to dashboard
      window.history.replaceState({}, '', window.location.pathname);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error after invitation acceptance:', error);
      setCurrentView('login');
    }
  };

  const handleInvitationRejected = () => {
    // Clear URL params and go to login
    window.history.replaceState({}, '', window.location.pathname);
    setCurrentView('login');
  };

  if (currentView === 'invitation' && invitationId) {
    return (
      <InvitationAcceptance
        invitationId={invitationId}
        onAccepted={handleInvitationAccepted}
        onRejected={handleInvitationRejected}
      />
    );
  }

  if (!authCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated && currentView === 'dashboard' ? <Dashboard /> : <Login />;
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;