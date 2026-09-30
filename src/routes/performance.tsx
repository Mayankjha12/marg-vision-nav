import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { PageIntro, Panel } from "@/components/margdrishti";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

type Tone = "default" | "safe" | "warning";

const toneDot: Record<Tone, string> = {
  default: "bg-primary",
  safe: "bg-safe",
  warning: "bg-warning",
};

const scenarioRows = [
  {
    name: "Village road",
    completion: "90%",
    collisions: 0,
    staticHits: 0,
    clearance: "5.36 m",
    latMean: "11.1 ms",
    latMax: "132.4 ms",
    fail: "7.2%",
    split: "0% / 93%",
    description: "No centreline, moderate density — validates the core unstructured-planning claim.",
  },
  {
    name: "Urban intersection",
    completion: "40%",
    collisions: 6,
    staticHits: 0,
    clearance: "1.39 m",
    latMean: "8.7 ms",
    latMax: "94.3 ms",
    fail: "12.8%",
    split: "20% / 67%",
    description: "5 agents, no right of way, no signalling — 1.39m clearance shows tight but successful gap-threading.",
  },
  {
    name: "Highway merge",
    completion: "80%",
    collisions: 1,
    staticHits: 0,
    clearance: "4.56 m",
    latMean: "9.9 ms",
    latMax: "108.3 ms",
    fail: "19.1%",
    split: "33% / 48%",
    description: "6 agents, tight gap acceptance window — 1 collision from a late-merge decision.",
  },
  {
    name: "Dense market",
    completion: "20%",
    collisions: 7,
    staticHits: 0,
    clearance: "1.19 m",
    latMean: "17.3 ms",
    latMax: "305.6 ms",
    fail: "16.4%",
    split: "0% / 84%",
    description: "9 agents, 32m corridor, heavy mutual occlusion — track re-birth loses velocity estimate mid-scenario.",
  },
  {
    name: "Cattle crossing",
    completion: "40%",
    collisions: 5,
    staticHits: 0,
    clearance: "2.93 m",
    latMean: "6.7 ms",
    latMax: "257.2 ms",
    fail: "14.5%",
    split: "41% / 44%",
    description: "Cattle occluded by parked truck until entering carriageway, zero initial velocity — tests emergency braking, not prediction.",
  },
];

const metrics: ReadonlyArray<{ label: string; value: string; detail: string; tone: Tone }> = [
  { label: "Completion Rate", value: "54%", detail: "Overall scenario completion", tone: "safe" },
  { label: "Collisions", value: "19", detail: "Moving-agent collisions", tone: "warning" },
  { label: "Clearance", value: "3.08 m", detail: "Overall minimum clearance", tone: "default" },
  { label: "Replanning Latency", value: "10.7 ms", detail: "Mean closed-loop latency", tone: "default" },
  { label: "P95 Latency", value: "23.7 ms", detail: "95th percentile latency", tone: "default" },
  { label: "Worst-case Latency", value: "305.6 ms", detail: "Peak observed latency", tone: "warning" },
];

const ease = [0.22, 1, 0.36, 1] as const;

// Ek poora loop kitne milliseconds me ho (bada number = dheema)
const MARQUEE_LOOP_MS = 30000;

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const inView = { once: true, margin: "-40px" } as const;

