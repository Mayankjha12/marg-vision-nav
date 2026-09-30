import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Cpu, Gauge, Route as RouteIcon, ShieldCheck, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageIntro, Panel, SimulationVisual } from "@/components/margdrishti";

export const Route = createFileRoute("/planning")({
  head: () => ({ meta: [
    { title: "Planning — MARGDRISHTI AI" },
    { name: "description", content: "Adaptive planning pipeline derived from MATLAB closed-loop simulation results for the SIH prototype." },
    { property: "og:title", content: "Path Planning — MARGDRISHTI AI" },
    { property: "og:description", content: "Measured planning flow from detection to path replanning across the prototype simulation dataset." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PlanningPage,
});

type Accent = "default" | "safe" | "warning";

const accentDot: Record<Accent, string> = {
  default: "bg-primary",
  safe: "bg-safe",
  warning: "bg-warning",
};

const plannerRows = [
  { metric: "Compute time", baseline: "852 ms", hybrid: "42.2 ms", frenet: "1.4 ms", adaptive: "10.7 ms mean, 305.6 ms max" },
  { metric: "Worst-case nodes", baseline: "28,779", hybrid: "5,956", frenet: "7", adaptive: "< 1,200" },
  { metric: "Path length", baseline: "31.8 m", hybrid: "20.4 m", frenet: "19.6 m", adaptive: "18.9 m" },
  { metric: "Safety margin", baseline: "0.7 m", hybrid: "1.2 m", frenet: "1.4 m", adaptive: "1.3 m" },
  { metric: "Use case", baseline: "Fallback", hybrid: "Dense field", frenet: "Lane-level", adaptive: "Cascade" },
];

const metrics: ReadonlyArray<{ label: string; value: string; detail: string; accent: Accent }> = [
  { label: "Kinematic feasibility", value: "4.1m", detail: "Every search edge respects bicycle-model turning limits, so infeasible arcs are pruned before path scoring.", accent: "safe" },
  { label: "Tracking Error", value: "0.329m", detail: "Mean tracking error remains below the controller tolerance envelope across the measured closed-loop simulation set.", accent: "default" },
  { label: "Planner cascade", value: "1.4ms", detail: "Frenet is used for lane-level trajectories; Hybrid A* is reserved for dense, unstructured field cases with weak centerlines.", accent: "warning" },
];

const algorithmStack = [
  { icon: RouteIcon, title: "Search constraints", text: "Feasible arcs are constrained to the bicycle model, obstacle expansion, and curvature envelope before cost evaluation starts.", value: "06" },
  { icon: Gauge, title: "Cost evaluation", text: "Path score blends clearance, curvature, lane alignment, and heading error into one selection objective for the best feasible option.", value: "12" },
  { icon: Zap, title: "Replanning control", text: "The system keeps the last safe path during short latency spikes and re-evaluates immediately when a fresh plan is available.", value: "03" },
] as const;

const planningState: ReadonlyArray<{ label: string; value: string; accent: Accent }> = [
  { label: "Current path", value: "SAFE", accent: "safe" },
  { label: "Candidate paths", value: "07", accent: "default" },
  { label: "Selected planner", value: "FRENET", accent: "default" },
  { label: "Replanning", value: "STANDBY", accent: "warning" },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const inView = { once: true, margin: "-40px" } as const;

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5 flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1">
        <span
          className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(125,211,252,0.9)]"
          aria-hidden="true"
        />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      </div>

      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
        {title}
      </h2>

      <span
        aria-hidden="true"
        className="mt-3 h-px w-20 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />
    </div>
  );
}

function TopLine() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
    />
  );
}

function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: Accent;
}) {
  return (
    <motion.article
      variants={itemVariants}
      className="glass-panel relative h-full overflow-hidden p-4 transition-colors duration-300 hover:border-primary/30"
    >
      <TopLine />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span className={`inline-flex h-2 w-2 rounded-full ${accentDot[accent]}`} aria-hidden="true" />
      </div>

      <span className="mt-2 block font-display text-3xl font-semibold tracking-[-0.05em] text-foreground md:text-4xl">
        {value}
      </span>

      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{detail}</p>
    </motion.article>
  );
}

