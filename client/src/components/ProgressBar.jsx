export default function ProgressBar({ percentage }) {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="progress-label">{percentage}%</span>
    </div>
  );
}
