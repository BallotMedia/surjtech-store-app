"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { naira } from "@/lib/format";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  function load(query) {
    fetch(`/api/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`).then((r) => r.json()).then((d) => setCustomers(d.customers || []));
  }

  useEffect(() => { load(""); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  async function openCustomer(c) {
    setSelected(c);
    const res = await fetch(`/api/customers/${c.id}`);
    const d = await res.json();
    setDetail(d);
  }

  async function addCustomer(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to add customer");
      return;
    }
    setShowForm(false);
    setName(""); setPhone("");
    load(q);
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Customers</h1>
        <button onClick={() => setShowForm(true)} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium rounded-lg px-4 py-2">
          + Add Customer
        </button>
      </div>
      <p className="text-xs text-[var(--muted)] mb-4">
        Most customers are walk-ins — name and phone are optional and only needed if you want to track their purchase history or warranty.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone…"
            className="w-full mb-3 border border-[var(--line)] rounded-lg px-3 py-2 text-sm bg-white"
          />
          <div className="bg-white rounded-2xl border border-[var(--line)] divide-y divide-[var(--line)] max-h-[60vh] overflow-y-auto">
            {customers.map((c) => (
              <button key={c.id} onClick={() => openCustomer(c)} className={`w-full text-left px-4 py-3 text-sm hover:bg-[var(--bg)] ${selected?.id === c.id ? "bg-[var(--bg)]" : ""}`}>
                <div className="font-medium">{c.name || "Unnamed customer"}</div>
                <div className="text-xs text-[var(--muted)]">{c.phone}</div>
              </button>
            ))}
            {customers.length === 0 && <div className="px-4 py-8 text-center text-[var(--muted)] text-sm">No customers on file.</div>}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!detail ? (
            <div className="bg-white rounded-2xl border border-[var(--line)] p-8 text-center text-[var(--muted)] text-sm">
              Select a customer to view purchase history and warranty status.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--line)] p-5">
              <h2 className="font-display text-lg">{detail.customer.name || "Unnamed customer"}</h2>
              <p className="text-sm text-[var(--muted)] mb-4">{detail.customer.phone}</p>
              <div className="space-y-2">
                {detail.purchases.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm border-b border-[var(--line)] py-2 last:border-0">
                    <div>
                      <div>{p.quantity} x {p.productName}</div>
                      <div className="text-xs text-[var(--muted)]">{new Date(p.date).toLocaleDateString()} · {p.receiptNo}</div>
                    </div>
                    <div className="text-right">
                      <div>{naira(p.unitPrice)}</div>
                      {p.warrantyMonths > 0 && (
                        <div className={`text-xs ${p.warrantyActive ? "text-[var(--good)]" : "text-[var(--danger)]"}`}>
                          Warranty {p.warrantyActive ? "active" : "expired"} · until {new Date(p.warrantyExpires).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {detail.purchases.length === 0 && <p className="text-sm text-[var(--muted)]">No purchases recorded yet.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={addCustomer} className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg">Add Customer</h2>
            <input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
            <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-[var(--line)] rounded-lg py-2 text-sm">Cancel</button>
              <button className="flex-1 bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium">Save</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
