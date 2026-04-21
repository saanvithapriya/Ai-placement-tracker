import './StatsCard.css';

export default function StatsCard({ icon, label, value, color = 'primary', trend, subtitle }) {
  return (
    <div className={`stats-card stats-card--${color}`}>
      <div className="stats-card-header">
        <div className={`stats-card-icon stats-icon--${color}`}>{icon}</div>
        {trend !== undefined && (
          <div className={`stats-card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="stats-card-value">{value ?? '—'}</div>
      <div className="stats-card-label">{label}</div>
      {subtitle && <div className="stats-card-subtitle">{subtitle}</div>}
    </div>
  );
}
