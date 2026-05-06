import ProgressBar from './ProgressBar';
import './Statistics.css';

export default function Statistics({ stats, grupos }) {
  if (!stats) {
    return <div className="stats-empty">Nenhuma estatística disponível</div>;
  }

  return (
    <div className="statistics">
      <section className="stats-overview">
        <h2>Visão Geral</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total do Álbum</h3>
            <p className="stat-value">{stats.coletadas}/{stats.total}</p>
            <ProgressBar percentage={stats.percentual} />
            <p className="stat-percent">{stats.percentual}%</p>
          </div>
        </div>
      </section>

      <section className="stats-by-group">
        <h2>Por Grupo</h2>
        <div className="groups-stats-grid">
          {Object.entries(stats.porGrupo || {}).map(([grupoId, grupoStats]) => (
            <div key={grupoId} className="group-stat-card">
              <h4>{grupoId}</h4>
              <p className="stat-items">{grupoStats.coletadas}/{grupoStats.total}</p>
              <ProgressBar percentage={grupoStats.percentual} />
              <p className="stat-percent">{grupoStats.percentual}%</p>
            </div>
          ))}
        </div>
      </section>

      <section className="stats-by-selection">
        <h2>Coleções Especiais</h2>
        <div className="special-stats-grid">
          {stats.porSelecao?.GLOBAL_FW && (
            <div className="special-stat-card">
              <h4>⚡ Forward</h4>
              <p className="stat-items">{stats.porSelecao.GLOBAL_FW.coletadas}/{stats.porSelecao.GLOBAL_FW.total}</p>
              <ProgressBar percentage={stats.porSelecao.GLOBAL_FW.percentual} />
              <p className="stat-percent">{stats.porSelecao.GLOBAL_FW.percentual}%</p>
            </div>
          )}
          {stats.porSelecao?.GLOBAL_CC && (
            <div className="special-stat-card">
              <h4>🥤 Coca-Cola</h4>
              <p className="stat-items">{stats.porSelecao.GLOBAL_CC.coletadas}/{stats.porSelecao.GLOBAL_CC.total}</p>
              <ProgressBar percentage={stats.porSelecao.GLOBAL_CC.percentual} />
              <p className="stat-percent">{stats.porSelecao.GLOBAL_CC.percentual}%</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
