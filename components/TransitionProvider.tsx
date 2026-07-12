"use client";

import { TransitionRouter } from "next-transition-router";
import { useRef } from "react";
import gsap from "gsap";

export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to map paths to page names
  const getPageName = (path: string) => {
    if (path === "/" || path === "") return "HOME";
    // Strip leading slash, take first segment, capitalize
    const name = path.split("/")[1] || "HOME";
    return name.toUpperCase();
  };

  return (
    <TransitionRouter
      auto
      leave={async (next, from, to) => {
        const rows = gsap.utils.toArray<HTMLElement>(".curtain-row");
        const container = containerRef.current;
        const textContainer = container?.querySelector(".curtain-text-container");

        if (container) {
          container.style.pointerEvents = "auto";
        }

        // 1. Programmatically generate the split text letters for the target page
        if (textContainer) {
          textContainer.innerHTML = "";
          
          let pageName = getPageName(to || "");
          if (pageName && !pageName.endsWith(".")) {
            pageName += ".";
          }

          const flexDiv = document.createElement("div");
          flexDiv.className = "flex flex-row overflow-hidden font-absans text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white tracking-tighter uppercase select-none";
          
          pageName.split("").forEach((char) => {
            const wrapper = document.createElement("span");
            wrapper.className = "inline-flex overflow-hidden py-2 px-1";
            
            const letter = document.createElement("span");
            letter.className = "curtain-char inline-block";
            letter.textContent = char === " " ? "\u00A0" : char;
            if (char === ".") {
              letter.className += " text-[#0a0a0a]";
            }
            
            // Initial state for split text
            gsap.set(letter, { yPercent: 110, opacity: 0 });
            
            wrapper.appendChild(letter);
            flexDiv.appendChild(wrapper);
          });
          
          textContainer.appendChild(flexDiv);
        }

        // 2. Build GSAP leave timeline
        const tl = gsap.timeline({
          onComplete: () => {
            next();
          }
        });

        // Set initial positions
        tl.set(rows, { x: "-100vw" });
        if (textContainer) {
          tl.set(textContainer, { opacity: 1 });
        }

        // Stagger slide-in of rows from left to right (top row 1 to bottom row 4)
        tl.to(rows, {
          x: "0vw",
          duration: 0.6,
          ease: "power3.inOut",
          stagger: 0.08,
        });

        // Animate the split text
        tl.to(".curtain-char", {
          yPercent: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.04,
        }, "-=0.15"); // start slightly before panels finish sliding in

        // Hold full curtain for a brief moment
        tl.to({}, { duration: 0.3 });
      }}
      enter={async (next) => {
        const rows = gsap.utils.toArray<HTMLElement>(".curtain-row");
        const container = containerRef.current;
        const textContainer = container?.querySelector(".curtain-text-container");

        const tl = gsap.timeline({
          onComplete: () => {
            if (container) {
              container.style.pointerEvents = "none";
            }
            next();
          }
        });

        // 1. Fade/slide out the page name text
        if (textContainer) {
          tl.to(textContainer, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.inOut",
          });
        }

        // 2. Reveal by sliding out to the right (left to right), staggered top to bottom (Row 1 -> Row 4)
        tl.to(rows, {
          x: "100vw",
          duration: 0.6,
          ease: "power3.inOut",
          stagger: 0.08,
        }, "-=0.15");
      }}
    >
      {/* Visual Curtain Overlay */}
      <div
        ref={containerRef}
        className="fixed inset-0 z-[9999] pointer-events-none select-none flex flex-col overflow-hidden"
      >
        <div className="curtain-row w-full h-[calc(25%+1.5px)] bg-[#FF2C2C]" style={{ transform: "translateX(-100vw)" }} />
        <div className="curtain-row w-full h-[calc(25%+1.5px)] bg-[#FF2C2C]" style={{ transform: "translateX(-100vw)" }} />
        <div className="curtain-row w-full h-[calc(25%+1.5px)] bg-[#FF2C2C]" style={{ transform: "translateX(-100vw)" }} />
        <div className="curtain-row w-full h-[calc(25%+1.5px)] bg-[#FF2C2C]" style={{ transform: "translateX(-100vw)" }} />

        {/* Centered text container */}
        <div className="curtain-text-container absolute inset-0 flex items-center justify-center pointer-events-none z-[10000]" />
      </div>

      {children}
    </TransitionRouter>
  );
}
