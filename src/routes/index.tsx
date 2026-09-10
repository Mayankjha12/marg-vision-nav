import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CarFront, Route as RouteIcon, ScanLine } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedNumber, MetricCard, PageIntro, Panel, ScenarioVideoPlayer, scenarioVideoPaths } from "@/components/margdrishti";

function HeroSpotlightFrame({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--hero-x", `${x}%`);
    event.currentTarget.style.setProperty("--hero-y", `${y}%`);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="hero-shell relative mb-6 overflow-hidden rounded-[2rem] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="hero-shell__glow" aria-hidden="true" />
      <div className="hero-shell__grid" aria-hidden="true" />
      <div className="hero-shell__vignette" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MARGDRISHTI AI — Autonomous Driving Demo" },
      { name: "description", content: "Prototype dashboard visualizing adaptive path planning for unstructured Indian roads." },
      { property: "og:title", content: "MARGDRISHTI AI — Autonomous Driving Demo" },
      { property: "og:description", content: "A simulation-based prototype for adaptive path planning and collision avoidance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function HeroStatCard({ title, value, subtext, description }: { title: string; value: string; subtext: string; description: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    event.currentTarget.style.setProperty("--spotlight-x", `${x}%`);
    event.currentTarget.style.setProperty("--spotlight-y", `${y}%`);
  };

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mx-auto w-full max-w-[560px]"
    >
      <Card
        className="group relative h-full overflow-hidden border border-primary/10 bg-[radial-gradient(circle_at_var(--spotlight-x,_50%)_var(--spotlight-y,_50%),rgba(125,211,252,0.18),transparent_22%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(9,13,24,0.92))] shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur-xl transition-all duration-200 ease-out hover:border-primary/30"
        onPointerMove={handlePointerMove}
      >
        <div className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background: 'radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(125, 211, 252, 0.2), transparent 24%)',
          }}
        />
        <CardContent className="relative flex h-full flex-col justify-between p-4 md:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
          <div className="mt-3">
            <AnimatedNumber value={value} className="block font-display text-4xl font-semibold tracking-[-0.06em] text-foreground md:text-[3.25rem]" decimals={0} />
          </div>
          <p className="mt-3 text-sm leading-5 text-muted-foreground">{subtext}</p>
          <p className="mt-3 text-sm leading-5 text-foreground/80">{description}</p>
        </CardContent>
      </Card>
    </motion.article>
  );
}

