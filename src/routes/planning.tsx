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

function AnimatedMetric({ label, value, detail, accent = "default" }: { label: string; value: string; detail: string; accent?: "default" | "safe" | "warning" }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={reducedMotion ? undefined : { y: -4 }}
      className="group relative overflow-hidden rounded-[1.2rem] border border-primary/10 bg-[radial-gradient(circle_at_var(--spotlight-x,_50%)_var(--spotlight-y,_50%),rgba(125,211,252,0.15),transparent_25%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(11,16,26,0.9))] p-5 shadow-[0_18px_42px_rgba(2,6,23,0.18)] transition-all duration-200 ease-out hover:border-primary/30"
      onPointerMove={reducedMotion ? undefined : (event: React.PointerEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        event.currentTarget.style.setProperty("--spotlight-x", `${x}%`);
        event.currentTarget.style.setProperty("--spotlight-y", `${y}%`);
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(125, 211, 252, 0.22), transparent 28%)" }}
      />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${accent === "safe" ? "bg-safe" : accent === "warning" ? "bg-warning" : "bg-primary"}`} />
        </div>
        <span className="block font-display text-3xl font-semibold tracking-[-0.06em] text-foreground md:text-[2.5rem]">
          {value}
        </span>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </motion.article>
  );
}

const plannerRows = [
  { metric: "Compute time", baseline: "852 ms", hybrid: "42.2 ms", frenet: "1.4 ms", adaptive: "10.7 ms mean, 305.6 ms max" },
  { metric: "Worst-case nodes", baseline: "28,779", hybrid: "5,956", frenet: "7", adaptive: "< 1,200" },
  { metric: "Path length", baseline: "31.8 m", hybrid: "20.4 m", frenet: "19.6 m", adaptive: "18.9 m" },
  { metric: "Safety margin", baseline: "0.7 m", hybrid: "1.2 m", frenet: "1.4 m", adaptive: "1.3 m" },
  { metric: "Use case", baseline: "Fallback", hybrid: "Dense field", frenet: "Lane-level", adaptive: "Cascade" },
];

function PlanningPage() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="app-grid min-h-screen">
      <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
        <PageIntro
          eyebrow="Planning pipeline"
          title="Detect. Predict. Plan. Adapt."
          description="The adaptive path-planning sequence used in the SIH prototype, derived from MATLAB closed-loop simulations across 5 scenarios and 50 runs."
          aside={<span className="system-label">Pipeline active</span>}
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 shadow-[0_0_20px_rgba(125,211,252,0.08)]">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(125,211,252,0.9)]" aria-hidden="true" />
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.26em] text-primary">Planner overview</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <AnimatedMetric label="Kinematic feasibility" value="4.1m" detail="Every search edge respects bicycle-model turning limits, so infeasible arcs are pruned before path scoring." accent="safe" />
            <AnimatedMetric label="Tracking Error" value="0.329m" detail="Mean tracking error remains below the controller tolerance envelope across the measured closed-loop simulation set." accent="default" />
            <AnimatedMetric label="Planner cascade" value="1.4ms" detail="Frenet is used for lane-level trajectories; Hybrid A* is reserved for dense, unstructured field cases with weak centerlines." accent="warning" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
          className="mb-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-8 bg-primary/50" />
              Algorithm stack
            </div>
            <span className="system-label">Measured flow</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              { icon: RouteIcon, title: "Search constraints", text: "Feasible arcs are constrained to the bicycle model, obstacle expansion, and curvature envelope before cost evaluation starts.", value: "06" },
              { icon: Gauge, title: "Cost evaluation", text: "Path score blends clearance, curvature, lane alignment, and heading error into one selection objective for the best feasible option.", value: "12" },
              { icon: Zap, title: "Replanning control", text: "The system keeps the last safe path during short latency spikes and re-evaluates immediately when a fresh plan is available.", value: "03" },
            ].map(({ icon: Icon, title, text, value }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.08 }}
                whileHover={reducedMotion ? undefined : { y: -4 }}
                className="group relative overflow-hidden rounded-[1.2rem] border border-border/80 bg-[radial-gradient(circle_at_var(--spotlight-x,_50%)_var(--spotlight-y,_50%),rgba(125,211,252,0.12),transparent_25%),linear-gradient(180deg,rgba(15,23,42,0.94),rgba(11,16,26,0.88))] p-5 shadow-[0_18px_38px_rgba(2,6,23,0.14)] transition-all duration-200 ease-out hover:border-primary/30"
                onPointerMove={reducedMotion ? undefined : (event: React.PointerEvent<HTMLElement>) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = ((event.clientX - rect.left) / rect.width) * 100;
                  const y = ((event.clientY - rect.top) / rect.height) * 100;
                  event.currentTarget.style.setProperty("--spotlight-x", `${x}%`);
                  event.currentTarget.style.setProperty("--spotlight-y", `${y}%`);
                }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(125, 211, 252, 0.2), transparent 28%)" }}
                />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="icon-well h-11 w-11"><Icon size={18} aria-hidden="true" /></span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{value}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Panel title="Planner performance" label="Compared" className="mt-5 overflow-hidden">
            <div className="p-4 md:p-5">
              <div className="overflow-hidden rounded-[1rem] border border-border/80 bg-slate-950/40">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/80 bg-slate-950/50">
                      <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Metric</TableHead>
                      <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Baseline</TableHead>
                      <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hybrid A*</TableHead>
                      <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Frenet</TableHead>
                      <TableHead className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Adaptive</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plannerRows.map((row) => (
                      <TableRow key={row.metric} className="border-border/80 bg-transparent text-sm text-foreground/85">
                        <TableCell className="px-4 py-3 font-medium text-foreground">{row.metric}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{row.baseline}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{row.hybrid}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{row.frenet}</TableCell>
                        <TableCell className="px-4 py-3 font-mono text-primary">{row.adaptive}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Panel>
        </motion.div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <Panel title="Candidate path view" label="Urban intersection trace" className="h-full">
              <div className="relative overflow-hidden">
                <SimulationVisual compact={false} variant="urban" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent px-4 pb-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                  <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-safe" /> Stable</span>
                  <span>Path 01 / Safe</span>
                </div>
                {!reducedMotion ? (
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
          >
            <Panel title="Planning state" label="Measured">
              <div className="space-y-4 p-5">
                {[
                  { label: "Current path", value: "SAFE", accent: "safe" },
                  { label: "Candidate paths", value: "07", accent: "default" },
                  { label: "Selected planner", value: "FRENET", accent: "default" },
                  { label: "Replanning", value: "STANDBY", accent: "warning" },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="flex items-center justify-between gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${accent === "safe" ? "bg-safe" : accent === "warning" ? "bg-warning" : "bg-primary"}`} aria-hidden="true" />
                      <span className="font-mono text-xs font-semibold text-primary">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
              className="mt-5 rounded-[1.2rem] border border-primary/10 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.12),transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(11,16,26,0.9))] p-4 shadow-[0_18px_40px_rgba(2,6,23,0.12)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Planner decision</p>
                  <p className="mt-2 font-display text-xl font-semibold tracking-[-0.04em] text-foreground">Adaptive cascade</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-safe" /> Clearance envelope preserved</div>
                <div className="flex items-center gap-2"><Cpu size={14} className="text-primary" /> Replanning remains bounded</div>
                <div className="flex items-center gap-2"><Activity size={14} className="text-primary" /> Latency remains under target for live use</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