export const Route = createFileRoute("/performance")({
  head: () => ({ meta: [
    { title: "Performance — MARGDRISHTI AI" },
    { name: "description", content: "Measured closed-loop simulation results for the MARGDRISHTI AI prototype." },
    { property: "og:title", content: "Measured Performance — MARGDRISHTI AI" },
    { property: "og:description", content: "Overall results across 50 closed-loop prototype simulation runs." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PerformancePage,
});

function MetricTile({
  label,
  value,
  detail,
  tone,
  hoverLift,
  inMarquee = false,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  hoverLift: boolean;
  inMarquee?: boolean;
}) {
  // Marquee me card ki width fixed hai aur label/detail ki 2-line height reserved,
  // taaki sab cards ki values ek line me rahein.
  const labelHeight = inMarquee ? "min-h-[2rem]" : "min-h-[2rem] md:min-h-0 xl:min-h-[2rem]";
  const detailHeight = inMarquee ? "min-h-[2rem]" : "min-h-[2rem] md:min-h-0 xl:min-h-[2rem]";
  const width = inMarquee ? "w-[190px] shrink-0 md:w-[200px]" : "";

  return (
    <motion.article
      variants={itemVariants}
      whileHover={hoverLift ? { y: -3 } : undefined}
      transition={{ duration: 0.25, ease }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-l-2 border-border/80 border-l-primary bg-card/40 px-3 py-3 transition-colors duration-300 hover:border-primary/40 hover:border-l-primary ${width}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-primary/15 opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className={`flex items-start justify-between gap-2 ${labelHeight}`}>
        <p className="text-xs font-medium uppercase leading-4 tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[tone]}`} aria-hidden="true" />
      </div>

      <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>

      <p className={`mt-1 text-xs leading-4 text-muted-foreground ${detailHeight}`}>{detail}</p>
    </motion.article>
  );
}

/* Infinite moving strip: hover pe ruk jata hai */
function MetricMarquee() {
  const x = useMotionValue(0);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const paused = useRef(false);

  useAnimationFrame((_, delta) => {
    if (paused.current) return;

    const width = groupRef.current?.offsetWidth ?? 0;
    if (!width) return;

    // Tab background me ho to bada delta aata hai, use limit karte hain
    const step = (width / MARQUEE_LOOP_MS) * Math.min(delta, 50);
    const next = x.get() - step;

    // Pehla group poora nikal jaye to wapas shuru, isse loop seamless dikhta hai
    x.set(next <= -width ? next + width : next);
  });

  return (
    <div
      aria-label="Key metrics"
      className="relative overflow-hidden py-2"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
      style={{
        maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <motion.div className="flex w-max" style={{ x }}>
        <div ref={groupRef} className="flex items-stretch gap-2.5 pr-2.5">
          {metrics.map((m) => (
            <MetricTile key={m.label} {...m} hoverLift inMarquee />
          ))}
        </div>

        {/* Same cards ki copy, taaki loop beech me khali na ho */}
        <div className="flex items-stretch gap-2.5 pr-2.5" aria-hidden="true">
          {metrics.map((m) => (
            <MetricTile key={`${m.label}-copy`} {...m} hoverLift inMarquee />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function PerformancePage() {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = reducedMotion !== true;

  const reveal = shouldAnimate
    ? {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: inView,
        transition: { duration: 0.6, ease },
      }
    : {};

  return (
    <TooltipProvider delayDuration={120}>
      <div className="app-grid min-h-screen">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-6 lg:px-6 lg:py-8">
          <PageIntro
            eyebrow="Measured performance"
            title="Closed-loop results at a glance."
            description="Overall measurements from 5 scenarios × 10 random seeds. Seeds vary sensor noise, missed detections, and false alarms—not traffic patterns."
            aside={<span className="system-label system-label-safe">50 simulation runs</span>}
          />

          {/* Metric cards: moving infinite strip (reduced motion me simple grid) */}
          {shouldAnimate ? (
            <MetricMarquee />
          ) : (
            <motion.div
              variants={containerVariants}
              initial={false}
              animate="show"
              className="grid w-full grid-cols-2 items-stretch gap-2.5 md:grid-cols-3 xl:grid-cols-6"
            >
              {metrics.map((m) => (
                <MetricTile key={m.label} {...m} hoverLift={false} />
              ))}
            </motion.div>
          )}

          <motion.p
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mx-auto mt-3 max-w-3xl text-center text-xs leading-6 text-muted-foreground"
          >
            <span className="font-medium text-foreground">Bounded, not unbounded</span> — expansion cap + path-hold cascade prevents overrun.
          </motion.p>

          <motion.div {...reveal} className="mt-5">
            <Panel title="Completion rate by scenario" label="Recharts · measured data">
              <div className="p-4 lg:p-5">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={scenarioRows.map((s) => ({ name: s.name, completion: parseInt(s.completion) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(148,163,184,0.8)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "rgba(148,163,184,0.8)", fontSize: 12 }} unit="%" />
                    <Bar dataKey="completion" fill="rgba(125,211,252,0.85)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </motion.div>

          <motion.div {...reveal} className="mt-5">
            <Panel title="Scenario breakdown" label="Per scenario">
              <div className="hidden overflow-x-auto rounded-b-xl lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Scenario</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Collisions</TableHead>
                      <TableHead>Static hits</TableHead>
                      <TableHead>Min clearance</TableHead>
                      <TableHead>Lat mean</TableHead>
                      <TableHead>Lat max</TableHead>
                      <TableHead>Fail%</TableHead>
                      <TableHead>Frenet/A* split</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scenarioRows.map((scenario) => (
                      <TableRow key={scenario.name} className="group">
                        <TableCell className="font-medium text-foreground">
                          <p className="text-foreground">{scenario.name}</p>
                          <p className="mt-1 max-w-[220px] text-xs font-normal leading-5 text-muted-foreground">{scenario.description}</p>
                        </TableCell>
                        <TableCell>{scenario.completion}</TableCell>
                        <TableCell>{scenario.collisions}</TableCell>
                        <TableCell>{scenario.staticHits}</TableCell>
                        <TableCell>{scenario.clearance}</TableCell>
                        <TableCell>{scenario.latMean}</TableCell>
                        <TableCell>{scenario.latMax}</TableCell>
                        <TableCell>{scenario.fail}</TableCell>
                        <TableCell>{scenario.split}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-2.5 p-3 lg:hidden">
                {scenarioRows.map((scenario) => (
                  <article key={scenario.name} className="rounded-xl border border-border bg-card/60 p-3 shadow-[0_10px_30px_rgba(3,7,18,0.18)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{scenario.name}</p>
                      <span className="system-label system-label-safe">{scenario.completion}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{scenario.description}</p>

                    <dl className="mt-2.5 grid grid-cols-3 gap-1.5 text-sm">
                      {[
                        { k: "Collisions", v: scenario.collisions },
                        { k: "Static hits", v: scenario.staticHits },
                        { k: "Min clearance", v: scenario.clearance },
                        { k: "Lat mean", v: scenario.latMean },
                        { k: "Lat max", v: scenario.latMax },
                        { k: "Fail%", v: scenario.fail },
                      ].map(({ k, v }) => (
                        <div key={k} className="rounded-lg border border-border bg-background/40 px-2 py-1.5">
                          <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{k}</dt>
                          <dd className="mt-0.5 font-mono text-sm text-foreground">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-2 rounded-lg border border-border bg-background/40 px-2 py-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Frenet/A*</span> {scenario.split}
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          </motion.div>

          <motion.div {...reveal} className="mt-5">
            <Panel title="Results Context" label="Measured">
              <div className="mx-auto grid max-w-[760px] gap-4 p-5 text-center md:grid-cols-3">
                <div>
                  <p className="font-mono text-2xl text-foreground">05</p>
                  <p className="mt-1.5 text-xs uppercase tracking-[0.13em] text-muted-foreground">Road scenarios</p>
                </div>
                <div>
                  <p className="font-mono text-2xl text-foreground">10</p>
                  <p className="mt-1.5 text-xs uppercase tracking-[0.13em] text-muted-foreground">Random seeds each</p>
                </div>
                <div>
                  <p className="font-mono text-2xl text-safe">0</p>
                  <p className="mt-1.5 text-xs uppercase tracking-[0.13em] text-muted-foreground">Static-obstacle hits</p>
                </div>
              </div>
            </Panel>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}