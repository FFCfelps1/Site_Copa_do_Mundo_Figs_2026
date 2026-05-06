import { useState } from 'react';
import './FigurinhasGrid.css';

export default function FigurinhasGrid({ selecionId, figurinhas, onToggleFigurinha, filterNotCollected }) {
  const [expandedType, setExpandedType] = useState('base');

  // Gerar números das figurinhas
  const baseNumbers = Array.from({ length: 20 }, (_, i) => i + 1);

  // Suportar ambos os formatos
  const coletadasArray = Array.isArray(figurinhas)
    ? figurinhas
    : (figurinhas?.coletadas || []);

  const renderFigurinhas = (tipo, numbers, label) => {
    const coletadas = Array.isArray(figurinhas)
      ? figurinhas
      : (figurinhas?.coletadas || []);

    const filtered = filterNotCollected
      ? numbers.filter(n => !coletadas.includes(n))
      : numbers;

    if (filtered.length === 0 && filterNotCollected) {
      return null;
    }

    return (
      <div key={tipo} className="tipo-container">
        <div
          className="tipo-header"
          onClick={() => setExpandedType(expandedType === tipo ? null : tipo)}
        >
          <span className="tipo-label">{label}</span>
          <span className="tipo-count">
            {coletadas.length}/{numbers.length}
          </span>
          <span className="tipo-arrow">
            {expandedType === tipo ? '▼' : '▶'}
          </span>
        </div>

        {expandedType === tipo && (
          <div className="figurinhas-grid">
            {filtered.map(num => (
              <label key={num} className="figurinha-checkbox">
                <input
                  type="checkbox"
                  checked={coletadas.includes(num)}
                  onChange={() => onToggleFigurinha(selecionId, tipo, num)}
                />
                <span className="figurinha-number">{num}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="figurinhas-container">
      {renderFigurinhas('base', baseNumbers, 'Base (1-20)')}
    </div>
  );
}
