
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";
import jsQR from "jsqr";

export default function QRCodeScanner({ onResult }: { onResult: (value: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Always request camera permission on mount (all devices)
    async function requestCameraPermission() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (e) {
        setError("Camera permission is required. Please allow access in your device settings.");
      }
    }
    requestCameraPermission();
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      startScanning();
    } catch (e) {
      setError("Unable to access camera. Please allow camera permissions.");
    }
  }


  function scanFrame() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) { // HAVE_CURRENT_DATA
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        if (streaming) stopCamera();
        const value = code.data;
        if (/^https?:\/\//i.test(value)) {
          window.open(value, '_blank');
        } else {
          onResult(value);
        }
        return;
      }
      // No QR found, just continue scanning (no error)
      animationRef.current = requestAnimationFrame(scanFrame);
    } catch (e) {
      setError("Camera or decoding error. Please try again.");
    }
  }

  function startScanning() {
    setScanning(true);
    animationRef.current = requestAnimationFrame(scanFrame);
  }

  function stopCamera() {
    const mediaStream = videoRef.current?.srcObject as MediaStream | undefined;
    mediaStream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setScanning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/40 dark:border-white/10 bg-black/80">
  <video ref={videoRef} className="size-full object-cover" playsInline muted />
  <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="size-48 sm:size-64 md:size-80 rounded-2xl border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)_inset] relative overflow-hidden">
            {/* Scanning line effect */}
            {scanning && (
              <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scanline" style={{ top: 0, animationDuration: '1.5s' }} />
            )}
          </div>
        </div>
// Add scanline animation to global styles if not present
        {!streaming && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={startCamera} size="lg" className="btn-gradient text-white rounded-full px-6">
              <Camera className="mr-2" /> Start Camera
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={streaming ? stopCamera : startCamera} className="rounded-full">
          {streaming ? <><CameraOff className="mr-2"/> Stop</> : <><Camera className="mr-2"/> Start</>}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <ManualEntry onSubmit={onResult} />
    </div>
  );
}

function ManualEntry({ onSubmit }: { onSubmit: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
      className="flex flex-col sm:flex-row gap-2 sm:items-center"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste or type QR value"
        className="flex-1 rounded-xl border bg-background/80 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button type="submit" className="rounded-xl">Submit</Button>
    </form>
  );
}
