"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import RolloverLink from "./RolloverLink";
import CanvasHands from "./CanvasHands";

// Register the useGSAP plugin
gsap.registerPlugin(useGSAP);

// Track whether the landing page intro/preloader has already run in the current session
let hasPlayedLandingIntro = false;

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handsProgressRef = useRef({ value: 0 });
  const bgOverlayRef = useRef<HTMLDivElement>(null);
  const titleWrapperRef = useRef<HTMLDivElement>(null);
  const wordRonitRef = useRef<HTMLSpanElement>(null);
  const wordMahajanRef = useRef<HTMLSpanElement>(null);
  const spacerRef = useRef<HTMLSpanElement>(null);

  // Refs for the swipe panels
  const redWipeRef = useRef<HTMLDivElement>(null);
  const blackWipeRef = useRef<HTMLDivElement>(null);

  // Ref for the header
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // 1. Select the letters inside our scoped container
    const ronitLetters = gsap.utils.toArray<HTMLElement>(".ronit-letter");
    const mahajanLetters = gsap.utils.toArray<HTMLElement>(".mahajan-letter");

    if (ronitLetters.length === 0 || mahajanLetters.length === 0) return;

    // Calculate layout values dynamically at run-time:
    const isDesktop = window.innerWidth >= 768;
    const targetScale = isDesktop ? 2.0 : 1.45;
    const targetY = isDesktop ? "41vh" : "43vh";

    // Target side margins in pixels (padding from screen edges)
    const sideMargin = isDesktop ? 40 : 16; // 40px on desktop, 16px on mobile

    // Measured widths of the two words at scale 1
    const w1 = wordRonitRef.current?.offsetWidth || 0;
    const w2 = wordMahajanRef.current?.offsetWidth || 0;
    const screenW = window.innerWidth;

    // Calculate target spacer width in pixels (divided by targetScale to offset container scaling)
    const targetSpacer = Math.max(16, (screenW - (w1 * targetScale) - (w2 * targetScale) - (sideMargin * 2)) / targetScale);

    // If the intro has already played, set all elements to their final states immediately and exit
    if (hasPlayedLandingIntro) {
      gsap.set([ronitLetters, mahajanLetters], {
        yPercent: 0,
        skewY: 0,
        scaleY: 1.12,
        autoAlpha: 1,
      });
      gsap.set(headerRef.current, {
        y: 0,
        opacity: 1,
      });
      gsap.set(bgOverlayRef.current, {
        autoAlpha: 0,
      });
      gsap.set(titleWrapperRef.current, {
        y: targetY,
        scale: targetScale,
      });
      gsap.set(spacerRef.current, {
        width: targetSpacer,
      });
      gsap.set(redWipeRef.current, {
        yPercent: 100,
      });
      gsap.set(blackWipeRef.current, {
        yPercent: 100,
      });
      
      const fullStop = mahajanLetters[7];
      if (fullStop) {
        gsap.set(fullStop, {
          color: "#FF2C2C",
        });
      }

      handsProgressRef.current.value = 1;
      return;
    }

    // 2. Define the exact custom reveal orders
    // Ronit: T -> I -> N -> O -> R (Indices: 4, 3, 2, 1, 0)
    const ronitOrder = [4, 3, 2, 1, 0].map(idx => ronitLetters[idx]);

    // Mahajan: M -> A -> H -> A -> J -> A -> N -> . (Indices: 0, 1, 2, 3, 4, 5, 6, 7)
    const mahajanOrder = [0, 1, 2, 3, 4, 5, 6, 7].map(idx => mahajanLetters[idx]);

    // 3. Set the starting states
    gsap.set([ronitLetters, mahajanLetters], {
      yPercent: 115,
      skewY: 8,
      scaleY: 1.12, // vertical stretch
      autoAlpha: 0,
      transformOrigin: "left bottom",
    });

    // Start header shifted up and hidden
    gsap.set(headerRef.current, {
      y: -20,
      opacity: 0,
    });

    // 4. Build the continuous animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        hasPlayedLandingIntro = true;
      }
    });

    // Separate timelines for each word running in parallel
    const tlRonit = gsap.timeline();
    const tlMahajan = gsap.timeline();

    // Populate Ronit timeline: reveals backwards (T -> I -> N -> O -> R)
    ronitOrder.forEach((letter, index) => {
      tlRonit.to(letter, {
        yPercent: 0,
        skewY: 0,
        scaleY: 1.12,
        autoAlpha: 1,
        duration: 0.7,
        ease: "power4.out",
      }, index * 0.09); // stagger interval
    });

    // Populate Mahajan timeline: reveals forwards (M -> A -> H -> A -> J -> A -> N -> .)
    mahajanOrder.forEach((letter, index) => {
      tlMahajan.to(letter, {
        yPercent: 0,
        skewY: 0,
        scaleY: 1.12,
        autoAlpha: 1,
        duration: 0.7,
        ease: "power4.out",
      }, index * 0.09); // stagger interval
    });

    // Run both word timelines in parallel at starting time 0
    tl.add(tlRonit, 0);
    tl.add(tlMahajan, 0);

    // After letters assemble in the center:
    // 1. Fade out the initial preloader black background overlay & shift text to the bottom
    tl.to(bgOverlayRef.current, {
      autoAlpha: 0,
      duration: 0.6,
      ease: "power2.inOut",
    }, "+=0.45"); // hold the assembled name for 0.45s

    tl.to(titleWrapperRef.current, {
      y: targetY,
      scale: targetScale,
      duration: 0.95,
      ease: "power4.inOut",
    }, "<"); // animate concurrently with overlay fade-out

    tl.to(spacerRef.current, {
      width: targetSpacer,
      duration: 0.95,
      ease: "power4.inOut",
    }, "<"); // expand spacer concurrently to push words to edges

    // 2. Run curtains transition AFTER the bottom slide-down is complete
    // - Swipe up the Red rectangle box panel (sweeps up from bottom and covers viewport)
    tl.fromTo(redWipeRef.current,
      { yPercent: 100 },
      {
        yPercent: 0,
        duration: 0.55,
        ease: "power3.inOut",
      },
      "-=0.3" // start 0.3s before bottom animation completes
    );

    const fullStop = mahajanLetters[7];
    if (fullStop) {
      tl.to(fullStop, {
        color: "#000000",
        duration: 0.55,
        ease: "power3.inOut",
      }, "<");
    }

    // - Swipe up the Black rectangle box panel to cover the red curtain (starts 0.1s after red completes)
    tl.fromTo(blackWipeRef.current,
      { yPercent: 100 },
      {
        yPercent: 0,
        duration: 0.55,
        ease: "power3.inOut",
      },
      "+=0.1" // hold red curtain for exactly 0.1s before black curtain starts
    );

    if (fullStop) {
      tl.to(fullStop, {
        color: "#FF2C2C",
        duration: 0.55,
        ease: "power3.inOut",
      }, "<");
    }

    // - Tween the ASCII hands progress on the same timeline
    tl.to(handsProgressRef.current, {
      value: 1,
      duration: 2.2,
      ease: "power3.out",
    }, "-=0.4");

    // - Fade in the header details at the same time as the ASCII hands
    tl.to(headerRef.current, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: "power2.out",
    }, "<"); // "<" syncs this tween's start with the start of the previous hands progress tween
  }, { scope: containerRef });

  // Word character arrays
  const wordRonit = "Ronit".split("");
  const wordMahajan = "Mahajan.".split("");

  return (
    <div
      ref={containerRef}
      className="h-screen w-full relative overflow-hidden bg-[#0a0a0a] flex items-center justify-center select-none"
    >
      {/* Initial preloader black background overlay */}
      <div
        ref={bgOverlayRef}
        className="absolute inset-0 bg-black z-20 pointer-events-auto"
      />

      {/* Swipe Overlay Panels */}
      {/* 1. Red wipe curtain */}
      <div
        ref={redWipeRef}
        className="fixed inset-0 bg-[#FF2C2C] z-30 pointer-events-none"
      />
      {/* 2. Black wipe curtain */}
      <div
        ref={blackWipeRef}
        className="fixed inset-0 bg-[#0a0a0a] z-40 pointer-events-none"
      />

      {/* Interactive ASCII Hands */}
      <CanvasHands progressRef={handsProgressRef} />

      {/* Header Info Bar */}
      <header
        ref={headerRef}
        className="absolute top-0 inset-x-0 z-50 flex flex-row justify-between items-start pt-8 md:pt-12 px-6 md:px-10 text-[14px] md:text-[17px] font-medium tracking-wide text-white uppercase select-none opacity-0"
        style={{ fontFamily: "var(--font-outfit), sans-serif" }}
      >
        {/* Left Column: Email & Year */}
        <div className="flex flex-col gap-[2px] text-left leading-normal font-normal">
          <RolloverLink href="mailto:ronitdoeswork@gmail.com" label="ronitdoeswork@gmail.com" isLowercase={true} />
          <span className="opacity-50 font-normal px-[2px] pt-[2px]">© 2026</span>
        </div>

        {/* Middle Column: Social Links */}
        <div className="flex flex-col gap-[2px] text-left leading-normal font-normal">
          <RolloverLink href="https://github.com/Ronitdoes" label="GITHUB" target="_blank" rel="noopener noreferrer" />
          <RolloverLink href="https://linkedin.com/in/ronit-mahajan" label="LINKEDIN" target="_blank" rel="noopener noreferrer" />
          <RolloverLink href="https://x.com/RonitMahajan6" label="X/TWITTER" target="_blank" rel="noopener noreferrer" />
        </div>

        {/* Right Column: Navigation */}
        <div className="flex flex-col gap-[2px] text-left leading-normal font-normal">
          <RolloverLink href="/work" label="WORK" />
          <RolloverLink href="/info" label="INFO" />
          <RolloverLink href="/contact" label="CONTACT" />
        </div>
      </header>

      {/* Main title text container (z-50 to stay on top of the curtains) */}
      <div
        ref={titleWrapperRef}
        className="flex flex-row items-center font-absans tracking-tighter text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-white text-center z-50 px-0 origin-bottom whitespace-nowrap"
      >
        {/* Ronit Word */}
        <span ref={wordRonitRef} className="flex flex-row whitespace-nowrap">
          {wordRonit.map((char, index) => (
            <span key={`r-${index}`} className="inline-flex overflow-hidden pt-4 pb-1 px-[2.5px]">
              <span className="ronit-letter inline-block opacity-0">
                {char}
              </span>
            </span>
          ))}
        </span>

        {/* Dynamic Spacer */}
        <span
          ref={spacerRef}
          className="inline-block flex-none"
          style={{ width: "1.1em" }}
        />

        {/* Mahajan Word */}
        <span ref={wordMahajanRef} className="flex flex-row whitespace-nowrap">
          {wordMahajan.map((char, index) => (
            <span key={`m-${index}`} className="inline-flex overflow-hidden pt-4 pb-1 px-[2.5px]">
              <span className={`mahajan-letter inline-block opacity-0 ${char === "." ? "text-[#FF2C2C]" : ""}`}>
                {char}
              </span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
