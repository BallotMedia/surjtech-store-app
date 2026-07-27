"use client";
import { useEffect, useRef, useState } from "react";
import { naira } from "@/lib/format";

export default function Receipt({ sale, settings, onClose }) {
  const { items, discount, total, customerPhone, customerName } = sale;
  const receiptNo = sale.sale?.receiptNo || sale.receiptNo;
  const date = sale.sale?.createdAt ? new Date(sale.sale.createdAt) : new Date();
  const receiptRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [fileReady, setFileReady] = useState(null); // pre-rendered File, ready before the user clicks Share
  const [preparing, setPreparing] = useState(true);

  async function renderToFile() {
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(receiptRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Canvas produced no image data");
    return new File([blob], `receipt-${receiptNo}.png`, { type: "image/png" });
  }

  // Pre-render the receipt image as soon as it's shown, so clicking Share
  // fires navigator.share() immediately (some browsers reject share() if it
  // happens too long after the click that triggered it).
  useEffect(() => {
    let cancelled = false;
    setPreparing(true);
    renderToFile()
      .then((file) => {
        if (!cancelled) setFileReady(file);
      })
      .catch((err) => {
        console.error("Receipt image pre-render failed:", err);
      })
      .finally(() => {
        if (!cancelled) setPreparing(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function shareReceipt() {
    setShareError("");
    setSharing(true);
    try {
      let file = fileReady;
      if (!file) {
        // Wasn't ready yet (slow device/network) — render now as a fallback.
        file = await renderToFile();
      }

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt ${receiptNo}`,
          text: `${settings?.businessName || "Surjtech"} — Receipt ${receiptNo}`,
        });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Share failed:", err);
      if (err?.name !== "AbortError") {
        setShareError(`Could not share the receipt (${err?.message || err?.name || "unknown error"}). Try Print instead.`);
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center p-4 z-50 receipt-modal-overlay"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close receipt"
          className="no-print absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.1)] text-[var(--muted)] hover:text-[var(--ink)] text-lg leading-none"
        >
          ✕
        </button>
        <div className="overflow-y-auto">
          <div id="receipt-print" ref={receiptRef} className="p-6 font-mono text-xs bg-white">
          <div className="text-center mb-3">
            <img src={settings?.logoUrl || "/logo.jpg"} alt="logo" className="w-14 h-14 rounded-full object-cover mx-auto mb-2" />
            <div className="font-bold text-sm">{settings?.businessName || "Surjtech"}</div>
            {settings?.address && <div>{settings.address}</div>}
            {settings?.phone && <div>{settings.phone}</div>}
            {settings?.receiptHeader && <div className="mt-1 italic">{settings.receiptHeader}</div>}
          </div>
          <div className="border-t border-dashed border-[rgba(0,0,0,0.3)] my-2" />
          <div>Receipt: {receiptNo}</div>
          <div>Date: {date.toLocaleString()}</div>
          {(customerName || customerPhone) && <div>Customer: {customerName || ""} {customerPhone || ""}</div>}
          <div className="border-t border-dashed border-[rgba(0,0,0,0.3)] my-2" />
          {items.map((i, idx) => (
            <div key={idx} className="flex justify-between mb-1">
              <span>{i.quantity} x {i.name}</span>
              <span>{naira(i.unitPrice * i.quantity - Number(i.lineDiscount || 0))}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-[rgba(0,0,0,0.3)] my-2" />
          {discount > 0 && (
            <div className="flex justify-between"><span>Discount</span><span>-{naira(discount)}</span></div>
          )}
          <div className="flex justify-between font-bold text-sm">
            <span>Total</span><span>{naira(total)}</span>
          </div>
          <div className="border-t border-dashed border-[rgba(0,0,0,0.3)] my-2" />
          <div className="text-center mt-3">{settings?.receiptFooter || "Thank you for shopping with us!"}</div>
        </div>
        </div>
        {shareError && <p className="px-4 text-xs text-[var(--danger)] no-print">{shareError}</p>}
        <div className="flex gap-2 p-4 border-t border-[var(--line)] no-print">
          <button
            onClick={shareReceipt}
            disabled={sharing}
            className="flex-1 border border-[var(--brand)] text-[var(--brand)] rounded-lg py-2 text-sm font-medium disabled:opacity-60"
          >
            {sharing ? "Sharing…" : "Share"}
          </button>
          <button onClick={() => window.print()} className="flex-1 bg-[var(--brand)] text-white rounded-lg py-2 text-sm font-medium">Print</button>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
