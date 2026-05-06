import './TimeStats.css';

export default function TimeStats({ time }) {
  return (
    <div className="time-stats">
      <div className="time-header">
        <h3 className="time-name">{time.nome}</h3>
        {time.knockout && <span className="knockout-badge">Knockout</span>}
      </div>
    </div>
  );
}
