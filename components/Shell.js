"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "grid", roles: ["admin", "staff"] },
  { href: "/products", label: "Products", icon: "box", roles: ["admin", "staff"] },
  { href: "/pos", label: "Sales / POS", icon: "cart", roles: ["admin", "staff"] },
  { href: "/sales", label: "Sales History", icon: "chart", roles: ["admin", "staff"] },
  { href: "/customers", label: "Customers", icon: "users", roles: ["admin", "staff"] },
  { href: "/expenses", label: "Expenses", icon: "wallet", roles: ["admin"] },
  { href: "/reports", label: "Reports", icon: "chart", roles: ["admin"] },
  { href: "/staff", label: "Manage Staff", icon: "users", roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: "cog", roles: ["admin"] },
];

function Icon({ name, className }) {
  const paths = {
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    box: "M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10",
    cart: "M3 4h2l2.4 12.4a2 2 0 002 1.6h7.2a2 2 0 002-1.6L21 8H6",
    users: "M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M15 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87",
    wallet: "M3 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM17 12h.01",
    chart: "M4 20V10M12 20V4M20 20v-7",
    cog: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "M6 6l12 12M18 6L6 18",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={paths[name]} />
    </svg>
  );
}

export default function Shell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">Loading…</div>;
  }
  if (user === null) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  const items = NAV.filter((n) => n.roles.includes(user.role));

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-6 border-b border-[rgba(255,255,255,0.1)]">
        <img src="/logo.jpg" alt="Surjtech" className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--brand)] shrink-0" />
        <div>
          <div className="font-display text-lg tracking-tight">SURJTECH</div>
          <div className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.5)]">Store Manager</div>
        </div>
        <button
          onClick={() => setMenuOpen(false)}
          className="ml-auto md:hidden text-[rgba(255,255,255,0.6)] hover:text-white p-1"
          aria-label="Close menu"
        >
          <Icon name="close" className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? "bg-[var(--brand)] text-white" : "text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
              }`}
            >
              <Icon name={item.icon} className="w-4.5 h-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-[rgba(255,255,255,0.1)] space-y-2">
        <div className="text-sm font-medium">{user.fullName}</div>
        <div className="text-xs text-[rgba(255,255,255,0.5)] uppercase tracking-wide mb-1">{user.role}</div>
        <Link href="/account" className="block text-xs text-[rgba(255,255,255,0.6)] hover:text-white underline underline-offset-2">
          My account
        </Link>
        <button onClick={logout} className="text-xs text-[rgba(255,255,255,0.6)] hover:text-white underline underline-offset-2">
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-[var(--charcoal)] text-white px-4 py-3">
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="p-1 -ml-1 text-[rgba(255,255,255,0.8)] hover:text-white">
          <Icon name="menu" className="w-6 h-6" />
        </button>
        <img src="/logo.jpg" alt="Surjtech" className="w-7 h-7 rounded-full object-cover ring-2 ring-[var(--brand)]" />
        <span className="font-display text-base tracking-tight">SURJTECH</span>
      </div>

      {/* Mobile off-canvas drawer + backdrop */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" onClick={() => setMenuOpen(false)} />
          <aside className="relative w-72 max-w-[80%] bg-[var(--charcoal)] text-white flex flex-col h-full">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-[var(--charcoal)] text-white flex-col">
        {sidebarContent}
      </aside>

      <main className="flex-1 min-w-0 bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto px-4 py-5 md:px-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
