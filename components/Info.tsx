"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import RolloverLink from "./RolloverLink";
import InfoSharks from "./InfoSharks";

gsap.registerPlugin(useGSAP);

const EMAIL = "ronitdoeswork@gmail.com";

const META = [
  { label: "BASED IN", value: "Jaipur, India" },
  { label: "STUDYING", value: "B.Tech CSE, Manipal Jaipur" },
  { label: "STATUS", value: "Open to collabs & internships" },
];

const SKILLS = [
  {
    title: "FRONTEND",
    items: ["HTML / CSS", "JavaScript", "TypeScript", "React · Next.js", "Tailwind"],
  },
  {
    title: "ANIMATION & 3D",
    items: ["GSAP", "Framer Motion", "Three.js", "WebGL / Canvas", "SVG animation"],
  },
  {
    title: "BACKEND",
    items: ["Node.js · Express", "REST APIs", "PostgreSQL", "Supabase", "Redis"],
  },
  {
    title: "TOOLS & INFRA",
    items: ["Linux · WSL2", "Git · GitHub", "Vercel", "Railway · Render", "Vite"],
  },
];

export default function Info() {
  const containerRef = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Entrance — quiet, editorial, in the same motion language as the site.
        const tl = gsap.timeline({
          delay: 0.15,
          defaults: { ease: "power3.out" },
        });

        tl.from(".info-heading", { y: -22, autoAlpha: 0, duration: 0.9 }, 0)
          .from(".info-back", { y: -16, autoAlpha: 0, duration: 0.8 }, 0.08)
          .fromTo(
            ".info-photo-frame",
            { clipPath: "inset(0% 0% 100% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.15,
              ease: "power4.inOut",
            },
            0.12
          )
          .from(
            ".info-photo-media",
            { scale: 1.55, duration: 1.4, ease: "power3.out" },
            0.12
          )
          .from(
            ".info-crosshair",
            { autoAlpha: 0, scale: 0.4, duration: 0.45, stagger: 0.06 },
            0.78
          )
          .from(
            ".info-reveal",
            {
              y: 26,
              autoAlpha: 0,
              filter: "blur(9px)",
              duration: 0.9,
              stagger: 0.1,
            },
            0.26
          )
          .from(
            ".info-meta-row",
            { y: 14, autoAlpha: 0, duration: 0.65, stagger: 0.08 },
            "-=0.42"
          )
          .from(
            ".info-skill-col",
            { y: 18, autoAlpha: 0, duration: 0.7, stagger: 0.07 },
            "-=0.5"
          )
          .from(".info-footer", { y: 14, autoAlpha: 0, duration: 0.8 }, "-=0.25");

        return () => tl.kill();
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <main
      ref={containerRef}
      className="info-page relative flex min-h-svh w-full flex-col overflow-hidden bg-black text-white selection:bg-[#FF2C2C] selection:text-white"
    >
      <InfoSharks />

      <div className="info-content relative z-10 mx-auto flex w-full max-w-[1920px] flex-1 flex-col px-6 pb-5 pt-8 sm:px-10 md:pb-6 md:pt-12 lg:px-14 lg:pb-5 lg:pt-14">
        {/* Header */}
        <header className="flex items-start justify-between">
          <h1 className="info-heading font-absans text-[clamp(3.25rem,6vw,5.1rem)] font-normal leading-[0.86] tracking-[-0.045em] text-white">
            Info
          </h1>

          <div className="pt-2 md:pt-3">
            <RolloverLink
              href="/"
              label="BACK"
              className="info-back text-[12px] font-medium uppercase tracking-[0.16em] [&_.rollover-default]:text-white md:text-[13px]"
            />
          </div>
        </header>

        {/* Content */}
        <div className="info-body mt-12 flex flex-1 flex-col gap-14 md:mt-16 lg:mt-[4.75rem] lg:grid lg:grid-cols-[clamp(280px,22vw,400px)_minmax(0,1fr)] lg:items-start lg:gap-16 xl:gap-20">
          {/* Portrait + details */}
          <aside className="w-full max-w-[420px] lg:max-w-none">
            <figure className="info-photo-frame group relative aspect-[4/5] w-full overflow-hidden bg-black lg:aspect-auto lg:h-[min(472px,44svh)]">
              <img
                src="/me.jpg"
                alt="Portrait of Ronit Mahajan"
                className="info-photo-media absolute inset-0 h-full w-full scale-[1.32] object-cover object-[50%_28%]"
                loading="eager"
                draggable={false}
              />

              <span className="info-crosshair pointer-events-none absolute left-3.5 top-3 select-none font-mono text-[11px] font-light leading-none text-white/70">
                +
              </span>
              <span className="info-crosshair pointer-events-none absolute right-3.5 top-3 select-none font-mono text-[11px] font-light leading-none text-white/70">
                +
              </span>
              <span className="info-crosshair pointer-events-none absolute bottom-3 left-3.5 select-none font-mono text-[11px] font-light leading-none text-white/70">
                +
              </span>
              <span className="info-crosshair pointer-events-none absolute bottom-3 right-3.5 select-none font-mono text-[11px] font-light leading-none text-white/70">
                +
              </span>
            </figure>

            <dl className="mt-6 divide-y divide-white/15 border-t border-white/15">
              {META.map((row) => (
                <div
                  key={row.label}
                  className="info-meta-row flex items-center justify-between gap-3 py-3.5 sm:gap-6"
                >
                  <dt className="shrink-0 font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-white/45">
                    {row.label}
                  </dt>
                  <dd className="min-w-0 text-right font-absans text-[15px] leading-snug text-white/95 md:text-[16px]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>

          {/* About */}
          <section aria-labelledby="about-name" className="min-w-0 lg:pt-4">
            <div className="info-reveal">
              <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.22em] text-white/45">
                ABOUT
              </p>
              <h2
                id="about-name"
                className="mt-4 font-absans text-[clamp(2rem,10vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.045em] text-white lg:mt-3 lg:text-[clamp(3.75rem,6.4vw,6.6rem)]"
              >
                Ronit Mahajan<span className="text-[#FF2C2C]">.</span>
              </h2>
            </div>

            <p className="info-reveal mt-5 max-w-[40ch] font-absans text-[clamp(1.15rem,1.9vw,1.65rem)] leading-[1.35] text-white/95 md:mt-6 lg:mt-5">
              Creative developer &amp; computer science student, building
              thoughtful full-stack web experiences.
            </p>

            <div className="info-reveal mt-7 max-w-[66ch] space-y-5 font-absans text-[16px] leading-[1.65] text-white/80 md:mt-8 md:text-[18px] lg:mt-7">
              <p>
                I build tailor-made web experiences where clean engineering
                meets considered design.
              </p>
              <p>
                Passionate about animation, interaction and{" "}
                <em className="font-serif italic text-white/90">detail</em>, I
                enjoy owning the whole journey — from the interface in the
                browser to the infrastructure behind it.
              </p>
            </div>

            <div className="info-skills info-reveal mt-10 border-t border-white/15 pt-6 md:mt-12 lg:mt-10">
              <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-8 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 xl:gap-x-6">
                {SKILLS.map((group) => (
                  <div key={group.title} className="info-skill-col">
                    <h3 className="font-mono text-[9.5px] font-medium uppercase tracking-[0.2em] text-white/45">
                      {group.title}
                    </h3>
                    <ul className="mt-4 space-y-1.5 font-absans text-[15.5px] leading-[1.55] text-white/90 md:text-[16.5px]">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="info-footer mt-auto flex items-end justify-between gap-6 pt-12 md:pt-14 lg:pt-6">
          <RolloverLink
            href={`mailto:${EMAIL}`}
            label={EMAIL}
            isLowercase
            className="text-[16px] tracking-[-0.01em] [&_.rollover-default]:text-white md:text-[19px]"
          />
        </footer>
      </div>
    </main>
  );
}