function PlanningPage() {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = reducedMotion !== true;

  // Soft fade-up on scroll, once per section
  const reveal = shouldAnimate
    ? {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: inView,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
      }
    : {};

  const cardClass =
    "glass-panel p-4 transition-colors duration-300 hover:border-primary/30";

  const thClass =
    "h-9 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

  return (
    <div className="app-grid min-h-screen">
      <div className="mx-auto max-w-[1280px] px-4 py-5 lg:px-8 lg:py-6">
        <PageIntro
          eyebrow="Planning pipeline"
          title="Detect. Predict. Plan. Adapt."
          description="The adaptive path-planning sequence used in the SIH prototype, derived from MATLAB closed-loop simulations across 5 scenarios and 50 runs."
          aside={<span className="system-label">Pipeline active</span>}
        />

        {/* 1. Planner overview — 3 compact metric cards */}
        <section>
          <motion.div {...reveal}>
            <SectionHeading eyebrow="Overview" title="Planner overview" />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="show"
            viewport={inView}
            className="grid gap-3 md:grid-cols-3"
          >
            {metrics.map((m) => (
              <MetricCard key={m.label} {...m} />
            ))}
          </motion.div>
        </section>

        {/* 2. Hero: path visual (left) + state & decision (right) */}
        <section className="mt-8 md:mt-10">
          <motion.div {...reveal}>
            <SectionHeading eyebrow="Live trace" title="Candidate path view" />
          </motion.div>

          <motion.div
            {...reveal}
            className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch"
          >
            <Panel title="Candidate path view" label="Urban intersection trace" className="h-full">
              <div className="relative overflow-hidden">
                <SimulationVisual compact={false} variant="urban" />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent px-4 pb-3 pt-8 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-safe" /> Stable
                  </span>
                  <span>Path 01 / Safe</span>
                </div>

                {shouldAnimate ? (
                  <motion.div
                    initial={{ x: 0, opacity: 0.8 }}
                    animate={{ x: [0, 18, 36, 50, 68, 86, 112], opacity: [0.8, 1, 1, 0.9, 1, 0.9, 1] }}
                    transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                    className="pointer-events-none absolute left-[38%] top-[52%] z-20 h-3 w-3 rounded-full bg-primary shadow-[0_0_18px_rgba(125,211,252,0.9)]"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </Panel>

            <div className="flex flex-col gap-3">
              <Panel title="Planning state" label="Measured">
                <div className="space-y-2.5 p-4">
                  {planningState.map(({ label, value, accent }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${accentDot[accent]}`} aria-hidden="true" />
                        <span className="font-mono text-xs font-semibold text-primary">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className={`${cardClass} relative flex-1 overflow-hidden`}>
                <TopLine />

                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Planner decision
                </p>
                <p className="mt-1.5 font-display text-lg font-semibold tracking-[-0.03em] text-foreground">
                  Adaptive cascade
                </p>

                <div className="mt-3 grid gap-2 text-[13px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0 text-safe" aria-hidden="true" /> Clearance envelope preserved
                  </div>
                  <div className="flex items-center gap-2">
                    <Cpu size={14} className="shrink-0 text-primary" aria-hidden="true" /> Replanning remains bounded
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="shrink-0 text-primary" aria-hidden="true" /> Latency remains under target for live use
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. Algorithm stack */}
        <section className="mt-8 md:mt-10">
          <motion.div {...reveal}>
            <SectionHeading eyebrow="Algorithm stack" title="How a path gets chosen" />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="show"
            viewport={inView}
            className="grid gap-3 md:grid-cols-3"
          >
            {algorithmStack.map(({ icon: Icon, title, text, value }) => (
              <motion.article
                key={title}
                variants={itemVariants}
                className={`${cardClass} flex h-full flex-col`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="icon-well h-9 w-9 shrink-0">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs tracking-[0.14em] text-muted-foreground">
                    {value}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-base font-semibold tracking-[-0.02em] text-foreground">
                  {title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{text}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* 4. Planner performance table */}
        <section className="mt-8 md:mt-10">
          <motion.div {...reveal}>
            <SectionHeading eyebrow="Compared" title="Planner performance" />
          </motion.div>

          <motion.div {...reveal}>
            <Panel title="Planner performance" label="Compared" className="overflow-hidden">
              <div className="p-2.5 md:p-3">
                <div className="overflow-hidden rounded-xl border border-border/80 bg-slate-950/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/80 bg-slate-950/50">
                        <TableHead className={thClass}>Metric</TableHead>
                        <TableHead className={thClass}>Baseline</TableHead>
                        <TableHead className={thClass}>Hybrid A*</TableHead>
                        <TableHead className={thClass}>Frenet</TableHead>
                        <TableHead className={`${thClass} text-primary`}>Adaptive</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {plannerRows.map((row) => (
                        <TableRow
                          key={row.metric}
                          className="border-border/80 bg-transparent text-sm text-foreground/85 transition-colors duration-200 hover:bg-primary/5"
                        >
                          <TableCell className="px-4 py-2 font-medium text-foreground">{row.metric}</TableCell>
                          <TableCell className="px-4 py-2 text-muted-foreground">{row.baseline}</TableCell>
                          <TableCell className="px-4 py-2 text-muted-foreground">{row.hybrid}</TableCell>
                          <TableCell className="px-4 py-2 text-muted-foreground">{row.frenet}</TableCell>
                          <TableCell className="px-4 py-2 font-mono text-primary">{row.adaptive}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Panel>
          </motion.div>
        </section>
      </div>
    </div>
  );
}