export default function StatCard({ label, value, accent, hint }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--line)] p-5">
      <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-2xl font-display ${accent ? "text-[var(--brand)]" : "text-[var(--ink)]"}`}>{value}</div>
      {hint && <div className="text-xs text-[var(--muted)] mt-1">{hint}</div>}
    </div>
  );
}
