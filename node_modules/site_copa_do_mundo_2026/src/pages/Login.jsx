import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
        // Após registrar, fazer login automaticamente
        await login(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      setError(errorMsg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🏆 Rastreador de Figurinhas Copa 2026</h1>
        
        <form onSubmit={handleSubmit}>
          <h2>{isRegister ? 'Criar Conta' : 'Fazer Login'}</h2>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Processando...' : isRegister ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="toggle">
          <p>
            {isRegister ? 'Já tem conta?' : 'Não tem conta?'}
            {' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              disabled={loading}
            >
              {isRegister ? 'Fazer Login' : 'Criar Conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
