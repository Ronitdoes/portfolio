"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Observer } from "gsap/Observer";
import RolloverLink from "./RolloverLink";
import CanvasHands from "./CanvasHands";

// Scrubbed frame sequence inside the reveal box (120 frames, ~9.7MB total)
const FRAME_COUNT = 120;
const FRAME_BASE = "/ezgif-47d5d9e8e7ec8ee7-jpg/ezgif-frame-";
const frameUrl = (i: number) =>
  `${FRAME_BASE}${String(i).padStart(3, "0")}.jpg`;

// Tagline revealed inside the box (Absans from public/fonts, loaded as --font-absans)
const TAGLINE = "i like to build stuff.";
let _tagIdx = 0;
const TAGLINE_WORDS = TAGLINE.split(" ").map((w) =>
  w.split("").map((ch) => ({ ch, li: _tagIdx++ }))
);
const TAGLINE_COUNT = _tagIdx;
const TAGLINE_START = 0.7; // box scale at which letters start appearing
const TAGLINE_END = 0.97; // box scale at which all letters are fully in
const TAGLINE_LETTER_DUR = 0.07;

// Register plugins
gsap.registerPlugin(useGSAP, Observer);

// Track whether the landing page intro/preloader has already run in the current session
let hasPlayedLandingIntro = false;

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handsProgressRef = useRef({ value: 0 });
  const handsExitRef = useRef({ value: 0 });
  const bgOverlayRef = useRef<HTMLDivElement>(null);
  const titleWrapperRef = useRef<HTMLDivElement>(null);
  const wordRonitRef = useRef<HTMLSpanElement>(null);
  const wordMahajanRef = useRef<HTMLSpanElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const centerRevealRef = useRef<HTMLDivElement>(null);
  const boxImgRef = useRef<HTMLImageElement>(null);
  const frameIdxRef = useRef(0);
  const boxTextLettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  // About page (slides up after the box goes fullscreen, scroll range 1 -> 2)
  const aboutSectionRef = useRef<HTMLElement>(null);
  const aboutLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const aboutPhotoRef = useRef<HTMLImageElement>(null);
  const aboutPhotoWrapRef = useRef<HTMLDivElement>(null);
  const aboutFadeRefs = useRef<(HTMLElement | null)[]>([]);
  const boxAnchorRef = useRef({ x: 0 });
  const crosshairsRef = useRef<HTMLSpanElement>(null);

  // Refs for the swipe panels
  const redWipeRef = useRef<HTMLDivElement>(null);
  const blackWipeRef = useRef<HTMLDivElement>(null);

  // Ref for the header
  const headerRef = useRef<HTMLElement>(null);

  // Background-preload the box frame sequence (in order, so early frames
  // needed first are cached first). Frame 001 is already eager via <img>.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      for (let i = 2; i <= FRAME_COUNT; i++) {
        if (cancelled) break;
        const img = new Image();
        img.src = frameUrl(i);
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useGSAP(() => {
    // 1. Select the letters inside our scoped container
    const ronitLetters = gsap.utils.toArray<HTMLElement>(".ronit-letter");
    const mahajanLetters = gsap.utils.toArray<HTMLElement>(".mahajan-letter");

    if (ronitLetters.length === 0 || mahajanLetters.length === 0) return;

    // Helper to calculate responsive layout values dynamically
    const getLayoutValues = () => {
      const isDesktop = window.innerWidth >= 768;
      const targetScale = isDesktop ? 2.0 : 1.45;
      const targetY = isDesktop ? "41vh" : "43vh";
      const sideMargin = isDesktop ? 40 : 16;
      const w1 = wordRonitRef.current?.offsetWidth || 0;
      const w2 = wordMahajanRef.current?.offsetWidth || 0;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const targetSpacer = Math.max(16, (screenW - (w1 * targetScale) - (w2 * targetScale) - (sideMargin * 2)) / targetScale);
      const centerScale = isDesktop ? 1.0 : 0.95;
      const centerSpacer = isDesktop ? 22 : 14;

      // Because transformOrigin is "center bottom", scaling up by targetScale shifts the visual center upward by (targetScale - 1) * titleH / 2.
      // We offset centerY downward to bring the optical center of the text to the exact vertical center of the screen.
      const titleH = titleWrapperRef.current?.offsetHeight || (isDesktop ? 116 : 76);
      const opticalPaddingDiff = (16 - 4) / 2; // pt-4 (16px) vs pb-1 (4px)
      const centerY = Math.round(((targetScale - 1) * titleH) / 2 - (opticalPaddingDiff * (targetScale - 1)));

      // Final visual width needed to push words fully past screen edges
      // (spacer lives inside the scaled title, so divide by targetScale).
      // Must ALSO cover the word-width asymmetry: the gap center sits left of
      // screen center by O = (w2-w1)/2*scale, so the right (wider) word needs
      // an extra (w2-w1)*scale of gap to get its inner edge past the viewport.
      const finalVisualW = Math.ceil(Math.max(screenW, screenH * (16 / 9)));
      const asymVisual = Math.max(0, w2 - w1) * targetScale;
      const breathing = isDesktop ? 96 : 64;
      const neededVisual = finalVisualW + asymVisual + breathing;
      const expandedSpacer = Math.ceil(neededVisual / targetScale);

      // Asymmetry measure: "Ronit" is narrower than "Mahajan.", so the spacer
      // gap sits left of screen center by (w1-w2)/2*scale. The NAME is never
      // moved — instead the box anchors to the gap (see boxAnchorRef).
      // xComp = shift that *would* center the gap; box home x = -xComp.
      // (GSAP x is screen px, so multiply by targetScale.)
      const xComp = ((w2 - w1) / 2) * targetScale;

      return {
        isDesktop,
        targetScale,
        targetY,
        targetSpacer,
        centerScale,
        centerSpacer,
        centerY,
        expandedSpacer,
        xComp,
      };
    };

    const initialLayout = getLayoutValues();
    const { targetScale, targetY, targetSpacer } = initialLayout;

    let targetProgress = 0;
    let currentProgress = 0;
    const scrollProxy = { progress: 0 };
    const boxProxy = { progress: 0 };
    let scrollTween: gsap.core.Tween | null = null;
    let boxTween: gsap.core.Tween | null = null;

    // 2. Build the scroll timeline for frame-by-frame scrubbing
    const scrollTl = gsap.timeline({
      paused: true,
      defaults: {
        ease: "none",
      }
    });

    const buildScrollTimeline = (prog = 0) => {
      const layout = getLayoutValues();
      scrollTl.clear();

      // Anchor the box home position to the actual gap center (name untouched).
      boxAnchorRef.current.x = -layout.xComp;

      // --- PHASE 1 (time 0.0 -> 1.0): Bringing name from bottom to center ---
      // Animate hands away: left moves to left edge, right moves to right edge
      scrollTl.fromTo(handsExitRef.current,
        { value: 0 },
        { value: 1, duration: 1, ease: "none" },
        0
      );

      // Animate title wrapper from bottom (targetY) up to exact vertical center (centerY).
      // Name stays fixed horizontally (x: 0) — never shifted.
      scrollTl.fromTo(titleWrapperRef.current,
        { y: layout.targetY, x: 0 },
        { y: layout.centerY, x: 0, duration: 1, ease: "none" },
        0
      );

      // Fade out header details as the name moves to the center
      scrollTl.fromTo(headerRef.current,
        { autoAlpha: 1, y: 0 },
        { autoAlpha: 0, y: -15, duration: 0.8, ease: "power2.out" },
        0
      );

      // Spacer holds its targetSpacer throughout Phase 1
      scrollTl.fromTo(spacerRef.current,
        { width: layout.targetSpacer },
        { width: layout.targetSpacer, duration: 1, ease: "none" },
        0
      );

      // NOTE: centerReveal box + crosshairs are NOT in the scrub timeline.
      // They are driven separately by boxProxy with extra smoothing lag
      // (see applyBoxScale / smoothScrollTo) so the box trails the scroll
      // slightly for a softer, delayed feel.

      // --- PHASE 2 (time 1.0 -> 2.0): words split — same feel as Phase 1 ---
      // Single constant-velocity tween with ease "none", exactly like the
      // Phase 1 title move.
      scrollTl.to(spacerRef.current,
        {
          width: layout.expandedSpacer,
          duration: 0.9,
          ease: "none",
        },
        1.0
      );

      scrollTl.progress(prog);
    };

    // Box scrub with extra smoothing lag: maps global scroll 0..1 to box
    // scale 0..1 across the Phase-2 window (progress 0.55..1.0). The box
    // starts centered on the NAME GAP (not screen center — the name is never
    // moved) and drifts to screen center as it reaches fullscreen, so it
    // expands concentrically with the split and never slides under letters.
    const applyBoxScale = (p: number) => {
      const t = gsap.utils.clamp(0, 1, (p - 0.55) / 0.45);
      const homeX = boxAnchorRef.current.x;
      // NOTE: yPercent is owned by applyAbout (scroll-through handoff), so it
      // is intentionally left untouched here.
      gsap.set(centerRevealRef.current, {
        scale: t,
        x: homeX * (1 - t),
        xPercent: -50,
      });
      // Scrub frames from the very beginning: t 0 -> 1 maps to frames 001 -> 120
      // (scrubs both scroll directions).
      const idx = Math.round(t * (FRAME_COUNT - 1));
      if (idx !== frameIdxRef.current) {
        frameIdxRef.current = idx;
        const el = boxImgRef.current;
        if (el) el.src = frameUrl(idx + 1);
      }
      // Tagline: letter-by-letter blur-in across box scale 0.7 -> 0.97
      // (scrubs both directions with the box).
      const stag =
        TAGLINE_COUNT > 1
          ? (TAGLINE_END - TAGLINE_START - TAGLINE_LETTER_DUR) /
            (TAGLINE_COUNT - 1)
          : 0;
      // Exit leg (scroll range 1 -> 2, from the lagged proxy): frames + tagline
      // blur out as the box scrolls away, like the reference transition.
      const apBox = gsap.utils.clamp(0, 1, p - 1);
      const exitBlur = apBox * 14;
      const tagFade = gsap.utils.clamp(0, 1, 1 - apBox * 1.6);
      const boxImg = boxImgRef.current;
      if (boxImg) gsap.set(boxImg, { filter: `blur(${exitBlur}px)` });
      for (let i = 0; i < TAGLINE_COUNT; i++) {
        const el = boxTextLettersRef.current[i];
        if (!el) continue;
        const li = gsap.utils.clamp(
          0,
          1,
          (t - (TAGLINE_START + i * stag)) / TAGLINE_LETTER_DUR
        );
        gsap.set(el, {
          autoAlpha: li * tagFade,
          y: (1 - li) * 16,
          filter: `blur(${(1 - li) * 12 + exitBlur}px)`,
        });
      }
      let o = 0;
      if (t <= 0.05) o = 0;
      else if (t < 0.3) o = 0.75 * ((t - 0.05) / 0.25);
      else if (t < 0.7) o = 0.75;
      else if (t < 0.95) o = 0.75 * (1 - (t - 0.7) / 0.25);
      else o = 0;
      gsap.set(crosshairsRef.current, { autoAlpha: o });
    };

    // Scroll range 0 -> 1 is the hero (name + box); 1 -> 2 slides the About
    // page up over the fullscreen box. Everything scrubs reversibly.
    const ABOUT_MAX = 2;

    const applyAbout = (p: number) => {
      const ap = gsap.utils.clamp(0, 1, p - 1);
      const sec = aboutSectionRef.current;
      if (sec) {
        gsap.set(sec, {
          yPercent: (1 - ap) * 100,
          autoAlpha: ap <= 0 ? 0 : 1,
        });
        sec.style.pointerEvents = ap > 0.6 ? "auto" : "none";
      }
      // Scroll-through handoff: the fullscreen box slides up and out at the
      // same rate the About page slides in (both linear in ap), so frames
      // visibly scroll away instead of being covered.
      if (centerRevealRef.current) {
        gsap.set(centerRevealRef.current, { yPercent: -50 - ap * 100 });
      }
      // Seam smudge: ramps in right as fullscreen settles into the exit
      // (p 0.97 -> 1.04) and stays fully melted after that.
      // (Mask-only: no tint overlay, so the image keeps full color.)
      const meltT = gsap.utils.clamp(0, 1, (p - 0.97) / 0.07);
      const im = boxImgRef.current;
      if (im) {
        const meltS = 130 - 90 * meltT;
        const meltE = 150 - 54 * meltT;
        const melt = `linear-gradient(to bottom, black ${meltS}%, transparent ${meltE}%)`;
        im.style.maskImage = melt;
        (im.style as unknown as Record<string, string>).webkitMaskImage = melt;
      }
      // Headline lines stagger in over ap 0.15 -> 0.85
      const n = aboutLineRefs.current.length;
      for (let i = 0; i < n; i++) {
        const el = aboutLineRefs.current[i];
        if (!el) continue;
        const li = gsap.utils.clamp(0, 1, (ap - (0.15 + i * 0.1)) / 0.3);
        gsap.set(el, {
          autoAlpha: li,
          y: (1 - li) * 44,
          filter: `blur(${(1 - li) * 8}px)`,
        });
      }
      // Portrait settles (de-zoom + de-blur + counter-scroll parallax) over ap 0.05 -> 0.9:
      // the image drifts DOWN (yPercent -10 -> 0) while the page slides UP.
      const pt = gsap.utils.clamp(0, 1, (ap - 0.1) / 0.8);
      if (aboutPhotoRef.current) {
        gsap.set(aboutPhotoRef.current, {
          scale: 1.35 - 0.35 * pt,
          yPercent: -22 * (1 - pt),
          filter: `blur(${(1 - pt) * 8}px)`,
        });
      }
      if (aboutPhotoWrapRef.current) {
        gsap.set(aboutPhotoWrapRef.current, { yPercent: (1 - pt) * 6 });
      }
      // Bio + INFO link fade in over ap 0.5 -> 0.85 (with de-blur)
      const fi = gsap.utils.clamp(0, 1, (ap - 0.5) / 0.35);
      aboutFadeRefs.current.forEach((el) => {
        if (!el) return;
        gsap.set(el, {
          autoAlpha: fi,
          y: (1 - fi) * 20,
          filter: `blur(${(1 - fi) * 6}px)`,
        });
      });
    };

    const smoothScrollTo = (target: number, duration?: number) => {
      targetProgress = Math.max(0, Math.min(ABOUT_MAX, target));

      const distance = Math.abs(targetProgress - scrollProxy.progress);
      const computedDuration = duration ?? gsap.utils.clamp(0.45, 0.95, 0.45 + distance * 1.1);

      if (scrollTween) {
        scrollTween.kill();
      }
      if (boxTween) {
        boxTween.kill();
      }

      scrollTween = gsap.to(scrollProxy, {
        progress: targetProgress,
        duration: computedDuration,
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => {
          currentProgress = scrollProxy.progress;
          scrollTl.progress(Math.min(currentProgress, 1));
          applyAbout(currentProgress);
        },
      });

      // Box follows the same target but much slower + softer (extra lag/smoothness).
      boxTween = gsap.to(boxProxy, {
        progress: targetProgress,
        duration: gsap.utils.clamp(1.8, 3.2, computedDuration + 1.6),
        ease: "expo.out",
        overwrite: "auto",
        onUpdate: () => {
          applyBoxScale(boxProxy.progress);
        },
      });
    };

    let observerInstance: Observer | null = null;

    const enableScrollInteraction = () => {
      if (observerInstance) return;

      buildScrollTimeline(currentProgress);
      scrollProxy.progress = currentProgress;
      boxProxy.progress = currentProgress;
      applyBoxScale(currentProgress);
      applyAbout(currentProgress);

      observerInstance = Observer.create({
        target: window,
        type: "wheel,touch",
        tolerance: 0,
        preventDefault: false,
        onChangeY: (self) => {
          // Scroll depth per zone: Phase 1 keeps the quick 1600px track, the
          // box zone uses 3400px for a long frame scrub, and the About page
          // slides up on a 2200px track.
          const scrollDistance =
            targetProgress > 1 ? 2200 : targetProgress > 0.5 ? 3400 : 1600;
          const delta = self.deltaY / scrollDistance;
          smoothScrollTo(targetProgress + delta);
        },
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!observerInstance) return;
      // Finer steps in the deeper zones for matching depth.
      const step =
        targetProgress > 1 ? 0.07 : targetProgress > 0.5 ? 0.05 : 0.1;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        smoothScrollTo(targetProgress + step);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        smoothScrollTo(targetProgress - step);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleResize = () => {
      if (observerInstance) {
        const layout = getLayoutValues();
        gsap.set(titleWrapperRef.current, { scale: layout.targetScale });
        buildScrollTimeline(currentProgress);
        scrollProxy.progress = currentProgress;
        boxProxy.progress = currentProgress;
        applyBoxScale(currentProgress);
        applyAbout(currentProgress);
      }
    };
    window.addEventListener("resize", handleResize);

    // If the intro has already played, set all elements to their final states immediately and enable scroll
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
      gsap.set(redWipeRef.current, {
        yPercent: 100,
      });
      gsap.set(blackWipeRef.current, {
        yPercent: 100,
      });
      gsap.set(titleWrapperRef.current, {
        y: targetY,
        x: 0,
        scale: targetScale,
      });
      gsap.set(spacerRef.current, {
        width: targetSpacer,
      });
      gsap.set(centerRevealRef.current, {
        scale: 0,
        x: -initialLayout.xComp,
        xPercent: -50,
        yPercent: -50,
        autoAlpha: 1,
        transformOrigin: "50% 50%",
      });
      gsap.set(aboutSectionRef.current, {
        yPercent: 100,
        autoAlpha: 0,
      });
      gsap.set(crosshairsRef.current, {
        autoAlpha: 0,
      });
      
      const fullStop = mahajanLetters[7];
      if (fullStop) {
        gsap.set(fullStop, {
          color: "#FF2C2C",
        });
      }

      handsProgressRef.current.value = 1;
      handsExitRef.current.value = 0;
      targetProgress = 0;
      buildScrollTimeline(0);
      boxProxy.progress = 0;
      applyBoxScale(0);
      applyAbout(0);

      enableScrollInteraction();
      return () => {
        observerInstance?.kill();
        scrollTween?.kill();
        boxTween?.kill();
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("resize", handleResize);
      };
    }

    // 3. Define the exact custom reveal orders
    // Ronit: T -> I -> N -> O -> R (Indices: 4, 3, 2, 1, 0)
    const ronitOrder = [4, 3, 2, 1, 0].map(idx => ronitLetters[idx]);

    // Mahajan: M -> A -> H -> A -> J -> A -> N -> . (Indices: 0, 1, 2, 3, 4, 5, 6, 7)
    const mahajanOrder = [0, 1, 2, 3, 4, 5, 6, 7].map(idx => mahajanLetters[idx]);

    // 4. Set the starting states
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

    // Start center reveal parked on the name gap (scale zero point)
    gsap.set(centerRevealRef.current, {
      scale: 0,
      x: -initialLayout.xComp,
      xPercent: -50,
      yPercent: -50,
      autoAlpha: 1,
      transformOrigin: "50% 50%",
    });
    // About page starts parked below the viewport, invisible
    gsap.set(aboutSectionRef.current, {
      yPercent: 100,
      autoAlpha: 0,
    });
    gsap.set(crosshairsRef.current, {
      autoAlpha: 0,
    });

    // 5. Build the continuous animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        hasPlayedLandingIntro = true;
        enableScrollInteraction();
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
      x: 0,
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

    return () => {
      observerInstance?.kill();
      scrollTween?.kill();
      boxTween?.kill();
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
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
      <CanvasHands progressRef={handsProgressRef} exitProgressRef={handsExitRef} />

      {/* Header Info Bar */}
      <header
        ref={headerRef}
        className="absolute top-0 inset-x-0 z-50 flex flex-row justify-between items-start pt-8 md:pt-12 px-6 md:px-10 text-[14px] md:text-[17px] font-medium tracking-wide text-white uppercase select-none opacity-0"
        style={{ fontFamily: "var(--font-absans), sans-serif" }}
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

        {/* Dynamic Spacer (empty — only pushes words apart) */}
        <div
          ref={spacerRef}
          className="inline-flex items-center justify-center flex-none relative overflow-visible"
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

      {/* Center-starting fullscreen reveal — fixed to the exact viewport center.
          scale 0 = a single point at screen center, scale 1 = full screen.
          Lives OUTSIDE the scaled title wrapper so asymmetric word widths
          ("Ronit" vs "Mahajan.") can never offset it from the center. */}
      <div
        ref={centerRevealRef}
        className="fixed left-1/2 top-1/2 w-screen h-screen z-40 overflow-hidden bg-black pointer-events-none opacity-0 invisible"
        style={{ transformOrigin: "50% 50%" }}
      >
        {/* The First Frame Image from public/ezgif-47d5d9e8e7ec8ee7-jpg (scrubbed on scroll) */}
        <img
          ref={boxImgRef}
          src="/ezgif-47d5d9e8e7ec8ee7-jpg/ezgif-frame-001.jpg"
          alt="Sculpture Reveal"
          className="w-full h-full object-cover select-none pointer-events-none block scale-[1.06]"
          loading="eager"
          draggable={false}
        />

        {/* Tagline inside the box — letter-by-letter blur-in driven by box scale.
            Absans (public/fonts, --font-absans). Letters start hidden (opacity-0)
            so there is no flash before the scrub takes over. */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none select-none px-6">
          <p className="font-absans text-white text-center leading-[1.05] tracking-tight text-[clamp(2.2rem,7vw,6.5rem)] [text-shadow:0_2px_40px_rgba(0,0,0,0.65)] flex flex-wrap justify-center gap-x-[0.32em]">
            {TAGLINE_WORDS.map((word, wi) => (
              <span key={wi} className="inline-flex whitespace-nowrap">
                {word.map(({ ch, li }) => (
                  <span
                    key={li}
                    ref={(el) => {
                      boxTextLettersRef.current[li] = el;
                    }}
                    className={`inline-block opacity-0 ${ch === "." ? "text-[#FF2C2C]" : ""}`}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </p>
        </div>

        {/* Viewfinder corner crosshairs (+) matching Luke Baffait */}
        <span
          ref={crosshairsRef}
          className="absolute inset-0 pointer-events-none select-none opacity-0"
        >
          <span className="absolute top-1.5 left-2 text-[9px] font-mono text-white/70 leading-none">
            +
          </span>
          <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-white/70 leading-none">
            +
          </span>
          <span className="absolute top-1.5 right-2 text-[9px] font-mono text-white/70 leading-none">
            +
          </span>
          <span className="absolute bottom-1.5 right-2 text-[9px] font-mono text-white/70 leading-none">
            +
          </span>
        </span>
      </div>

      {/* About page — slides up over the fullscreen box (scroll range 1 -> 2).
          Portrait: save your photo as public/me.jpg */}
      <section
        ref={aboutSectionRef}
        aria-label="About"
        className="absolute inset-0 z-[60] bg-[#0a0a0a] opacity-0 invisible overflow-hidden"
        style={{ pointerEvents: "none" }}
      >
        {/* Faint red glow melting up from the bottom-right, like the reference */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_85%_100%,rgba(255,44,44,0.14),transparent_60%)]" />
        <div className="relative h-full w-full flex flex-col md:flex-row">
          {/* Left: statement + bio — positions mirror the reference:
              headline top-left, bio mid at 22% indent, INFO beneath it */}
          <div className="relative flex-1 flex flex-col px-6 md:px-0 pt-8 md:pt-[4vh] pb-4 md:pb-6 min-h-0">
            <h2 className="font-absans text-white tracking-tight leading-[1.18] text-[clamp(1.6rem,4vw,3.4rem)] md:pl-[4vw]">
              <span
                ref={(el) => {
                  aboutLineRefs.current[0] = el;
                }}
                className="block opacity-0"
              >
                As a{" "}
                <em className="font-serif italic font-normal">
                  creative developer
                </em>
                , I craft
              </span>
              <span
                ref={(el) => {
                  aboutLineRefs.current[1] = el;
                }}
                className="block opacity-0"
              >
                tailor-made web experiences,
              </span>
              <span
                ref={(el) => {
                  aboutLineRefs.current[2] = el;
                }}
                className="block opacity-0"
              >
                blending technical precision and
              </span>
              <span
                ref={(el) => {
                  aboutLineRefs.current[3] = el;
                }}
                className="block opacity-0"
              >
                <em className="font-serif italic font-normal">emotion</em>
                <span className="text-[#FF2C2C]">.</span>
              </span>
            </h2>
            <div className="flex flex-col gap-3 mt-auto md:ml-[60%] md:max-w-[40ch] md:pb-[8vh]">
              <p
                ref={(el) => {
                  aboutFadeRefs.current[0] = el;
                }}
                className="opacity-0 text-white/85 leading-[1.9] text-[clamp(1rem,1.5vw,1.35rem)]"
                style={{ fontFamily: "var(--font-absans), sans-serif" }}
              >
                My name is Ronit. A passionate creator and developer, I build
                memorable digital experiences — always seeking the symbiosis
                between design and technology.
              </p>
              <div
                ref={(el) => {
                  aboutFadeRefs.current[1] = el;
                }}
                className="opacity-0 mt-3 md:mt-6 text-[14px] md:text-[17px] font-medium tracking-wide uppercase"
                style={{ fontFamily: "var(--font-absans), sans-serif" }}
              >
                <RolloverLink href="/info" label="INFO" />
              </div>
            </div>
          </div>

          {/* Right: portrait in arch mask — bleeds top/right/bottom on desktop,
              curve only on the left edge like the reference */}
          <div className="relative shrink-0 h-[30vh] md:h-full md:w-[42%] px-6 md:px-0 pb-5 md:pb-0 flex justify-center md:justify-end items-stretch">
            <div
              ref={aboutPhotoWrapRef}
              className="relative w-full max-w-[440px] md:max-w-none md:w-full h-full overflow-hidden rounded-t-[999px] md:rounded-t-none md:rounded-l-[999px] bg-[#141414] bg-[radial-gradient(circle_at_50%_20%,rgba(255,44,44,0.22),transparent_70%)]"
            >
              <span className="absolute inset-0 flex items-center justify-center font-absans text-white/20 text-7xl select-none">
                R.
              </span>
              <img
                ref={aboutPhotoRef}
                src="/me.jpg"
                alt="Portrait of Ronit Mahajan"
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
