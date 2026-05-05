/**
 * QrScannerDialog
 *
 * Architecture:
 *   Camera (getUserMedia)
 *     ↓
 *   Video stream  (<video> element)
 *     ↓
 *   Frame capture  (requestAnimationFrame → offscreen canvas)
 *     ↓
 *   Try BarcodeDetector  (native, Chrome/Edge/Safari)
 *     ↓ fallback
 *   Try html5-qrcode scanFile  (Firefox / older browsers)
 *     ↓
 *   Return decoded value
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CameraOff, ScanLine, CheckCircle2, RefreshCw } from "lucide-react";

/* ─── BarcodeDetector type shim (not in all TS libs yet) ─── */
interface DetectedBarcode {
  rawValue: string;
  format: string;
}
interface IBarcodeDetector {
  detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorCtor {
  new(options?: { formats: string[] }): IBarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
}
declare global {
  interface Window { BarcodeDetector?: BarcodeDetectorCtor; }
}

/* ─── Props ────────────────────────────────────────────────── */
interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
}

type ScanState = "starting" | "scanning" | "scanned" | "error";

/* ─── Helpers ───────────────────────────────────────────────── */

/**
 * Normalises whatever the QR encodes into a plain voucher code string.
 * Handles: plain "VS-XXXXXXXX", plain "XXXXXXXX",
 *          URL "?code=VS-…", JSON {"code":"…"}
 */
function extractCode(raw: string): string {
  const text = raw.trim();
  try {
    const p = JSON.parse(text);
    if (p?.code) return String(p.code);
    if (p?.voucher_code) return String(p.voucher_code);
  } catch { /* not JSON */ }
  try {
    const url = new URL(text);
    const param = url.searchParams.get("code") ?? url.searchParams.get("voucher");
    if (param) return param;
    const m = url.pathname.match(/([A-Z0-9-]{6,20})$/i);
    if (m) return m[1];
  } catch { /* not a URL */ }
  return text;
}

/** Convert a canvas to a File — used by the html5-qrcode fallback. */
function canvasToFile(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("canvas.toBlob failed")); return; }
      resolve(new File([blob], "frame.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.85);
  });
}

/* ─── Hidden div id used only by html5-qrcode constructor ───── */
const H5Q_ELEMENT_ID = "qr-h5q-offscreen-mount";

