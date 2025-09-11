import React from 'react';
import { Provider } from 'react-redux';
import { useSelector } from 'react-redux';
import { store } from './store';
import type { RootState } from './store';
import { Login } from './components/Login';
import { Dashboard } from './pages/Dashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return isAuthenticated ? <Dashboard /> : <Login />;
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;