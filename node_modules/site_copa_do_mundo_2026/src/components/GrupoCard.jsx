import FigurinhasGrid from './FigurinhasGrid';
import TimeStats from './TimeStats';
import './GrupoCard.css';

export default function GrupoCard({ grupo, figurinhas, onToggleFigurinha, filterNotCollected }) {
  return (
    <div className="grupo-card">
      <h2 className="grupo-title">{grupo.name}</h2>
      
      <div className="grupo-times-grid">
        {grupo.times.map(time => {
          // Suportar ambos os formatos: array (antigo) ou objeto com coletadas (novo)
          const timeData = figurinhas[time.id] || { coletadas: [] };
          const timeFigs = Array.isArray(timeData) ? timeData : (timeData?.coletadas || []);

          return (
            <div key={time.id} className="time-container">
              <TimeStats 
                time={time}
              />

              <FigurinhasGrid
                selecionId={time.id}
                figurinhas={timeFigs}
                onToggleFigurinha={onToggleFigurinha}
                filterNotCollected={filterNotCollected}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
