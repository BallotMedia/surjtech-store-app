"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import StatCard from "@/components/StatCard";
import { naira } from "@/lib/format";
import { useSession } from "@/lib/useSession";
import Link from "next/link";

export default function DashboardPage() {
  const user = useSession();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="font-display text-2xl">Dashboard</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {user ? `Welcome back, ${user.fullName.split(" ")[0]}.` : ""}
        </p>
      </div>

      {!data ? (
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Sales Today" value={naira(data.totalSalesToday)} accent />
            {data.todaysProfit !== null && (
              <StatCard label="Today's Profit" value={naira(data.todaysProfit)} />
            )}
            <StatCard label="Total Products" value={data.totalProducts} />
            <StatCard
              label="Low Stock Alert"
              value={data.lowStockCount}
              hint={data.lowStockCount ? "Items at or below reorder level" : "All stocked up"}
            />
            <StatCard label="Monthly Income" value={naira(data.monthlyIncome)} accent />
            {data.monthlyExpenses !== null && (
              <StatCard label="Monthly Expenses" value={naira(data.monthlyExpenses)} />
            )}
          </div>

          {data.lowStockItems?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[var(--line)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-sm">Low Stock Items</h2>
                <Link href="/products" className="text-xs text-[var(--brand)] hover:underline">
                  View all products
                </Link>
              </div>
              <div className="space-y-2">
                {data.lowStockItems.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--line)] last:border-0">
                    <span>{p.name}</span>
                    <span className="text-[var(--danger)] font-medium">{p.quantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
