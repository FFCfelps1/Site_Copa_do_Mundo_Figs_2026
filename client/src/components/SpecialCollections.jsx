import FigurinhasGrid from './FigurinhasGrid';
import ProgressBar from './ProgressBar';
import './SpecialCollections.css';

export default function SpecialCollections({ figurinhas, onToggleFigurinha, stats, filterNotCollected }) {
  const fwStats = stats['GLOBAL_FW'] || { total: 19, coletadas: 0, percentual: 0 };
  const ccStats = stats['GLOBAL_CC'] || { total: 14, coletadas: 0, percentual: 0 };

  return (
    <div className="special-collections">
      <h2 className="special-title">🌟 Coleções Especiais</h2>
      
      <div className="special-grid">
        <div className="special-card">
          <div className="special-header">
            <h3>⚡ Forward (FW)</h3>
            <div className="special-info">
              <span className="special-count">{fwStats.coletadas}/{fwStats.total}</span>
              <span className="special-percent">{fwStats.percentual}%</span>
            </div>
          </div>
          <ProgressBar percentage={fwStats.percentual} />
          <div className="special-figurinhas">
            <div className="tipo-container no-border">
              <div className="figurinhas-grid-special">
                {Array.from({ length: 19 }, (_, i) => i + 1).map(num => {
                  const fwData = figurinhas['GLOBAL_FW'] || [];
                  const fwArray = Array.isArray(fwData) ? fwData : (fwData?.coletadas || []);
                  const collected = fwArray.includes(num);
                  const shouldShow = filterNotCollected ? !collected : true;

                  if (!shouldShow && filterNotCollected) return null;

                  return (
                    <label key={`fw-${num}`} className="figurinha-checkbox">
                      <input
                        type="checkbox"
                        checked={collected}
                        onChange={() => onToggleFigurinha('GLOBAL_FW', 'fw', num)}
                      />
                      <span className="figurinha-number">{num}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="special-card">
          <div className="special-header">
            <h3>🥤 Coca-Cola</h3>
            <div className="special-info">
              <span className="special-count">{ccStats.coletadas}/{ccStats.total}</span>
              <span className="special-percent">{ccStats.percentual}%</span>
            </div>
          </div>
          <ProgressBar percentage={ccStats.percentual} />
          <div className="special-figurinhas">
            <div className="tipo-container no-border">
              <div className="figurinhas-grid-special">
                {Array.from({ length: 14 }, (_, i) => i + 1).map(num => {
                  const ccData = figurinhas['GLOBAL_CC'] || [];
                  const ccArray = Array.isArray(ccData) ? ccData : (ccData?.coletadas || []);
                  const collected = ccArray.includes(num);
                  const shouldShow = filterNotCollected ? !collected : true;

                  if (!shouldShow && filterNotCollected) return null;

                  return (
                    <label key={`cc-${num}`} className="figurinha-checkbox">
                      <input
                        type="checkbox"
                        checked={collected}
                        onChange={() => onToggleFigurinha('GLOBAL_CC', 'cc', num)}
                      />
                      <span className="figurinha-number">{num}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
