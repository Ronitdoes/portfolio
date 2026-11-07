"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Observer } from "gsap/Observer";
import RolloverLink from "./RolloverLink";
import { projects } from "@/lib/projects";

gsap.registerPlugin(useGSAP, Observer);

export default function WorkReel() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const focusCardRef = useRef<((card: HTMLElement) => void) | null>(null);

  useGSAP(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!root || !viewport || !track) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>(".work-card", root);
      const items = cards.map(card => ({
        card, left: 0, width: 0,
        image: card.querySelector("img"),
      }));
      const trackX = gsap.quickSetter(track, "x", "px");
      let cycle = 1;
      let width = 1;
      let current = 0;
      let target = 0;
      let depth = 0;
      const measure = () => {
        const previousCycle = cycle;
        cycle = Math.max(1, cards[projects.length].offsetLeft - cards[0].offsetLeft);
        current = (current / previousCycle) * cycle;
        target = current;
        width = viewport.clientWidth;
        items.forEach(item => {
          item.left = item.card.offsetLeft;
          item.width = item.card.offsetWidth;
        });
      };
      const draw = () => {
        const x = -cycle - gsap.utils.wrap(0, cycle, current);
        trackX(x);
        items.forEach(item => {
          const position = gsap.utils.clamp(-1, 1,
            (item.left + item.width / 2 + x - width / 2) / (width / 2 + item.width / 2));
          // Recede the whole card while scrolling, without changing the
          // image's own magnification or crop inside its frame.
          item.card.style.transform = `scale(${1 - depth * 0.085})`;
          if (item.image) item.image.style.transform = `translate(${-position * (5 + depth * 1.5)}%, ${-position * depth * 3}px) scale(1.16)`;
        });
      };
      const tick = (_time: number, deltaMs: number) => {
        const dt = Math.min(0.05, deltaMs / 1000);
        const before = current;
        current += (target - current) * (1 - Math.exp(-9 * dt));
        const velocity = dt > 0 ? Math.abs(current - before) / dt : 0;
        const desiredDepth = Math.min(1, velocity / 1400);
        depth += (desiredDepth - depth) * (1 - Math.exp(-7 * dt));
        if (Math.abs(target - current) < 0.01) current = target;
        // Rebase without changing the visible phase after extended browsing.
        if (Math.abs(current) > cycle * 100) {
          const shift = Math.trunc(current / cycle) * cycle;
          current -= shift;
          target -= shift;
        }
        draw();
      };
      measure();
      draw();
      const observer = Observer.create({
        target: root,
        type: "wheel,touch,pointer",
        preventDefault: true,
        allowClicks: true,
        onChange: self => {
          const delta = Math.abs(self.deltaX) > Math.abs(self.deltaY) ? self.deltaX : self.deltaY;
          target += self.event.type === "wheel" ? delta : -delta;
        },
      });
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, button")) return;
        const forward = ["ArrowDown", "ArrowRight", "PageDown", " "].includes(event.key);
        const backward = ["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key);
        if (!forward && !backward) return;
        event.preventDefault();
        target += (backward ? -1 : 1) * (event.shiftKey ? -1 : 1) * width * 0.55;
      };
      focusCardRef.current = card => {
        // The middle copy contains the only keyboard-accessible set of links.
        const desired = card.offsetLeft - cycle - (width - card.offsetWidth) / 2;
        target = current + gsap.utils.wrap(-cycle / 2, cycle / 2, desired - current);
        viewport.scrollLeft = 0;
      };
      gsap.ticker.add(tick);
      const resize = new ResizeObserver(measure);
      resize.observe(viewport);
      resize.observe(cards[0]);
      window.addEventListener("keydown", onKeyDown);
      document.fonts.addEventListener("loadingdone", measure);
      return () => {
        observer.kill();
        gsap.ticker.remove(tick);
        resize.disconnect();
        window.removeEventListener("keydown", onKeyDown);
        document.fonts.removeEventListener("loadingdone", measure);
        track.style.removeProperty("transform");
        items.forEach(item => {
          item.card.style.removeProperty("transform");
          item.image?.style.removeProperty("transform");
        });
        focusCardRef.current = null;
      };
    });
    return () => mm.revert();
  }, { scope: rootRef });

  const revealCard = (card: HTMLElement | null) => {
    if (card) focusCardRef.current?.(card);
  };

  return (
    <main ref={rootRef} className="work-page relative w-full select-none bg-black text-white selection:bg-[#FF2C2C] selection:text-white">
      <div ref={stageRef} className="work-stage relative h-svh w-full overflow-hidden">
        <header className="work-header absolute inset-x-0 top-0 z-30 flex items-start justify-between px-6 pt-8 sm:px-10 md:pt-12 lg:px-14 lg:pt-14">
          <h1 className="font-absans text-[clamp(3.25rem,6vw,5.1rem)] font-normal leading-[0.86] tracking-[-0.045em]">Work</h1>
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-absans text-[28px] leading-none tracking-tight sm:text-3xl md:text-4xl">R<span className="text-[#FF2C2C]">.</span></span>
          <div className="pt-2 md:pt-3">
            <RolloverLink href="/" label="BACK" className="text-[12px] font-medium uppercase tracking-[0.16em] [&_.rollover-default]:text-white md:text-[13px]" />
          </div>
        </header>

        <section aria-label="Projects" className="work-gallery absolute inset-x-0 bottom-0 pb-4">
          <div ref={viewportRef} className="work-scroll-viewport overflow-hidden px-4 pt-5">
            <div ref={trackRef} className="work-track relative flex w-max gap-2 will-change-transform">
              {Array.from({ length: 3 }, (_, copy) => projects.map((project, index) => (
                <article key={`${copy}-${project.title}`} data-work-copy={copy} aria-hidden={copy !== 1 || undefined} className="work-card w-[78vw] shrink-0 sm:w-[52vw] md:w-[53.63svh]">
                  <a href={project.href} target="_blank" rel="noopener noreferrer"
                    aria-label={`${project.title} — ${project.category}`}
                    tabIndex={copy === 1 ? 0 : -1}
                    onFocus={event => {
                      if (event.currentTarget.matches(":focus-visible")) {
                        revealCard(event.currentTarget.closest("article"));
                      }
                    }}
                    className="work-card-link group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF2C2C]">
                    <h2 aria-label={project.title} className="work-card-title mb-4 flex whitespace-nowrap text-[12px] font-normal uppercase leading-[1.2] tracking-normal text-white/90 md:text-[14px]">
                      {project.title.split("").map((letter, letterIndex) => (
                        <span key={letterIndex} aria-hidden="true" className="work-title-letter relative inline-block overflow-hidden" style={{ transitionDelay: `${letterIndex * 0.008}s` }}>
                          <span className="work-title-default block">{letter === " " ? "\u00a0" : letter}</span>
                          <span className="work-title-hover absolute inset-x-0 top-0 block">{letter === " " ? "\u00a0" : letter}</span>
                        </span>
                      ))}
                    </h2>
                    <div className="work-image relative h-[min(58svh,110vw)] overflow-hidden bg-[#121212] md:h-[62svh]">
                      <img src={project.image} alt={project.alt} loading={copy === 1 || index < 2 ? "eager" : "lazy"} draggable={false}
                        className="absolute inset-0 h-full w-full scale-[1.16] select-none object-cover" />
                    </div>
                  </a>
                </article>
              )))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
