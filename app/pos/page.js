"use client";
import { useEffect, useRef, useState } from "react";
import Shell from "@/components/Shell";
import { naira } from "@/lib/format";
import Receipt from "@/components/Receipt";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function PosPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [splitPayments, setSplitPayments] = useState(null); // null = single method for full total
  const [error, setError] = useState("");
  const [lastSale, setLastSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => setSettings(d.settings));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!q) { setResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((d) => setResults(d.products || []));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function addToCart(p) {
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id);
      if (existing) {
        return c.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...c, { productId: p.id, name: p.name, unitPrice: Number(p.sellingPrice), quantity: 1, lineDiscount: 0, maxStock: p.quantity, warrantyMonths: p.warrantyMonths }];
    });
    setQ("");
    setResults([]);
    inputRef.current?.focus();
  }

  function onScanEnter(e) {
    if (e.key === "Enter" && results.length === 1) {
      addToCart(results[0]);
    } else if (e.key === "Enter" && results.length > 1) {
      // exact barcode/code match wins
      const exact = results.find((r) => r.barcode === q || r.productCode === q);
      if (exact) addToCart(exact);
    }
  }

  async function onCameraDetected(code) {
    const res = await fetch(`/api/products?q=${encodeURIComponent(code)}`);
    const d = await res.json();
    const match = (d.products || []).find((r) => r.barcode === code) || (d.products || [])[0];
    if (match) {
      addToCart(match);
    } else {
      setError(`No product found for barcode ${code}`);
    }
  }

  function updateQty(productId, qty) {
    setCart((c) => c.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i)));
  }

  function removeItem(productId) {
    setCart((c) => c.filter((i) => i.productId !== productId));
  }

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity - Number(i.lineDiscount || 0), 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  async function completeSale() {
    setError("");
    if (cart.length === 0) { setError("Cart is empty"); return; }

    const pays = splitPayments && splitPayments.length > 0
      ? splitPayments
      : [{ method: paymentMethod, amount: total }];

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, lineDiscount: i.lineDiscount })),
        discount,
        payments: pays,
        customerPhone: customerPhone || undefined,
        customerName: customerName || undefined,
      }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error || "Sale failed"); return; }

    setLastSale({ sale: d.sale, items: cart, discount, total, customerPhone, customerName });
    setCart([]);
    setDiscount(0);
    setCustomerPhone("");
    setCustomerName("");
    setSplitPayments(null);
    setPaymentMethod("cash");
  }

  function addSplit() {
    setSplitPayments((sp) => [...(sp || []), { method: "cash", amount: 0 }]);
  }

  const splitTotal = (splitPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <Shell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="font-display text-2xl mb-4">Sales / POS</h1>
          <div className="relative mb-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)] pointer-events-none"
              aria-hidden="true"
            >
              <path d="M4 5v14M8 5v14M11 5v14M13 5v14M16 5v14M19 5v3M19 16v3" />
            </svg>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onScanEnter}
              placeholder="Scan barcode or search product name / code…"
              className="w-full border border-[var(--line)] rounded-lg pl-11 pr-11 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              aria-label="Scan barcode with camera"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-[var(--muted)] hover:text-[var(--brand)] hover:bg-[var(--bg)]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
            </button>
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-[var(--line)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg)] flex justify-between border-b border-[var(--line)] last:border-0"
                  >
                    <span>{p.name} <span className="text-xs text-[var(--muted)]">({p.quantity} in stock)</span></span>
                    <span className="font-medium">{naira(p.sellingPrice)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
              <thead className="bg-[var(--bg)] text-[var(--muted)] text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-center px-4 py-3">Qty</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((i) => (
                  <tr key={i.productId} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">{i.name}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min={1}
                        value={i.quantity}
                        onChange={(e) => updateQty(i.productId, Number(e.target.value))}
                        className="w-16 border border-[var(--line)] rounded px-2 py-1 text-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">{naira(i.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">{naira(i.unitPrice * i.quantity - Number(i.lineDiscount || 0))}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeItem(i.productId)} aria-label={`Remove ${i.name} from cart`} className="text-xs text-[var(--danger)]">✕</button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--muted)]">Cart is empty. Scan or search a product to begin.</td></tr>
                )}
              </tbody>
            </table></div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-[var(--line)] p-5 sticky top-6 space-y-4">
            <h2 className="font-display text-lg">Checkout</h2>

            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Customer phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="border border-[var(--line)] rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border border-[var(--line)] rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Subtotal</span>
              <span>{naira(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted)]">Discount (₦)</span>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-24 border border-[var(--line)] rounded px-2 py-1 text-right text-sm"
              />
            </div>
            <div className="flex items-center justify-between text-base font-display border-t border-[var(--line)] pt-3">
              <span>Total</span>
              <span className="text-[var(--brand)]">{naira(total)}</span>
            </div>

            <div>
              <span className="block text-xs font-medium text-[var(--muted)] mb-1">Payment method</span>
              {!splitPayments ? (
                <div className="grid grid-cols-3 gap-2">
                  {["cash", "transfer", "pos"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`text-xs py-2 rounded-lg border capitalize ${
                        paymentMethod === m ? "bg-[var(--brand)] text-white border-[var(--brand)]" : "border-[var(--line)]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {splitPayments.map((p, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={p.method}
                        onChange={(e) => setSplitPayments((sp) => sp.map((x, i) => (i === idx ? { ...x, method: e.target.value } : x)))}
                        className="border border-[var(--line)] rounded px-2 py-1 text-sm"
                      >
                        <option value="cash">Cash</option>
                        <option value="transfer">Transfer</option>
                        <option value="pos">POS</option>
                      </select>
                      <input
                        type="number"
                        value={p.amount}
                        onChange={(e) => setSplitPayments((sp) => sp.map((x, i) => (i === idx ? { ...x, amount: Number(e.target.value) } : x)))}
                        className="flex-1 border border-[var(--line)] rounded px-2 py-1 text-sm text-right"
                      />
                    </div>
                  ))}
                  <div className={`text-xs ${Math.abs(splitTotal - total) > 1 ? "text-[var(--danger)]" : "text-[var(--good)]"}`}>
                    Allocated {naira(splitTotal)} of {naira(total)}
                  </div>
                </div>
              )}
              <button
                onClick={() => (splitPayments ? (setSplitPayments(null)) : addSplit())}
                className="text-xs text-[var(--brand)] hover:underline mt-2"
              >
                {splitPayments ? "Use single payment method" : "+ Split payment across methods"}
              </button>
              {splitPayments && (
                <button onClick={addSplit} className="text-xs text-[var(--brand)] hover:underline mt-2 ml-3">+ Add another method</button>
              )}
            </div>

            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

            <button
              onClick={completeSale}
              className="w-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-medium rounded-lg py-3 text-sm"
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>

      {lastSale && (
        <Receipt sale={lastSale} settings={settings} onClose={() => setLastSale(null)} />
      )}

      {scannerOpen && (
        <BarcodeScanner
          continuous
          onDetected={onCameraDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </Shell>
  );
}
