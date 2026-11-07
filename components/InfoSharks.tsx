"use client";

import { useEffect, useRef } from "react";
import { OceanEngine } from "@/lib/ascii-sharks/engine";

export default function InfoSharks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new OceanEngine(canvasRef.current, [
      { kind: "classic", size: 1.2 },
      { kind: "hammerhead", size: 1.05 },
      { kind: "tiger", size: 0.95 },
      { kind: "classic", size: 0.85 },
      { kind: "hammerhead", size: 0.75 },
    ]);
    return () => engine.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full font-mono opacity-70"
    />
  );
}
