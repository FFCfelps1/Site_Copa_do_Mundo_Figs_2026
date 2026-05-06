import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sessão do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sessionId');
    if (saved) {
      setSessionId(saved);
      // Restaurar header padrão para axios
      axios.defaults.headers.common['x-session-id'] = saved;
      // Setando um user temporário, pode validar chamando /api/health ou similar
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, []);

  const register = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { email, password });
      return res.data;
    } catch (err) {
      throw err.response?.data?.error || err.message;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { sessionId: newSessionId, user: newUser } = res.data;
      
      setSessionId(newSessionId);
      setUser(newUser);
      
      localStorage.setItem('sessionId', newSessionId);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Configurar header padrão para futuras requisições
      axios.defaults.headers.common['x-session-id'] = newSessionId;
      
      return res.data;
    } catch (err) {
      throw err.response?.data?.error || err.message;
    }
  };

  const logout = async () => {
    try {
      if (sessionId) {
        await axios.post('/api/auth/logout', {}, {
          headers: { 'x-session-id': sessionId }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setSessionId(null);
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['x-session-id'];
    }
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
