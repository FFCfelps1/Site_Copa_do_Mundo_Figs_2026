import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Carregando...</div>;
  }

  return user ? <Home /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
