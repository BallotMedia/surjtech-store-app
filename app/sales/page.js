"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import Receipt from "@/components/Receipt";
import { naira } from "@/lib/format";
import { useSession } from "@/lib/useSession";

export default function SalesHistoryPage() {
  const user = useSession();
  const [sales, setSales] = useState([]);
  const [receiptData, setReceiptData] = useState(null);
  const [settings, setSettings] = useState(null);

  function load() {
    fetch("/api/sales").then((r) => r.json()).then((d) => setSales(d.sales || []));
  }

  useEffect(() => {
    load();
    fetch("/api/settings").then((r) => r.json()).then((d) => setSettings(d.settings));
  }, []);

  async function reprint(id) {
    const res = await fetch(`/api/sales/${id}`);
    const d = await res.json();
    if (!res.ok) return;
    setReceiptData({
      sale: d.sale,
      items: d.items.map((i) => ({ name: i.productName, quantity: i.quantity, unitPrice: Number(i.unitPrice), lineDiscount: i.lineDiscount })),
      discount: Number(d.sale.discount),
      total: Number(d.sale.total),
      customerName: d.sale.customerName,
      customerPhone: d.sale.customerPhone,
    });
  }

  async function voidSale(id) {
    if (!confirm("Void this sale? Stock will be restored.")) return;
    const res = await fetch(`/api/sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "void" }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed to void sale");
      return;
    }
    load();
  }

  return (
    <Shell>
      <h1 className="font-display text-2xl mb-6">Sales History</h1>
      <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead className="bg-[var(--bg)] text-[var(--muted)] text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Receipt</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Sold By</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 font-mono text-xs">{s.receiptNo}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{s.soldBy}</td>
                <td className="px-4 py-3">{s.customerName || s.customerPhone || "Walk-in"}</td>
                <td className="px-4 py-3 text-right font-medium">{naira(s.total)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "voided" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  <button onClick={() => reprint(s.id)} className="text-xs text-[var(--brand)] hover:underline">Reprint</button>
                  {user?.role === "admin" && s.status !== "voided" && (
                    <button onClick={() => voidSale(s.id)} className="text-xs text-[var(--danger)] hover:underline">Void</button>
                  )}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">No sales yet.</td></tr>
            )}
          </tbody>
        </table></div>
      </div>

      {receiptData && <Receipt sale={receiptData} settings={settings} onClose={() => setReceiptData(null)} />}
    </Shell>
  );
}
