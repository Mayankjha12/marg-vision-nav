import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CarFront, Route as RouteIcon, ScanLine } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedNumber, MetricCard, PageIntro, Panel, ScenarioVideoPlayer, scenarioVideoPaths } from "@/components/margdrishti";

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

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Card className="h-full border-border/80 bg-card/80 shadow-[0_16px_40px_rgba(2,6,23,0.22)] backdrop-blur-xl transition-colors duration-200 ease-out hover:border-primary/30">
        <CardContent className="p-6 lg:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
          <div className="mt-4">
            <AnimatedNumber value={value} className="block font-display text-5xl font-semibold tracking-[-0.06em] text-foreground md:text-6xl" decimals={0} />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{subtext}</p>
          <p className="mt-3 text-sm leading-6 text-foreground/80">{description}</p>
        </CardContent>
      </Card>
    </motion.article>
  );
}

function DashboardPage() {
  return (
    <div className="app-grid min-h-[calc(100vh-5rem)]">
      <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
        <PageIntro
          eyebrow="Adaptive path planning & collision avoidance"
          title="Indian roads. Unstructured motion. Adaptive intelligence."
          description="Simulation dashboard for perception, prediction, and path planning using measured MATLAB closed-loop results across 5 scenarios and 50 runs."
          aside={<span className="system-label">SIH 2026 Prototype — Measured Simulation Results</span>}
        />

        <div className="mb-6 grid gap-4 md:grid-cols-2">
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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Panel title="Live Simulation — All Scenarios" label="Overview · 5 active cases">
            <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {Object.entries(scenarioVideoPaths).map(([label, src]) => (
                <article key={label} className="scenario-card overflow-hidden">
                  <ScenarioVideoPlayer src={src} label={label} loop autoPlay className="rounded-t-xl" />
                </article>
              ))}
            </div>
          </Panel>
          <aside className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard label="System State" value="SAFE" detail="Closed-loop path status" tone="safe" />
            <MetricCard label="Tracked Objects" value="04" detail="Objects in the current scene" />
            <MetricCard label="Active Planner" value="FRENET" detail="Current planning mode" />
          </aside>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {[
            { icon: ScanLine, title: "Perception", text: "Camera, LiDAR, and radar inputs from the closed-loop simulation run set.", to: "/perception" as const },
            { icon: RouteIcon, title: "Path Planning", text: "Adaptive planning sequence from the measured MATLAB simulation dataset.", to: "/planning" as const },
            { icon: Activity, title: "Measured Results", text: "Closed-loop outcomes across 50 simulation runs and 5 scenarios.", to: "/performance" as const },
          ].map(({ icon: Icon, title, text, to }) => (
            <Link key={title} to={to} className="glass-panel group flex items-center gap-4 p-5 transition-colors hover:border-primary/40">
              <span className="icon-well"><Icon size={21} aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block font-display font-semibold text-foreground">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span>
              </span>
              <CarFront className="ml-auto shrink-0 text-primary opacity-40 transition-opacity group-hover:opacity-100" size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}