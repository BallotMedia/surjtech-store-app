"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { naira } from "@/lib/format";

const CATEGORIES = ["Rent", "Electricity", "Transport", "Salary", "Internet", "Other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("Rent");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  function load() {
    fetch("/api/expenses").then((r) => r.json()).then((d) => setExpenses(d.expenses || []));
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, amount: Number(amount), note, expenseDate }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to save expense");
      return;
    }
    setShowForm(false);
    setAmount(""); setNote("");
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this expense record?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Expenses</h1>
        <button onClick={() => setShowForm(true)} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium rounded-lg px-4 py-2">
          + Add Expense
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--line)] p-4 mb-4 flex justify-between text-sm">
        <span className="text-[var(--muted)]">Total recorded</span>
        <span className="font-display text-lg">{naira(total)}</span>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead className="bg-[var(--bg)] text-[var(--muted)] text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Note</th>
              <th className="text-left px-4 py-3">Recorded By</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3">{e.expenseDate}</td>
                <td className="px-4 py-3">{e.category}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{e.note || "—"}</td>
                <td className="px-4 py-3 text-[var(--muted)]">{e.recordedBy}</td>
                <td className="px-4 py-3 text-right font-medium">{naira(e.amount)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(e.id)} className="text-xs text-[var(--danger)] hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">No expenses recorded.</td></tr>
            )}
          </tbody>
        </table></div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg">Add Expense</h2>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" placeholder="Amount (₦)" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
            <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
            <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
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
