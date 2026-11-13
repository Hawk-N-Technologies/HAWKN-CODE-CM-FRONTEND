import QrScanner from "qr-scanner";
import { useEffect, useRef, useState } from "react";

/**
 * Camera QR scanner. The only file that knows about the `qr-scanner`
 * library, so it can be swapped without touching the packing screen.
 *
 * Props:
 *   active  - true to run the camera
 *   onScan  - called with the decoded text
 */
function describeCameraError(error) {
  const text = String(error?.name || error?.message || error || "");
  if (!window.isSecureContext) {
    return "The camera needs a secure (https://) address. Open the app with https.";
  }
  if (/NotAllowed|Permission|denied/i.test(text)) {
    return "Camera permission was denied. Allow the camera in your browser settings, or type the UID below.";
  }
  if (/not found|NotFound|no camera/i.test(text)) {
    return "No camera found on this device. Type the UID below.";
  }
  if (/NotReadable|in use/i.test(text)) {
    return "The camera is being used by another app. Close it and try again.";
  }
  return `Camera could not start (${text || "unknown error"}). Type the UID below.`;
}

export default function QrScannerView({ active, onScan }) {
  const videoRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [camera, setCamera] = useState({ state: "idle", message: "" });

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active || !videoRef.current) return undefined;
    let stopped = false;
    const scanner = new QrScanner(videoRef.current, (result) => onScanRef.current(result.data), {
      returnDetailedScanResult: true,
      preferredCamera: "environment",
      highlightScanRegion: true,
      highlightCodeOutline: true,
      maxScansPerSecond: 8,
      onDecodeError: () => {}, // "no QR in view" happens constantly; ignore it
    });
    scanner
      .start()
      .then(() => {
        if (!stopped) setCamera({ state: "running", message: "" });
      })
      .catch((error) => {
        if (!stopped) setCamera({ state: "error", message: describeCameraError(error) });
      });
    return () => {
      stopped = true;
      scanner.destroy();
      setCamera({ state: "idle", message: "" });
    };
  }, [active]);

  if (!active) return null;

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-cm-xl bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {camera.state !== "running" && camera.state !== "error" && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            Starting camera…
          </p>
        )}
      </div>
      {camera.state === "error" && (
        <p role="alert" className="mt-3 rounded-cm-md bg-cm-danger-100 px-4 py-3 text-sm font-medium text-cm-danger-600">
          {camera.message}
        </p>
      )}
    </div>
  );
}
