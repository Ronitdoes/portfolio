"use client";

import React, { useRef, useEffect, useState } from "react";

interface CanvasHandsProps {
  progressRef: React.RefObject<{ value: number }>;
}

interface Cell {
  char: string;
  r: number;
  g: number;
  b: number;
  a: number;
  tx: number; // Target x ratio (0.0 to 1.0)
  ty: number; // Target y ratio (0.0 to 1.0)
  x: number;  // Current x ratio
  y: number;  // Current y ratio
  hand: "left" | "right";
  col: number;
  row: number;
  highlight: number; // Intensity of hover (0.0 to 1.0)
  baseColorStr: string;
}

interface Ripple {
  cx: number;     // Center column of ripple
  cy: number;     // Center row of ripple
  radius: number; // Current radius in grid units
  maxRadius: number;
  speed: number;
  intensity: number;
}

export default function CanvasHands({ progressRef }: CanvasHandsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cellsRef = useRef<Cell[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRectRef = useRef<DOMRect | null>(null);

  // Animation states
  const animStateRef = useRef({
    handsMet: false,
    imageAlpha: 0,
    baseCharAlpha: 0.8,
    active: false,
    lastMouseGridX: -1,
    lastMouseGridY: -1,
  });

  const mouseRef = useRef({ x: -1000, y: -1000 });
  const parallaxTargetRef = useRef({ x: 0, y: 0 });
  const parallaxCurrentRef = useRef({ x: 0, y: 0 });

  // Grid Configuration
  const COLS = 160;
  const RAMP = " .:-=+*#%@";
  const GAP = 0.04; // Shift each hand outwards by 4.0% of width to add space between fingers
  const LEFT_PARALLAX_MULT = -2.0;
  const RIGHT_PARALLAX_MULT = 2.0;

  // Pre-load the image and extract pixels
  useEffect(() => {
    const img = new Image();
    img.src = "/adam-normal.png";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;

      // Calculate target rows based on aspect ratio
      const imgAspect = img.height / img.width;
      const rows = Math.floor(COLS * imgAspect);

      // Create an offscreen canvas to extract pixels
      const offscreen = document.createElement("canvas");
      offscreen.width = COLS;
      offscreen.height = rows;
      const ctx = offscreen.getContext("2d");

      if (!ctx) return;
      ctx.drawImage(img, 0, 0, COLS, rows);
      const imgData = ctx.getImageData(0, 0, COLS, rows);
      const data = imgData.data;

      const cells: Cell[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < COLS; c++) {
          const idx = (r * COLS + c) * 4;
          const rVal = data[idx];
          const gVal = data[idx + 1];
          const bVal = data[idx + 2];
          const aVal = data[idx + 3];

          // Filter out transparent pixels
          if (aVal < 40) continue;

          // Calculate character based on luminance
          const luminance = 0.299 * rVal + 0.587 * gVal + 0.114 * bVal;
          const charIdx = Math.floor((luminance / 255) * (RAMP.length - 1));
          const char = RAMP[charIdx];

          // Skip space characters to optimize rendering
          if (char === " ") continue;

          // Assign left or right hand
          const hand = c < COLS / 2 ? "left" : "right";

          // Target normalized positions (0.0 to 1.0 relative to hand bounds)
          const tx = c / COLS;
          const ty = r / rows;

          // Start hands offscreen horizontally
          const startX = hand === "left" ? tx - 1.2 : tx + 1.2;
          // Add slight vertical jitter for an organic entrance
          const startY = ty + (Math.random() - 0.5) * 0.12;

          cells.push({
            char,
            r: rVal,
            g: gVal,
            b: bVal,
            a: aVal,
            tx,
            ty,
            x: startX,
            y: startY,
            hand,
            col: c,
            row: r,
            highlight: 0,
            baseColorStr: `rgba(${rVal}, ${gVal}, ${bVal}, 0.8)`,
          });
        }
      }

      cellsRef.current = cells;
      setImageLoaded(true);
    };
  }, []);


  // Main canvas animation and layout loop
  useEffect(() => {
    if (!imageLoaded) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Track responsive sizes
    let canvasW = 0;
    let canvasH = 0;
    let handsW = 0;
    let handsH = 0;
    let xOffset = 0;
    let yOffset = 0;
    let fontSize = 10;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      canvasRectRef.current = rect;
      canvasW = rect.width;
      canvasH = rect.height;
      canvas.width = canvasW;
      canvas.height = canvasH;

      // Scale hands to cover the full width of the canvas (left to right corners)
      handsW = canvasW;
      handsH = handsW * (1024 / 1536); // maintain 3:2 ratio

      // Center vertically in viewport, aligned to the outer left/right margins
      xOffset = 0;
      yOffset = (canvasH - handsH) / 2;

      // Adjust font size dynamically to fill the grid cells nicely
      fontSize = Math.max(3.8, (handsW / COLS) * 1.7);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, canvasW, canvasH);

      const cells = cellsRef.current;
      const ripples = ripplesRef.current;
      const state = animStateRef.current;
      const mouse = mouseRef.current;

      const imgAspect = imageRef.current ? imageRef.current.height / imageRef.current.width : 1024 / 1536;
      const rows = Math.floor(COLS * imgAspect);

      // Evaluate window conditions once per frame instead of in a thousands-iteration loop
      const hoverRadius = window.innerWidth < 768 ? 50 : 80;
      const hoverRadiusSq = hoverRadius * hoverRadius;

      // --- 1. UPDATE STATE ---

      // Update parallax interpolation (smooth lerp)
      const pTarget = parallaxTargetRef.current;
      const pCurrent = parallaxCurrentRef.current;
      pCurrent.x += (pTarget.x - pCurrent.x) * 0.08;
      pCurrent.y += (pTarget.y - pCurrent.y) * 0.08;

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed;
        if (rip.radius > rip.maxRadius) {
          ripples.splice(i, 1);
        }
      }

      const progress = progressRef.current?.value ?? 0;

      // Update cells
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        // Calculate positions directly based on GSAP progress
        const offset = 1.2 * (1.0 - progress);
        const handShift = cell.hand === "left" ? -GAP : GAP;
        cell.x = (cell.hand === "left" ? cell.tx - offset : cell.tx + offset) + handShift * progress;

        // Subtle vertical swoop
        const vertOffset = (1.0 - progress) * 0.05;
        cell.y = cell.ty - vertOffset;

        // Apply mouse-vicinity direct highlight
        const parallaxMult = cell.hand === "left" ? LEFT_PARALLAX_MULT : RIGHT_PARALLAX_MULT;
        const cellScreenX = xOffset + cell.x * handsW + pCurrent.x * parallaxMult;
        const cellScreenY = yOffset + cell.y * handsH - pCurrent.y * Math.abs(parallaxMult);

        const dx = cellScreenX - mouse.x;
        const dy = cellScreenY - mouse.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < hoverRadiusSq) {
          const distToMouse = Math.sqrt(distSq);
          const force = 1.0 - distToMouse / hoverRadius;
          cell.highlight = Math.max(cell.highlight, force * 0.55);
        }

        // Apply ripple highlights
        for (let j = 0; j < ripples.length; j++) {
          const rip = ripples[j];
          const gridDx = cell.col - rip.cx;
          const gridDy = cell.row - rip.cy;
          
          // Quick bounding box check: skip math calculations if cell is outside max possible ripple radius
          const maxD = rip.radius + 1.2;
          if (Math.abs(gridDx) <= maxD && Math.abs(gridDy) <= maxD) {
            const gridDist = Math.sqrt(gridDx * gridDx + gridDy * gridDy);

            // Wave front check
            if (Math.abs(gridDist - rip.radius) < 1.2) {
              const rippleForce = rip.intensity * (1.0 - rip.radius / rip.maxRadius);
              cell.highlight = Math.max(cell.highlight, rippleForce);
            }
          }
        }

        // Decay hover highlight values over time
        cell.highlight *= 0.94;
        if (cell.highlight < 0.005) cell.highlight = 0;
      }

      // If progress reaches 1.0, transition is complete
      if (progress >= 0.999 && !state.handsMet) {
        state.handsMet = true;
      }

      if (state.handsMet) {
        state.baseCharAlpha = 0.8;
      }

      // --- 2. DRAWING ---

      // Draw ASCII characters
      ctx.font = `bold ${fontSize}px Consolas, "Courier New", monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        const parallaxMult = cell.hand === "left" ? LEFT_PARALLAX_MULT : RIGHT_PARALLAX_MULT;
        const cx = xOffset + cell.x * handsW + pCurrent.x * parallaxMult;
        const cy = yOffset + cell.y * handsH - pCurrent.y * Math.abs(parallaxMult);

        if (cell.highlight > 0) {
          // Highlight transitions color to vibrant portfolio red (#FF2C2C)
          const rFinal = Math.round(cell.r + (255 - cell.r) * cell.highlight);
          const gFinal = Math.round(cell.g + (44 - cell.g) * cell.highlight);
          const bFinal = Math.round(cell.b + (44 - cell.b) * cell.highlight);
          const opacity = state.baseCharAlpha + cell.highlight * (1.0 - state.baseCharAlpha);
          ctx.fillStyle = `rgba(${rFinal}, ${gFinal}, ${bFinal}, ${opacity})`;
        } else {
          // Use cached base color string to prevent building thousands of strings every frame
          ctx.fillStyle = cell.baseColorStr;
        }

        ctx.fillText(cell.char, cx, cy);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [imageLoaded]);

  // Track cursor position and spawn ripples globally on the window
  useEffect(() => {
    if (!imageLoaded) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let rect = canvasRectRef.current;
      if (!rect) {
        rect = canvas.getBoundingClientRect();
        canvasRectRef.current = rect;
      }
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      mouseRef.current = { x: mx, y: my };

      // Update parallax target (slight shift based on cursor's normalized coordinates)
      const nx = (mx / rect.width) * 2 - 1;
      const ny = (my / rect.height) * 2 - 1;
      parallaxTargetRef.current = { x: nx * 15, y: ny * 10 }; // Max shift: 15px X, 10px Y

      // Find center boundaries of hands
      const rectW = rect.width;
      const rectH = rect.height;
      const handsW = rectW;
      const handsH = handsW * (1024 / 1536);
      const xOffset = 0;
      const yOffset = (rectH - handsH) / 2;

      // Convert cursor coordinates to grid columns/rows, accounting for parallax and gap shifts
      const px = parallaxCurrentRef.current.x;
      const isLeft = mx < rectW / 2;
      const parallaxMult = isLeft ? LEFT_PARALLAX_MULT : RIGHT_PARALLAX_MULT;
      const handShift = isLeft ? GAP : -GAP;
      const col = Math.floor(((mx - px * parallaxMult - xOffset + handShift * handsW) / handsW) * COLS);
      const imgAspect = imageRef.current ? imageRef.current.height / imageRef.current.width : 1024 / 1536;
      const rows = Math.floor(COLS * imgAspect);
      const row = Math.floor(((my - yOffset) / handsH) * rows);

      // Spawn a ripple wave on crossing grid boundaries (throttled)
      if (col >= 0 && col < COLS && row >= 0 && row < rows) {
        const state = animStateRef.current;
        if (col !== state.lastMouseGridX || row !== state.lastMouseGridY) {
          ripplesRef.current.push({
            cx: col,
            cy: row,
            radius: 0,
            maxRadius: 18,
            speed: 0.55,
            intensity: 0.8,
          });

          if (ripplesRef.current.length > 6) {
            ripplesRef.current.shift();
          }

          state.lastMouseGridX = col;
          state.lastMouseGridY = row;
        }
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || e.touches.length === 0) return;

      let rect = canvasRectRef.current;
      if (!rect) {
        rect = canvas.getBoundingClientRect();
        canvasRectRef.current = rect;
      }
      const touch = e.touches[0];
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;

      mouseRef.current = { x: mx, y: my };

      // Update parallax target
      const nx = (mx / rect.width) * 2 - 1;
      const ny = (my / rect.height) * 2 - 1;
      parallaxTargetRef.current = { x: nx * 15, y: ny * 10 };

      // Same grid mapping for touch events
      const rectW = rect.width;
      const rectH = rect.height;
      const handsW = rectW;
      const handsH = handsW * (1024 / 1536);
      const xOffset = 0;
      const yOffset = (rectH - handsH) / 2;

      const px = parallaxCurrentRef.current.x;
      const isLeft = mx < rectW / 2;
      const parallaxMult = isLeft ? LEFT_PARALLAX_MULT : RIGHT_PARALLAX_MULT;
      const handShift = isLeft ? GAP : -GAP;
      const col = Math.floor(((mx - px * parallaxMult - xOffset + handShift * handsW) / handsW) * COLS);
      const imgAspect = imageRef.current ? imageRef.current.height / imageRef.current.width : 1024 / 1536;
      const rows = Math.floor(COLS * imgAspect);
      const row = Math.floor(((my - yOffset) / handsH) * rows);

      if (col >= 0 && col < COLS && row >= 0 && row < rows) {
        const state = animStateRef.current;
        if (col !== state.lastMouseGridX || row !== state.lastMouseGridY) {
          ripplesRef.current.push({
            cx: col,
            cy: row,
            radius: 0,
            maxRadius: 12, // slightly smaller ripple on mobile/touch
            speed: 0.6,
            intensity: 0.75,
          });

          if (ripplesRef.current.length > 6) {
            ripplesRef.current.shift();
          }

          state.lastMouseGridX = col;
          state.lastMouseGridY = row;
        }
      }
    };

    const handleGlobalMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
      animStateRef.current.lastMouseGridX = -1;
      animStateRef.current.lastMouseGridY = -1;
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: true });
    document.addEventListener("mouseleave", handleGlobalMouseLeave);
    window.addEventListener("touchend", handleGlobalMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("mouseleave", handleGlobalMouseLeave);
      window.removeEventListener("touchend", handleGlobalMouseLeave);
    };
  }, [imageLoaded]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-45 select-none bg-transparent"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-transparent"
      />
    </div>
  );
}
