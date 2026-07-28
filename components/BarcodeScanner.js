"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Full-screen camera barcode scanner.
 * Props:
 *  - onDetected(code): called each time a barcode is decoded (debounced against repeats)
 *  - onClose(): called when the user closes the scanner
 *  - continuous: if true, keeps scanning after a detection (for POS, scan several items in a row);
 *                if false, calls onClose() automatically after the first successful scan.
 */
export default function BarcodeScanner({ onDetected, onClose, continuous = false }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const lastCodeRef = useRef({ code: null, at: 0 });
  const [error, setError] = useState("");
  const [lastScanned, setLastScanned] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const controls = await reader.decodeFromVideoDevice(
          undefined, // let the browser pick the default camera (rear camera preferred on phones)
          videoRef.current,
          (result) => {
            if (!result) return;
            const code = result.getText();
            const now = Date.now();
            // Ignore the exact same code if it fired again within the last 2s
            // (the camera keeps "seeing" the same barcode across many frames).
            if (lastCodeRef.current.code === code && now - lastCodeRef.current.at < 2000) {
              return;
            }
            lastCodeRef.current = { code, at: now };
            setLastScanned(code);
            onDetected(code);
            if (!continuous) {
              controls?.stop();
              onClose();
            }
          }
        );
        controlsRef.current = controls;
      } catch (err) {
        console.error("Barcode scanner error:", err);
        if (err?.name === "NotAllowedError") {
          setError("Camera access was denied. Allow camera permission and try again.");
        } else if (err?.name === "NotFoundError") {
          setError("No camera was found on this device.");
        } else {
          setError("Could not start the camera. You can still type the barcode instead.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--charcoal)] text-white">
        <span className="text-sm font-medium">Scan a barcode</span>
        <button
          onClick={onClose}
          aria-label="Close scanner"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div className="relative flex-1 bg-black overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {!error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4/5 max-w-xs aspect-[2/1] border-2 border-[var(--brand)] rounded-lg" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <p className="text-white text-sm text-center">{error}</p>
          </div>
        )}
        {lastScanned && continuous && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--good)] text-white text-sm px-4 py-2 rounded-full">
            Scanned: {lastScanned}
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-[var(--charcoal)] text-white/60 text-xs text-center">
        Point the camera at a barcode — it scans automatically.
      </div>
    </div>
  );
}
