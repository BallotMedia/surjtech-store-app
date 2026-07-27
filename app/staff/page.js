"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { useSession } from "@/lib/useSession";

export default function StaffPage() {
  const me = useSession();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", fullName: "", password: "", role: "staff" });
  const [error, setError] = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");

  function load() {
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users || []));
  }
  useEffect(() => { load(); }, []);

  async function createUser(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to create account");
      return;
    }
    setShowForm(false);
    setForm({ username: "", fullName: "", password: "", role: "staff" });
    load();
  }

  async function toggleActive(u) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    load();
  }

  async function changeRole(u, role) {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    load();
  }

  async function submitReset(e) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/users/${resetTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: resetPassword }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to reset password");
      return;
    }
    setResetTarget(null);
    setResetPassword("");
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Manage Staff</h1>
        <button onClick={() => setShowForm(true)} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium rounded-lg px-4 py-2">
          + Add Account
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead className="bg-[var(--bg)] text-[var(--muted)] text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Username</th>
              <th className="text-left px-4 py-3">Full Name</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3">
                  {u.id === me?.id ? (
                    <span className="capitalize">{u.role}</span>
                  ) : (
                    <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="border border-[var(--line)] rounded px-2 py-1 text-xs">
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {u.active ? "active" : "disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  {u.id !== me?.id && (
                    <>
                      <button onClick={() => { setResetTarget(u); setError(""); }} className="text-xs text-[var(--brand)] hover:underline">Reset password</button>
                      <button onClick={() => toggleActive(u)} className="text-xs text-[var(--danger)] hover:underline">
                        {u.active ? "Disable" : "Enable"}
                      </button>
                    </>
                  )}
                  {u.id === me?.id && <span className="text-xs text-[var(--muted)]">You</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={createUser} className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg">Add Staff Account</h2>
            <input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
            <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
            <input type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]">
              <option value="staff">Sales Staff</option>
              <option value="admin">Admin</option>
            </select>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-[var(--line)] rounded-lg py-2 text-sm">Cancel</button>
              <button className="flex-1 bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium">Create</button>
            </div>
          </form>
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center p-4 z-50" onClick={() => setResetTarget(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitReset} className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg">Reset Password</h2>
            <p className="text-sm text-[var(--muted)]">for {resetTarget.fullName} (@{resetTarget.username})</p>
            <input type="password" placeholder="New password (min 6 characters)" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required minLength={6} className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" />
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setResetTarget(null)} className="flex-1 border border-[var(--line)] rounded-lg py-2 text-sm">Cancel</button>
              <button className="flex-1 bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium">Reset</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}
