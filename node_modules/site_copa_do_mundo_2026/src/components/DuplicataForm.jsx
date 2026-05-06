import { useState } from 'react';
import './DuplicataForm.css';

export default function DuplicataForm({ figurinhas, grupos, onAddDuplicate }) {
  const [expandedTeam, setExpandedTeam] = useState(null);

  const findTeamName = (teamId) => {
    if (teamId === 'GLOBAL_FW') return '⚡ Forward (FW)';
    if (teamId === 'GLOBAL_CC') return '🥤 Coca-Cola';
    
    for (const grupo of grupos) {
      const time = grupo.times?.find(t => t.id === teamId);
      if (time) return time.nome;
    }
    return teamId;
  };

  // Filtrar times que têm figurinhas coletadas
  const teamsWithCollection = Object.entries(figurinhas || {})
    .filter(([id, data]) => {
      // Novo formato: {coletadas: [...], duplicatas: {...}}
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data.coletadas && Array.isArray(data.coletadas) && data.coletadas.length > 0;
      }
      
      // Formato antigo: array de números
      return Array.isArray(data) && data.length > 0;
    })
    .map(([id]) => id);

  return (
    <div className="duplicata-form">
      <div className="duplicata-form-header">
        <h3>✏️ Adicione Duplicatas</h3>
        <p>Selecione um time e marque as figurinhas que você tem repetidas</p>
      </div>

      <div className="duplicata-teams-list">
        {teamsWithCollection.length === 0 ? (
          <p className="no-collection">Colete algumas figurinhas primeiro para adicionar duplicatas</p>
        ) : (
          teamsWithCollection.map(teamId => {
            const teamData = figurinhas[teamId];
            // Suportar ambos os formatos: array e objeto com coletadas
            const teamFigs = Array.isArray(teamData) ? teamData : (teamData?.coletadas || []);
            return (
              <div key={teamId} className="duplicata-team-section">
                <button
                  className="team-toggle"
                  onClick={() => setExpandedTeam(expandedTeam === teamId ? null : teamId)}
                >
                  <span>{findTeamName(teamId)}</span>
                  <span className="expand-arrow">{expandedTeam === teamId ? '▼' : '▶'}</span>
                </button>

                {expandedTeam === teamId && (
                  <div className="duplicata-grid">
                    {teamFigs.map(numero => (
                      <div key={numero} className="duplicata-item-form">
                        <span className="dup-label">#{numero}</span>
                        <button
                          className="dup-add-btn"
                          onClick={() => onAddDuplicate?.(teamId, numero)}
                          title="Adicionar uma duplicata"
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="duplicata-form-hint">
        <p>💡 <strong>Como funciona:</strong> Clique em "+" ao lado de cada figurinha que você tem repetida. Você pode adicionar várias cópias da mesma figurinha.</p>
      </div>
    </div>
  );
}
