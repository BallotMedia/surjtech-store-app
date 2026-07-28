"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Shell from "@/components/Shell";
import { naira } from "@/lib/format";
import { useSession } from "@/lib/useSession";
import Papa from "papaparse";
import BarcodeScanner from "@/components/BarcodeScanner";

const emptyForm = {
  productCode: "", barcode: "", name: "", brandId: "", categoryId: "",
  costPrice: "", sellingPrice: "", quantity: "", reorderLevel: "3",
  supplierId: "", warrantyMonths: "0",
};

export default function ProductsPage() {
  const user = useSession();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [q, setQ] = useState("");
  const [view, setView] = useState("active");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  function onImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await fetch("/api/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: results.data }),
        });
        const d = await res.json();
        setImportResult(d);
        setImporting(false);
        load(q, view);
        if (fileRef.current) fileRef.current.value = "";
      },
      error: () => {
        setImporting(false);
        setImportResult({ errors: ["Could not read the CSV file"] });
      },
    });
  }

  const load = useCallback(async (query, currentView) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (currentView === "discontinued") params.set("view", "discontinued");
    const res = await fetch(`/api/products${params.toString() ? `?${params}` : ""}`);
    const d = await res.json();
    setProducts(d.products || []);
  }, []);

  useEffect(() => {
    load("", view);
    fetch("/api/brands").then((r) => r.json()).then((d) => setBrands(d.brands || []));
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
    fetch("/api/suppliers").then((r) => r.json()).then((d) => setSuppliers(d.suppliers || []));
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(q, view), 300);
    return () => clearTimeout(t);
  }, [q, view, load]);

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({
      productCode: p.productCode, barcode: p.barcode || "", name: p.name,
      brandId: p.brandId || "", categoryId: p.categoryId || "",
      costPrice: p.costPrice, sellingPrice: p.sellingPrice, quantity: p.quantity,
      reorderLevel: p.reorderLevel, supplierId: p.supplierId || "", warrantyMonths: p.warrantyMonths,
    });
    setEditingId(p.id);
    setError("");
    setShowForm(true);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      brandId: form.brandId ? Number(form.brandId) : null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
      warrantyMonths: Number(form.warrantyMonths),
    };
    const res = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to save product");
      return;
    }
    setShowForm(false);
    load(q, view);
  }

  async function discontinue(id) {
    if (!confirm("Mark this product as discontinued? You can restore it later from the Discontinued tab.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load(q, view);
  }

  async function restore(id) {
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    load(q, view);
  }

  const isAdmin = user?.role === "admin";

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Products</h1>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="border border-[var(--line)] bg-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-60"
            >
              {importing ? "Importing…" : "Import CSV"}
            </button>
            <input ref={fileRef} type="file" accept=".csv" onChange={onImportFile} className="hidden" />
            <button onClick={openNew} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium rounded-lg px-4 py-2">
              + Add Product
            </button>
          </div>
        )}
      </div>

      {importResult && (
        <div className="mb-4 bg-white border border-[var(--line)] rounded-xl p-4 text-sm">
          <div className="flex items-center justify-between mb-1">
            <span>
              {importResult.created ?? 0} created, {importResult.updated ?? 0} updated
              {importResult.errors?.length ? `, ${importResult.errors.length} row(s) skipped` : ""}.
            </span>
            <button onClick={() => setImportResult(null)} className="text-xs text-[var(--muted)] hover:underline">Dismiss</button>
          </div>
          {importResult.errors?.length > 0 && (
            <ul className="text-xs text-[var(--danger)] list-disc pl-4 mt-2 space-y-0.5 max-h-32 overflow-y-auto">
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {isAdmin && (
        <p className="text-xs text-[var(--muted)] mb-4">
          CSV columns: productCode, barcode, name, brand, category, costPrice, sellingPrice, quantity, reorderLevel, supplier, warrantyMonths.
          Existing products are matched and updated by productCode. <a href="/product-import-template.csv" download className="text-[var(--brand)] hover:underline">Download template</a>
        </p>
      )}

      {isAdmin && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView("active")}
            className={`text-sm px-4 py-1.5 rounded-full ${view === "active" ? "bg-[var(--brand)] text-white" : "bg-white border border-[var(--line)]"}`}
          >
            Active
          </button>
          <button
            onClick={() => setView("discontinued")}
            className={`text-sm px-4 py-1.5 rounded-full ${view === "discontinued" ? "bg-[var(--brand)] text-white" : "bg-white border border-[var(--line)]"}`}
          >
            Discontinued
          </button>
        </div>
      )}

      <div className="relative mb-5">
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
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, code, or scan/enter barcode…"
          className="w-full border border-[var(--line)] rounded-lg pl-11 pr-11 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
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
      </div>

      <div className="bg-white rounded-2xl border border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead className="bg-[var(--bg)] text-[var(--muted)] text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Brand</th>
              {isAdmin && <th className="text-right px-4 py-3">Cost</th>}
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">Stock</th>
              {isAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const low = p.quantity <= p.reorderLevel;
              return (
                <tr key={p.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{p.productCode}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{p.brand || "—"}</td>
                  {isAdmin && <td className="px-4 py-3 text-right">{naira(p.costPrice)}</td>}
                  <td className="px-4 py-3 text-right">{naira(p.sellingPrice)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${low ? "text-[var(--danger)]" : ""}`}>{p.quantity}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {view === "discontinued" ? (
                        <button onClick={() => restore(p.id)} className="text-xs text-[var(--good)] hover:underline">Restore to stock</button>
                      ) : (
                        <>
                          <button onClick={() => openEdit(p)} className="text-xs text-[var(--brand)] hover:underline">Edit</button>
                          <button onClick={() => discontinue(p.id)} className="text-xs text-[var(--danger)] hover:underline">Remove</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                  {view === "discontinued" ? "No discontinued products." : "No products found."}
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg mb-2">{editingId ? "Edit Product" : "Add Product"}</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Product Code" value={form.productCode} onChange={(v) => setForm({ ...form, productCode: v })} required />
              <Field label="Barcode" value={form.barcode} onChange={(v) => setForm({ ...form, barcode: v })} />
            </div>
            <Field label="Product Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <div className="grid grid-cols-2 gap-3">
              <SelectWithAdd
                label="Brand" value={form.brandId} onChange={(v) => setForm({ ...form, brandId: v })} options={brands}
                onAdd={async (name) => {
                  const res = await fetch("/api/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
                  const d = await res.json();
                  if (!res.ok) throw new Error(d.error || "Failed to add brand");
                  setBrands((b) => [...b, d.brand].sort((a, c) => a.name.localeCompare(c.name)));
                  return d.brand;
                }}
              />
              <SelectWithAdd
                label="Category" value={form.categoryId} onChange={(v) => setForm({ ...form, categoryId: v })} options={categories}
                onAdd={async (name) => {
                  const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
                  const d = await res.json();
                  if (!res.ok) throw new Error(d.error || "Failed to add category");
                  setCategories((c) => [...c, d.category].sort((a, b) => a.name.localeCompare(b.name)));
                  return d.category;
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cost Price (₦)" type="number" value={form.costPrice} onChange={(v) => setForm({ ...form, costPrice: v })} required />
              <Field label="Selling Price (₦)" type="number" value={form.sellingPrice} onChange={(v) => setForm({ ...form, sellingPrice: v })} required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Quantity" type="number" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} required />
              <Field label="Reorder Level" type="number" value={form.reorderLevel} onChange={(v) => setForm({ ...form, reorderLevel: v })} />
              <Field label="Warranty (months)" type="number" value={form.warrantyMonths} onChange={(v) => setForm({ ...form, warrantyMonths: v })} />
            </div>
            <SelectWithAdd
              label="Supplier" value={form.supplierId} onChange={(v) => setForm({ ...form, supplierId: v })} options={suppliers}
              onAdd={async (name) => {
                const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
                const d = await res.json();
                if (!res.ok) throw new Error(d.error || "Failed to add supplier");
                setSuppliers((s) => [...s, d.supplier].sort((a, b) => a.name.localeCompare(b.name)));
                return d.supplier;
              }}
            />
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-[var(--line)] rounded-lg py-2.5 text-sm">Cancel</button>
              <button className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-lg py-2.5 text-sm font-medium">Save</button>
            </div>
          </form>
        </div>
      )}

      {scannerOpen && (
        <BarcodeScanner
          onDetected={(code) => setQ(code)}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </Shell>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--muted)] mb-1">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
      />
    </label>
  );
}

function SelectWithAdd({ label, value, onChange, options, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submitAdd() {
    if (!newName.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const created = await onAdd(newName.trim());
      onChange(String(created.id));
      setAdding(false);
      setNewName("");
    } catch (e) {
      setErr(e.message || "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="block text-xs font-medium text-[var(--muted)]">{label}</span>
        <button
          type="button"
          onClick={() => { setAdding((a) => !a); setErr(""); setNewName(""); }}
          className="text-xs text-[var(--brand)] hover:underline"
        >
          {adding ? "Cancel" : "+ Add new"}
        </button>
      </div>
      {!adding ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        >
          <option value="">—</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`New ${label.toLowerCase()} name`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitAdd();
              }
            }}
            className="flex-1 border border-[var(--line)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
          <button
            type="button"
            onClick={submitAdd}
            disabled={busy}
            className="px-3 py-2 text-sm bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white rounded-lg disabled:opacity-60"
          >
            {busy ? "…" : "Add"}
          </button>
        </div>
      )}
      {err && <p className="text-xs text-[var(--danger)] mt-1">{err}</p>}
    </div>
  );
}