function TypewriterTitle() {
  const words = ["Indian roads.", "Unstructured motion.", "Adaptive intelligence."];
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    const timeout = window.setTimeout(() => {
      if (!isDeleting) {
        const nextText = currentWord.slice(0, text.length + 1);
        setText(nextText);

        if (nextText === currentWord) {
          const pause = window.setTimeout(() => setIsDeleting(true), 1200);
          return () => window.clearTimeout(pause);
        }
      } else {
        const nextText = currentWord.slice(0, text.length - 1);
        setText(nextText);

        if (nextText === "") {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 42 : 90);

    return () => window.clearTimeout(timeout);
  }, [text, isDeleting, wordIndex]);

  return (
    <span className="inline-flex max-w-full items-center overflow-hidden whitespace-nowrap">
      <span>{text}</span>
      <span className="ml-1 inline-block h-[0.82em] w-[0.09em] animate-pulse rounded-sm bg-primary align-middle" aria-hidden="true" />
    </span>
  );
}

function DashboardPage() {
  return (
    <div className="app-grid min-h-[calc(100vh-5rem)]">
      <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
        <HeroSpotlightFrame>
          <PageIntro
            eyebrow="Adaptive path planning & collision avoidance"
            title={<TypewriterTitle />}
            description="Simulation dashboard for perception, prediction, and path planning using measured MATLAB closed-loop results across 5 scenarios and 50 runs."
            aside={<span className="system-label">Measured Simulation Results</span>}
            titleClassName="max-w-full overflow-hidden whitespace-nowrap text-[clamp(2.3rem,5vw,6.2rem)] leading-[0.96]"
          />
        </HeroSpotlightFrame>

        <div className="mb-6">
          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 shadow-[0_0_20px_rgba(125,211,252,0.08)]">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(125,211,252,0.9)]" aria-hidden="true" />
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.26em] text-primary">Headline Results</p>
            </div>
          </div>

          <div className="mx-auto grid max-w-[980px] gap-4 md:grid-cols-2">
            <HeroStatCard
              title="Prediction Accuracy"
              value="32x"
              subtext="IMM tracker: 0.59m mean error at 3s horizon vs 19.10m for a single constant-velocity Kalman filter"
              description="Three motion models (constant velocity, constant turn rate, constant acceleration) run in parallel on one CTRV state — the output is the probability-weighted blend."
            />
            <HeroStatCard
              title="Real-Time Planning"
              value="249x"
              subtext="Hybrid A* planner: 10,505ms (first version) → 42.2ms (optimized), byte-identical output"
              description="Same algorithm, same search — optimization removed struct field lookups from the hot loop. This was a performance fix, not an algorithmic compromise."
            />
          </div>
        </div>

        <div className="mt-4 mb-6">
          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 shadow-[0_0_20px_rgba(125,211,252,0.08)]">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(125,211,252,0.9)]" aria-hidden="true" />
              <p className="text-center text-[12px] font-semibold uppercase tracking-[0.26em] text-primary">Related Modules</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/20 py-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#050d1a] to-transparent" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#050d1a] to-transparent" aria-hidden="true" />

            <motion.div
              className="flex w-max items-stretch gap-4 px-4"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
            >
              {[0, 1].map((repeat) => (
                <div key={repeat} className="flex shrink-0 items-stretch gap-4">
                  {[
                    { icon: ScanLine, title: "Perception", text: "Camera, LiDAR, and radar inputs from the closed-loop simulation run set.", to: "/perception" as const },
                    { icon: RouteIcon, title: "Path Planning", text: "Adaptive planning sequence from the measured MATLAB simulation dataset.", to: "/planning" as const },
                    { icon: Activity, title: "Measured Results", text: "Closed-loop outcomes across 50 simulation runs and 5 scenarios.", to: "/performance" as const },
                  ].map(({ icon: Icon, title, text, to }) => (
                    <motion.div key={`${repeat}-${title}`} whileHover={{ y: -5, scale: 1.01 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="w-[300px] shrink-0">
                      <Link to={to} className="group relative block h-full overflow-hidden rounded-[1.1rem] border border-primary/10 bg-[radial-gradient(circle_at_var(--spotlight-x,_50%)_var(--spotlight-y,_50%),rgba(125,211,252,0.18),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(11,16,26,0.9))] p-4 shadow-[0_18px_40px_rgba(2,6,23,0.14)] transition-all duration-200 ease-out hover:border-primary/40 hover:shadow-[0_20px_45px_rgba(14,116,144,0.12)]">
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
                          style={{
                            background: 'radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(125, 211, 252, 0.28), transparent 28%)',
                          }}
                        />
                        <div className="pointer-events-none absolute inset-[1px] rounded-[calc(1.1rem-1px)] border border-white/5 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100" />
                        <div className="relative z-10 transition-transform duration-200 ease-out group-hover:translate-x-[1px] group-hover:-translate-y-[1px]">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="icon-well h-10 w-10 transition-transform duration-200 ease-out group-hover:scale-105"><Icon size={18} aria-hidden="true" /></span>
                            <CarFront className="text-primary/50 transition-all duration-200 ease-out group-hover:text-primary group-hover:translate-x-1" size={16} aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <span className="block font-display text-lg font-semibold text-foreground transition-colors duration-200 ease-out group-hover:text-primary">{title}</span>
                            <span className="mt-2 block text-xs leading-5 text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground/80">{text}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}