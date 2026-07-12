"use client";

import RolloverLink from "@/components/RolloverLink";

export default function WorkPage() {
  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#0a0a0a] flex flex-col items-center justify-center select-none">
      {/* Background decoration with subtle red radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,44,44,0.03)_0%,transparent_70%)] pointer-events-none" />

      {/* Title */}
      <h1 className="font-absans text-6xl sm:text-8xl md:text-9xl text-white tracking-tighter uppercase mb-8 relative z-10">
        Work<span className="text-[#FF2C2C]">.</span>
      </h1>

      {/* Back Link */}
      <div className="relative z-10 font-outfit text-lg tracking-wide uppercase font-normal">
        <RolloverLink href="/" label="BACK TO HOME" />
      </div>
    </div>
  );
}
