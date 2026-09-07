// =====================================
// STAT CARD
// =====================================

export function StatCard({ label, value, tone, icon: Icon }) {

  return (
    <div className="stat-card">

      <div className={`stat-icon ${tone}`}>
        <Icon size={15} />
      </div>

      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>

    </div>
  )
}


// =====================================
// STATUS PILL
// =====================================

export function StatusPill({ status }) {

  return (
    <span
      className={`status-pill ${String(status)
        .toLowerCase()
        .replace(/\s+/g, '-')}`}
    >
      <i />
      {status}
    </span>
  )
}
