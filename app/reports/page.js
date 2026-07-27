"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { naira } from "@/lib/format";

const TABS = [
  { key: "sales", label: "Sales" },
  { key: "profit", label: "Profit" },
  { key: "expenses", label: "Expenses" },
  { key: "best-sellers", label: "Best Sellers" },
  { key: "stock", label: "Remaining Stock" },
];

function presetRange(preset) {
  const to = new Date();
  const from = new Date();
  if (preset === "day") { /* today only */ }
  if (preset === "week") from.setDate(to.getDate() - 7);
  if (preset === "month") from.setDate(1);
  if (preset === "year") { from.setMonth(0); from.setDate(1); }
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function ReportsPage() {
  const [tab, setTab] = useState("sales");
  const [range, setRange] = useState(presetRange("month"));
  const [data, setData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ type: tab, from: range.from, to: range.to });
    fetch(`/api/reports?${params}`).then((r) => r.json()).then(setData);
  }, [tab, range]);

  return (
    <Shell>
      <h1 className="font-display text-2xl mb-6">Reports</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-4 py-2 rounded-lg ${tab === t.key ? "bg-[var(--brand)] text-white" : "bg-white border border-[var(--line)]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6">
        {["day", "week", "month", "year"].map((p) => (
          <button key={p} onClick={() => setRange(presetRange(p))} className="text-xs px-3 py-1.5 rounded-full border border-[var(--line)] bg-white capitalize hover:border-[var(--brand)]">
            {p === "day" ? "Today" : p === "week" ? "Last 7 days" : p === "month" ? "This month" : "This year"}
          </button>
        ))}
        <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="text-xs border border-[var(--line)] rounded px-2 py-1.5 bg-white" />
        <span className="text-xs text-[var(--muted)]">to</span>
        <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="text-xs border border-[var(--line)] rounded px-2 py-1.5 bg-white" />
      </div>

      {!data ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--line)] p-5">
          {(tab === "sales" || tab === "profit") && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Stat label="Transactions" value={data.transactionCount} />
                <Stat label="Revenue" value={naira(data.totalRevenue)} />
                <Stat label="Discounts Given" value={naira(data.totalDiscount)} />
                {tab === "profit" && <Stat label="Profit" value={naira(data.totalProfit)} accent />}
              </div>
              <h3 className="text-sm font-medium mb-2">By day</h3>
              <div className="space-y-1">
                {data.byDay?.map((d) => (
                  <div key={d.date} className="flex justify-between text-sm border-b border-[var(--line)] py-1.5 last:border-0">
                    <span className="text-[var(--muted)]">{d.date}</span>
                    <span>{naira(d.amount)}</span>
                  </div>
                ))}
                {data.byDay?.length === 0 && <p className="text-sm text-[var(--muted)]">No sales in this period.</p>}
              </div>
            </div>
          )}

          {tab === "expenses" && (
            <div>
              <Stat label="Total Expenses" value={naira(data.total)} accent />
              <h3 className="text-sm font-medium mt-4 mb-2">By category</h3>
              <div className="space-y-1">
                {data.byCategory?.map((c) => (
                  <div key={c.category} className="flex justify-between text-sm border-b border-[var(--line)] py-1.5 last:border-0">
                    <span>{c.category}</span>
                    <span>{naira(c.amount)}</span>
                  </div>
                ))}
                {data.byCategory?.length === 0 && <p className="text-sm text-[var(--muted)]">No expenses in this period.</p>}
              </div>
            </div>
          )}

          {tab === "best-sellers" && (
            <div className="space-y-1">
              {data.bestSellers?.map((b, i) => (
                <div key={b.name} className="flex justify-between text-sm border-b border-[var(--line)] py-2 last:border-0">
                  <span>{i + 1}. {b.name}</span>
                  <span>{b.qty} sold · {naira(b.revenue)}</span>
                </div>
              ))}
              {data.bestSellers?.length === 0 && <p className="text-sm text-[var(--muted)]">No sales in this period.</p>}
            </div>
          )}

          {tab === "stock" && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Stat label="Stock Value (Cost)" value={naira(data.valuationAtCost)} />
                <Stat label="Stock Value (Selling)" value={naira(data.valuationAtSelling)} accent />
              </div>
              <div className="space-y-1">
                {data.products?.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm border-b border-[var(--line)] py-1.5 last:border-0">
                    <span>{p.name} <span className="text-xs text-[var(--muted)]">({p.brand || "—"})</span></span>
                    <span>{p.quantity} units</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div className="text-xs text-[var(--muted)] uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-lg font-display ${accent ? "text-[var(--brand)]" : ""}`}>{value}</div>
    </div>
  );
}
