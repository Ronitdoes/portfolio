"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register the useGSAP plugin
gsap.registerPlugin(useGSAP);

interface RolloverLinkProps {
  href: string;
  label: string;
  className?: string;
  target?: string;
  rel?: string;
  isLowercase?: boolean;
}

export default function RolloverLink({
  href,
  label,
  className = "",
  target,
  rel,
  isLowercase = false,
}: RolloverLinkProps) {
  const containerRef = useRef<HTMLAnchorElement>(null);
  const letters = label.split("");

  useGSAP(() => {
    if (!containerRef.current) return;

    const defaultChars = containerRef.current.querySelectorAll(".rollover-char");
    const hoverChars = containerRef.current.querySelectorAll(".rollover-char-hover");

    // Set starting position for hover text
    gsap.set(hoverChars, { yPercent: 100 });

    const handleMouseEnter = () => {
      gsap.to(defaultChars, {
        yPercent: -100,
        duration: 0.22,
        ease: "power2.inOut",
        stagger: 0.01,
        overwrite: "auto",
      });
      gsap.to(hoverChars, {
        yPercent: 0,
        duration: 0.22,
        ease: "power2.inOut",
        stagger: 0.01,
        overwrite: "auto",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(defaultChars, {
        yPercent: 0,
        duration: 0.22,
        ease: "power2.inOut",
        stagger: 0.01,
        overwrite: "auto",
      });
      gsap.to(hoverChars, {
        yPercent: 100,
        duration: 0.22,
        ease: "power2.inOut",
        stagger: 0.01,
        overwrite: "auto",
      });
    };

    const element = containerRef.current;
    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, { scope: containerRef });

  return (
    <a
      ref={containerRef}
      href={href}
      target={target}
      rel={rel}
      className={`rollover-link relative inline-flex overflow-hidden pt-[2px] pb-[2px] cursor-pointer ${
        isLowercase ? "lowercase font-normal" : ""
      } ${className}`}
    >
      {/* Default text view (zinc gray) */}
      <span className="rollover-default inline-flex flex-row text-zinc-400">
        {letters.map((char, i) => (
          <span key={i} className="rollover-char inline-block">
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>

      {/* Hover text view (White) */}
      <span
        className={`rollover-hover absolute left-0 top-[2px] inline-flex flex-row text-white ${
          isLowercase ? "lowercase" : ""
        }`}
      >
        {letters.map((char, i) => (
          <span key={i} className="rollover-char-hover inline-block">
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>
    </a>
  );
}
