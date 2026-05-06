import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import GrupoCard from '../components/GrupoCard';
import SpecialCollections from '../components/SpecialCollections';
import Statistics from '../components/Statistics';
import Duplicatas from '../components/Duplicatas';
import ProgressBar from '../components/ProgressBar';
import './Home.css';

export default function Home() {
  const { user, logout, sessionId } = useAuth();
  const [grupos, setGrupos] = useState([]);
  const [figurinhas, setFigurinhas] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterNotCollected, setFilterNotCollected] = useState(false);
  const [activeTab, setActiveTab] = useState('colecao');

  useEffect(() => {
    carregarDados();
  }, [sessionId]);

  const carregarDados = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      // Carregar grupos
      const gruposRes = await axios.get('/api/grupos');
      setGrupos(gruposRes.data);

      // Carregar figurinhas do usuário
      const figs = await axios.get('/api/figurinhas', {
        headers: { 'x-session-id': sessionId }
      });
      setFigurinhas(figs.data.grupos || {});

      // Carregar estatísticas
      const statsRes = await axios.get('/api/stats', {
        headers: { 'x-session-id': sessionId }
      });
      setStats(statsRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFigurinha = async (selecionId, tipo, numero) => {
    try {
      const res = await axios.post(
        '/api/figurinhas/toggle',
        { selecionId, tipo, numero },
        { headers: { 'x-session-id': sessionId } }
      );

      // Atualizar figurinhas locais
      setFigurinhas(prev => ({
        ...prev,
        [selecionId]: res.data.selecionFigs
      }));

      // Recarregar estatísticas
      const statsRes = await axios.get('/api/stats', {
        headers: { 'x-session-id': sessionId }
      });
      setStats(statsRes.data);
    } catch (err) {
      console.error('Erro ao toggle figurinha:', err);
    }
  };

  const handleAddDuplicate = async (selecionId, numero) => {
    try {
      await axios.post(
        '/api/figurinhas/add-duplicate',
        { selecionId, numero },
        { headers: { 'x-session-id': sessionId } }
      );

      // Recarregar dados
      await carregarDados();
    } catch (err) {
      console.error('Erro ao adicionar duplicata:', err);
    }
  };

  const handleToggleDuplicate = async (selecionId, numero, delta) => {
    try {
      if (delta > 0) {
        await axios.post(
          '/api/figurinhas/add-duplicate',
          { selecionId, numero },
          { headers: { 'x-session-id': sessionId } }
        );
      } else {
        await axios.post(
          '/api/figurinhas/remove-duplicate',
          { selecionId, numero },
          { headers: { 'x-session-id': sessionId } }
        );
      }

      // Recarregar dados
      await carregarDados();
    } catch (err) {
      console.error('Erro ao toggle duplicata:', err);
    }
  };

  if (loading) {
    return <div className="home-loading">Carregando...</div>;
  }

  return (
    <div className="home">
      <header className="home-header">
        <div className="header-content">
          <h1>🏆 Rastreador de Figurinhas Copa 2026</h1>
          <div className="header-actions">
            <span className="user-info">Olá, {user?.email}</span>
            <button onClick={logout} className="btn-logout">Sair</button>
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="tabs-section">
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'colecao' ? 'active' : ''}`}
              onClick={() => setActiveTab('colecao')}
            >
              📚 Coleção
            </button>
            <button
              className={`tab-button ${activeTab === 'estatisticas' ? 'active' : ''}`}
              onClick={() => setActiveTab('estatisticas')}
            >
              📊 Estatísticas
            </button>
            <button
              className={`tab-button ${activeTab === 'duplicatas' ? 'active' : ''}`}
              onClick={() => setActiveTab('duplicatas')}
            >
              🔄 Duplicatas
            </button>
          </div>
        </section>

        {activeTab === 'colecao' && (
          <>
            <section className="stats-section">
              {stats && (
                <div className="stats-container">
                  <div className="stat-card">
                    <h3>Total Coletadas</h3>
                    <p className="stat-number">{stats.coletadas}/{stats.total}</p>
                    <ProgressBar percentage={stats.percentual} />
                  </div>
                </div>
              )}
            </section>

            <section className="controls-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filterNotCollected}
                  onChange={(e) => setFilterNotCollected(e.target.checked)}
                />
                Mostrar apenas não coletadas
              </label>
            </section>

            <section className="special-collections-section">
              <SpecialCollections
                figurinhas={figurinhas}
                onToggleFigurinha={handleToggleFigurinha}
                stats={stats?.porSelecao || {}}
                filterNotCollected={filterNotCollected}
              />
            </section>

            <section className="grupos-section">
              {grupos.map(grupo => (
                <GrupoCard
                  key={grupo.id}
                  grupo={grupo}
                  figurinhas={figurinhas}
                  onToggleFigurinha={handleToggleFigurinha}
                  filterNotCollected={filterNotCollected}
                />
              ))}
            </section>
          </>
        )}

        {activeTab === 'estatisticas' && (
          <Statistics stats={stats} grupos={grupos} />
        )}

        {activeTab === 'duplicatas' && (
          <Duplicatas figurinhas={figurinhas} grupos={grupos} onAddDuplicate={handleAddDuplicate} onToggleDuplicate={handleToggleDuplicate} />
        )}
      </main>
    </div>
  );
}
