"use client";

import RolloverLink from "@/components/RolloverLink";

export default function ContactPage() {
  return (
    <main className="contact-page min-h-dvh w-full relative overflow-hidden bg-[#0a0a0a] flex flex-col items-center justify-center select-none px-6 py-12">
      {/* Background decoration with subtle red radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,44,44,0.03)_0%,transparent_70%)] pointer-events-none" />

      {/* Title */}
      <h1 className="font-absans text-[clamp(2.5rem,12vw,8rem)] text-white tracking-tighter uppercase mb-8 relative z-10">
        Contact<span className="text-[#FF2C2C]">.</span>
      </h1>

      {/* Back Link */}
      <div className="relative z-10 font-outfit text-lg tracking-wide uppercase font-normal">
        <RolloverLink href="/" label="BACK TO HOME" />
      </div>
    </main>
  );
}
