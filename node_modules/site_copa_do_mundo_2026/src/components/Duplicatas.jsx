import { useState } from 'react';
import DuplicataForm from './DuplicataForm';
import './Duplicatas.css';

export default function Duplicatas({ figurinhas, grupos, onToggleDuplicate, onAddDuplicate }) {
  const [expandedTeam, setExpandedTeam] = useState(null);

  const getDuplicatas = () => {
    const duplicatas = {};
    
    Object.entries(figurinhas).forEach(([selecionId, data]) => {
      // Checar se é formato novo {coletadas: [], duplicatas: {}}
      if (data && typeof data === 'object' && data.duplicatas && Object.keys(data.duplicatas).length > 0) {
        if (!duplicatas[selecionId]) {
          duplicatas[selecionId] = {};
        }
        duplicatas[selecionId] = data.duplicatas;
      }
    });
    
    return duplicatas;
  };

  const findTeamName = (teamId) => {
    if (teamId === 'GLOBAL_FW') return '⚡ Forward (FW)';
    if (teamId === 'GLOBAL_CC') return '🥤 Coca-Cola';
    
    for (const grupo of grupos) {
      const time = grupo.times?.find(t => t.id === teamId);
      if (time) return time.nome;
    }
    return teamId;
  };

  const duplicatas = getDuplicatas();
  const hasDuplicatas = Object.keys(duplicatas).length > 0;

  return (
    <div className="duplicatas-section">
      <DuplicataForm 
        figurinhas={figurinhas}
        grupos={grupos}
        onAddDuplicate={onAddDuplicate}
      />

      <div className="duplicatas-list-section">
        <h3>📋 Suas Duplicatas</h3>
        
        {!hasDuplicatas ? (
          <div className="duplicatas-empty">
            <p>📭 Nenhuma figurinha duplicada ainda</p>
            <p className="empty-hint">Use o formulário acima para adicionar figurinhas repetidas à sua coleção</p>
          </div>
        ) : (
          <div className="duplicatas-list">
            {Object.entries(duplicatas).map(([teamId, dups]) => (
              <div key={teamId} className="duplicatas-team">
                <button
                  className="team-header"
                  onClick={() => setExpandedTeam(expandedTeam === teamId ? null : teamId)}
                >
                  <span className="team-name">{findTeamName(teamId)}</span>
                  <span className="dup-count">{Object.values(dups).reduce((a, b) => a + b, 0)}</span>
                  <span className="expand-icon">{expandedTeam === teamId ? '▼' : '▶'}</span>
                </button>

                {expandedTeam === teamId && (
                  <div className="duplicatas-grid">
                    {Object.entries(dups).map(([numero, count]) => (
                      <div key={numero} className="dup-item">
                        <span className="dup-number">#{numero}</span>
                        <div className="dup-controls">
                          <button 
                            className="dup-btn"
                            onClick={() => onToggleDuplicate?.(teamId, numero, -1)}
                            title="Remover uma cópia"
                          >
                            −
                          </button>
                          <span className="dup-count-display">{count}</span>
                          <button 
                            className="dup-btn"
                            onClick={() => onToggleDuplicate?.(teamId, numero, 1)}
                            title="Adicionar uma cópia"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