/* ─── Component ─────────────────────────────────────────────── */
export function QrScannerDialog({ open, onOpenChange, onScan }: QrScannerDialogProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);    // offscreen, not rendered
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number>(0);
  const activeRef   = useRef(false);                      // guards async rAF loop

  // Native BarcodeDetector instance (created once, reused)
  const detectorRef = useRef<IBarcodeDetector | null>(null);
  // html5-qrcode instance for the fallback path (created once, reused)
  const h5qRef      = useRef<Html5Qrcode | null>(null);

  const [scanState, setScanState] = useState<ScanState>("starting");
  const [scannedCode, setScannedCode] = useState("");
  const [errorMsg, setErrorMsg]   = useState("");

  /* ── 1. One-time setup: create native detector + h5q fallback ── */
  useEffect(() => {
    // Create the hidden div html5-qrcode needs for its constructor
    const div = document.createElement("div");
    div.id = H5Q_ELEMENT_ID;
    div.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
    document.body.appendChild(div);

    h5qRef.current = new Html5Qrcode(H5Q_ELEMENT_ID, { verbose: false });

    if (window.BarcodeDetector) {
      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
    }

    // Create a persistent offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width  = 480;
    canvas.height = 480;
    (canvasRef as React.MutableRefObject<HTMLCanvasElement>).current = canvas;

    return () => {
      document.body.removeChild(div);
      h5qRef.current = null;
      detectorRef.current = null;
    };
  }, []);

  /* ── 2. Stop camera stream & rAF ───────────────────────────── */
  const stopCamera = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /* ── 3. Core detection: one canvas frame → BarcodeDetector → html5-qrcode ── */
  const detectFrame = useCallback(async (): Promise<void> => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!activeRef.current || !video || !canvas || video.readyState < 2) {
      if (activeRef.current) rafRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    // Capture frame → canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let decoded: string | null = null;

    // ── Path A: native BarcodeDetector ──────────────────────
    if (detectorRef.current) {
      try {
        const results = await detectorRef.current.detect(canvas);
        if (results.length > 0) decoded = results[0].rawValue;
      } catch {
        /* single-frame failure — fall through to path B */
      }
    }

    // ── Path B: html5-qrcode scanFile fallback ───────────────
    if (!decoded && h5qRef.current) {
      try {
        const file   = await canvasToFile(canvas);
        decoded = await h5qRef.current.scanFile(file, /* showImage */ false);
      } catch {
        /* no QR found in this frame */
      }
    }

    // ── Result ───────────────────────────────────────────────
    if (decoded && activeRef.current) {
      activeRef.current = false;                // stop the loop
      setScannedCode(extractCode(decoded));
      setScanState("scanned");
      return;
    }

    // Schedule next frame only if still active
    if (activeRef.current) {
      rafRef.current = requestAnimationFrame(detectFrame);
    }
  }, []);

  /* ── 4. Start: getUserMedia → attach stream → rAF loop ───── */
  const startCamera = useCallback(async () => {
    stopCamera();
    activeRef.current = true;
    setScanState("starting");
    setScannedCode("");
    setErrorMsg("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg(
        "Camera access is not available. Ensure the page is served over HTTPS and you are using a modern browser."
      );
      setScanState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });

      if (!activeRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();

      setScanState("scanning");

      // Kick off the frame-detection loop
      rafRef.current = requestAnimationFrame(detectFrame);
    } catch (err: any) {
      if (!activeRef.current) return;
      const name: string = err?.name ?? "";
      const msg: string  = err?.message ?? String(err);
      const denied = name === "NotAllowedError" || msg.toLowerCase().includes("denied");
      setErrorMsg(
        denied
          ? "Camera permission denied. Please allow camera access in your browser settings and tap Try Again."
          : `Camera error: ${msg || "unknown"}`
      );
      setScanState("error");
    }
  }, [stopCamera, detectFrame]);

  /* ── 5. Lifecycle: open/close ─────────────────────────────── */
  useEffect(() => {
    if (open) {
      // Brief delay lets the dialog enter-animation finish before camera starts
      const t = setTimeout(startCamera, 200);
      return () => clearTimeout(t);
    } else {
      stopCamera();
      const t = setTimeout(() => {
        setScanState("starting");
        setScannedCode("");
        setErrorMsg("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open, startCamera, stopCamera]);

  /* ── 6. Actions ───────────────────────────────────────────── */
  const handleConfirm = () => {
    onScan(scannedCode);
    onOpenChange(false);
  };

  const displayCode = scannedCode.startsWith("VS-") ? scannedCode : `VS-${scannedCode}`;

  /* ── 7. Render ────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <ScanLine className="h-4 w-4 text-primary" />
            Scan Voucher QR Code
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Point the camera at the customer's voucher QR code.
          </DialogDescription>
        </DialogHeader>

        {/* ── Camera viewport ────────────────────────────────── */}
        <div className="relative w-full bg-black" style={{ aspectRatio: "1 / 1" }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            autoPlay
          />

          {/* Starting */}
          {scanState === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <p className="text-white text-sm">Starting camera…</p>
            </div>
          )}

          {/* Scanning — finder overlay */}
          {scanState === "scanning" && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/40" />
              {/* Finder box */}
              <div
                className="absolute"
                style={{
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 240, height: 240,
                }}
              >
                {/* Corner brackets */}
                {(["tl", "tr", "bl", "br"] as const).map((c) => (
                  <span
                    key={c}
                    className="absolute w-8 h-8 border-primary"
                    style={{
                      borderWidth: 3,
                      ...(c === "tl" && { top: 0, left: 0, borderRight: "none", borderBottom: "none", borderRadius: "4px 0 0 0" }),
                      ...(c === "tr" && { top: 0, right: 0, borderLeft: "none",  borderBottom: "none", borderRadius: "0 4px 0 0" }),
                      ...(c === "bl" && { bottom: 0, left: 0, borderRight: "none", borderTop: "none",  borderRadius: "0 0 0 4px" }),
                      ...(c === "br" && { bottom: 0, right: 0, borderLeft: "none", borderTop: "none",  borderRadius: "0 0 4px 0" }),
                    }}
                  />
                ))}
                {/* Animated scan line */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_6px_hsl(var(--primary))]"
                  style={{ animation: "scanline 2s ease-in-out infinite" }}
                />
              </div>
              <p className="absolute bottom-5 left-0 right-0 text-center text-white/80 text-xs">
                Align QR code within the frame
              </p>
            </div>
          )}

          {/* Scanned — confirmation */}
          {scanState === "scanned" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 gap-4 px-4 animate-fade-in">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/20 border-2 border-primary">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm mb-2">QR Code Detected</p>
                <Badge variant="secondary" className="font-mono text-sm tracking-widest px-4 py-1.5">
                  {displayCode}
                </Badge>
              </div>
            </div>
          )}

          {/* Error */}
          {scanState === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 px-6 text-center">
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-destructive/20 border-2 border-destructive">
                <CameraOff className="h-7 w-7 text-destructive" />
              </div>
              <p className="text-white text-sm leading-relaxed">{errorMsg}</p>
              <Button size="sm" variant="outline" onClick={startCamera} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* ── Footer actions ──────────────────────────────────── */}
        <div className="flex gap-2 px-6 pb-5 pt-1">
          {scanState === "scanned" ? (
            <>
              <Button variant="outline" className="flex-1" onClick={startCamera}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-scan
              </Button>
              <Button className="flex-1 gap-2" onClick={handleConfirm}>
                <CheckCircle2 className="h-4 w-4" />
                Confirm Redeem
              </Button>
            </>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
