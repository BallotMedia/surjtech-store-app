"use client";
import { useState } from "react";
import Shell from "@/components/Shell";
import { useSession } from "@/lib/useSession";

export default function AccountPage() {
  const user = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword !== confirm) {
      setError("New passwords do not match");
      return;
    }
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to change password");
      return;
    }
    setSuccess(true);
    setCurrentPassword(""); setNewPassword(""); setConfirm("");
  }

  return (
    <Shell>
      <h1 className="font-display text-2xl mb-6">My Account</h1>
      <div className="bg-white rounded-2xl border border-[var(--line)] p-6 max-w-md">
        <div className="mb-5">
          <div className="text-sm font-medium">{user?.fullName}</div>
          <div className="text-xs text-[var(--muted)]">@{user?.username} · {user?.role}</div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <h2 className="text-sm font-medium">Change password</h2>
          <input
            type="password" placeholder="Current password" value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)} required
            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password" placeholder="New password (min 6 characters)" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password" placeholder="Confirm new password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} required
            className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {success && <p className="text-sm text-[var(--good)]">Password updated.</p>}
          <button className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-medium rounded-lg px-5 py-2.5 text-sm">
            Update Password
          </button>
        </form>
      </div>
    </Shell>
  );
}
