"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => setForm(d.settings || {}));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (!form) return <Shell><p className="text-sm text-[var(--muted)]">Loading…</p></Shell>;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <Shell>
      <h1 className="font-display text-2xl mb-6">Settings</h1>
      <form onSubmit={save} className="bg-white rounded-2xl border border-[var(--line)] p-6 max-w-xl space-y-4">
        <div className="flex items-center gap-4 mb-2">
          <img src={form.logoUrl || "/logo.jpg"} alt="Logo" className="w-16 h-16 rounded-full object-cover ring-2 ring-[var(--brand)]" />
          <div className="text-sm text-[var(--muted)]">Surjtech logo — used on the dashboard and printed receipts.</div>
        </div>
        <Field label="Business Name" value={form.businessName || ""} onChange={set("businessName")} />
        <Field label="Address" value={form.address || ""} onChange={set("address")} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone Number" value={form.phone || ""} onChange={set("phone")} />
          <Field label="Email" value={form.email || ""} onChange={set("email")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Facebook" value={form.facebook || ""} onChange={set("facebook")} />
          <Field label="Instagram" value={form.instagram || ""} onChange={set("instagram")} />
        </div>
        <Field label="Receipt Header" value={form.receiptHeader || ""} onChange={set("receiptHeader")} />
        <Field label="Receipt Footer" value={form.receiptFooter || ""} onChange={set("receiptFooter")} />
        <Field label="Low Stock Threshold (default)" type="number" value={form.lowStockThreshold || 3} onChange={set("lowStockThreshold")} />
        <div className="flex items-center gap-3 pt-2">
          <button className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-medium rounded-lg px-5 py-2.5 text-sm">Save Settings</button>
          {saved && <span className="text-sm text-[var(--good)]">Saved.</span>}
        </div>
      </form>
    </Shell>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--muted)] mb-1">{label}</span>
      <input type={type} value={value} onChange={onChange} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
    </label>
  );
}
