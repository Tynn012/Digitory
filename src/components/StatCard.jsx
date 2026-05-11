const StatCard = ({ label, value, hint }) => (
  <div className="stat-card">
    <div>
      <p className="stat-label">{label}</p>
      <h3>{value}</h3>
    </div>
    {hint && <p className="stat-hint">{hint}</p>}
  </div>
)

export default StatCard
