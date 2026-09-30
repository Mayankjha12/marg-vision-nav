import { createFileRoute } from "@tanstack/react-router";
import { Camera, Radar, ScanSearch } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { PageIntro, Panel } from "@/components/margdrishti";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LivePerceptionDemo } from "@/components/live-perception";

type NoiseQuality = "excellent" | "poor";

const sensors = [
  {
    name: "Camera",
    label: "Scene context",
    badge: "Contextual",
    icon: Camera,
    detail:
      "Road-object detection and scene context recorded across the measured simulation set.",
    axisA: "Bearing noise",
    axisB: "Range noise",
    valueA: 0.08,
    valueB: 0.4,
    qualityA: "excellent" as NoiseQuality,
    qualityB: "poor" as NoiseQuality,
    note: "Depth from a single image is hard. Scene context remains strong, but absolute range is weak.",
  },
  {
    name: "LiDAR",
    label: "Depth geometry",
    badge: "Most accurate",
    icon: ScanSearch,
    detail:
      "Obstacle geometry and depth reconstruction from the closed-loop environment.",
    axisA: "Range noise",
    axisB: "Cross-range noise",
    valueA: 0.05,
    valueB: 0.05,
    qualityA: "excellent" as NoiseQuality,
    qualityB: "excellent" as NoiseQuality,
    note: "High-fidelity geometry in the first 40m, but the point cloud is sparse for fine classification and shape detail.",
  },
  {
    name: "Radar",
    label: "Motion state",
    badge: "Complementary",
    icon: Radar,
    detail:
      "Relative range and velocity estimates for dynamic road users in the scenario set.",
    axisA: "Range noise",
    axisB: "Cross-range noise",
    valueA: 0.08,
    valueB: 0.35,
    qualityA: "excellent" as NoiseQuality,
    qualityB: "poor" as NoiseQuality,
    note: "Complementary to vision — radar keeps range and motion estimates stable when the camera blurs or clips.",
  },
] as const;

const objectClassesTracked = [
  { class: "Car", radius: "1.6 m", appears: "highway merge" },
  { class: "Bus / truck", radius: "2.2 m", appears: "urban intersection" },
  {
    class: "Autorickshaw",
    radius: "1.5 m",
    appears: "village road, market, cattle crossing",
  },
  {
    class: "Two-wheeler",
    radius: "0.7 m",
    appears: "village road, intersection, market",
  },
  { class: "Pedestrian", radius: "0.6 m", appears: "all five" },
  {
    class: "Animal",
    radius: "1.0 m",
    appears: "village road, market, cattle crossing",
  },
  { class: "Cart", radius: "1.1 m", appears: "village road, market" },
  { class: "Unknown", radius: "1.5 m", appears: "any classification failure" },
] as const;

const rangeData = [
  { name: "Lidar", value: 40 },
  { name: "Radar", value: 120 },
  { name: "Camera", value: 60 },
] as const;

const kpis = [
  { label: "Detection probability", value: "0.90–0.96", caption: "falls with range" },
  { label: "Mean replan latency", value: "10.7 ms", caption: "closed-loop average" },
  { label: "Track ID churn", value: "25.8 → 6.4", caption: "2 hits → 3 hits" },
  { label: "Simulation set", value: "50 runs", caption: "5 scenarios" },
] as const;

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

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
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

function KpiCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="glass-panel w-[190px] shrink-0 px-4 py-3 md:w-[210px]">
      <p className="truncate text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-display text-xl font-semibold tracking-[-0.03em] text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function KpiMarquee({ animate }: { animate: boolean }) {
  // Reduced motion: simple static grid
  if (!animate) {
    return (
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        aria-label="Key metrics"
      >
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass-panel px-4 py-3">
            <p className="truncate text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1.5 font-display text-xl font-semibold tracking-[-0.03em] text-foreground">
              {kpi.value}
            </p>
            <p className="text-xs text-muted-foreground">{kpi.caption}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-label="Key metrics"
      className="relative overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <motion.div
        className="flex w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      >
        {/* Two identical groups so the loop is seamless */}
        <div className="flex gap-3 pr-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        <div className="flex gap-3 pr-3" aria-hidden="true">
          {kpis.map((kpi) => (
            <KpiCard key={`${kpi.label}-copy`} {...kpi} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function NoiseBar({
  label,
  value,
  max = 0.5,
  quality,
  animate,
}: {
  label: string;
  value: number;
  max?: number;
  quality: NoiseQuality;
  animate: boolean;
}) {
  const safeMax = max > 0 ? max : 0.5;
  const percent = Math.min((value / safeMax) * 100, 100);
  const isPoor = quality === "poor";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>

        <span className={isPoor ? "text-warning" : "text-safe"}>
          {value.toFixed(2)} m · {quality}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-secondary/60">
        <motion.div
          initial={animate ? { width: 0 } : false}
          whileInView={{ width: `${percent}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className={`h-full rounded-full ${
            isPoor ? "bg-amber-400/90" : "bg-emerald-400/90"
          }`}
          style={animate ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/perception")({
  head: () => ({
    meta: [
      {
        title: "Perception — MARGDRISHTI AI",
      },
      {
        name: "description",
        content:
          "Perception inputs and scene-object states from the MATLAB closed-loop simulation dataset for MARGDRISHTI AI.",
      },
      {
        property: "og:title",
        content: "Perception System — MARGDRISHTI AI",
      },
      {
        property: "og:description",
        content:
          "Camera, LiDAR, and radar data from the measured SIH prototype simulation runs across 5 scenarios.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),

  component: PerceptionPage,
});

function PerceptionPage() {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = reducedMotion !== true;

  // Soft fade-up on scroll, used once per section
  const reveal = shouldAnimate
    ? {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: inView,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
      }
    : {};

  // Static cards: only a calm border color change on hover
  const cardClass =
    "glass-panel p-4 transition-colors duration-300 hover:border-primary/30";

  // Compact version for the sensor cards
  const sensorCardClass =
    "glass-panel p-3.5 transition-colors duration-300 hover:border-primary/30";

  return (
    <div className="app-grid min-h-screen">
      <div className="mx-auto max-w-[1280px] px-4 py-5 lg:px-8 lg:py-6">
        <PageIntro
          eyebrow="Sensor perception"
          title="Perception layer across the closed-loop run set."
          description="Sensor coverage and scene-object observations from the SIH prototype runs across 5 scenarios and 50 MATLAB simulations."
          aside={
            <span className="system-label system-label-safe">
              50 runs · 5 scenarios
            </span>
          }
        />

        {/* 1. KPI strip — small cards, infinite marquee */}
        <KpiMarquee animate={shouldAnimate} />

        {/* 2. Live Perception — hero */}
        <motion.section {...reveal} className="mt-8 md:mt-10">
          <SectionHeading eyebrow="Live demo" title="Live perception" />

          <div className="mx-auto w-full max-w-[1000px] [&>*]:!mt-0 [&_.aspect-video]:!aspect-[21/10] [&_video]:h-full [&_video]:w-full [&_video]:object-contain">
            <LivePerceptionDemo />
          </div>
        </motion.section>

        {/* 3. Sensors — compact merged cards */}
        <section className="mt-8 md:mt-10">
          <motion.div {...reveal}>
            <SectionHeading eyebrow="Sensors" title="Sensor complementarity" />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial={shouldAnimate ? "hidden" : false}
            whileInView="show"
            viewport={inView}
            className="grid gap-3 md:grid-cols-3"
          >
            {sensors.map((sensor) => {
              const Icon = sensor.icon;

              return (
                <motion.article
                  key={sensor.name}
                  variants={itemVariants}
                  className={`${sensorCardClass} flex h-full flex-col`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="icon-well h-8 w-8 shrink-0">
                        <Icon size={15} aria-hidden="true" />
                      </span>

                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold leading-tight text-foreground">
                          {sensor.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {sensor.label}
                        </span>
                      </div>
                    </div>

                    <span className="system-label system-label-safe shrink-0">
                      {sensor.badge}
                    </span>
                  </div>

                  <p className="mt-2.5 text-[13px] leading-5 text-muted-foreground">
                    {sensor.detail}
                  </p>

                  <div className="mt-2.5 space-y-2">
                    <NoiseBar
                      label={sensor.axisA}
                      value={sensor.valueA}
                      quality={sensor.qualityA}
                      animate={shouldAnimate}
                    />

                    <NoiseBar
                      label={sensor.axisB}
                      value={sensor.valueB}
                      quality={sensor.qualityB}
                      animate={shouldAnimate}
                    />
                  </div>

                  <p className="mt-2.5 border-t border-border/60 pt-2.5 text-[13px] leading-5 text-muted-foreground">
                    {sensor.note}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>
        </section>

        {/* 4. Classes table + tracking notes */}
        <section className="mt-8 md:mt-10">
          <motion.div {...reveal}>
            <SectionHeading eyebrow="Tracking" title="Classes and tracking notes" />
          </motion.div>

          <motion.div
            {...reveal}
            className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr] lg:items-start"
          >
            {/* Table */}
            <Panel title="Object classes tracked" label="Perception Classes">
              <div className="p-2.5 md:p-3">
                <div className="overflow-hidden rounded-xl border border-border/80 bg-slate-950/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/80 bg-slate-950/50">
                        <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Class
                        </TableHead>

                        <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Assumed radius
                        </TableHead>

                        <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Where it appears
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {objectClassesTracked.map((item) => (
                        <TableRow
                          key={item.class}
                          className="border-border/80 text-sm text-foreground/85 transition-colors duration-200 hover:bg-primary/5"
                        >
                          <TableCell className="px-4 py-1.5 font-medium text-foreground">
                            {item.class}
                          </TableCell>

                          <TableCell className="px-4 py-1.5 font-mono text-xs text-muted-foreground">
                            {item.radius}
                          </TableCell>

                          <TableCell className="px-4 py-1.5 text-sm text-muted-foreground">
                            {item.appears}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Panel>

            {/* Tracking notes + range */}
            <div className="flex flex-col gap-3">
              <div className={cardClass}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Track ID churn
                  </p>
                  <span className="system-label system-label-safe">
                    4 real agents
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Track fragmentation when agents occlude each other; raising
                  the confirmation threshold from 2 hits to 3 hits cut spurious
                  tracks fourfold.
                </p>

                <div className="my-3 border-t border-border/60" />

                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Scaling note
                </p>

                <p className="mt-2 text-sm leading-6 text-foreground">
                  ID churn remains stable{" "}
                  <span className="font-semibold text-primary">
                    (1.6 → 1.2 per agent)
                  </span>{" "}
                  from 4 to 25 agents — association does not degrade at this
                  density.
                </p>
              </div>

              <div className={cardClass}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Range confidence
                </p>

                <div className="mt-3 space-y-2.5">
                  {rangeData.map((r) => (
                    <div key={r.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{r.name}</span>
                        <span className="font-mono font-semibold text-foreground">
                          {r.value} m
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary/60">
                        <motion.div
                          initial={shouldAnimate ? { width: 0 } : false}
                          whileInView={{ width: `${(r.value / 120) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.9,
                            ease: [0.22, 1, 0.36, 1],
                            delay: 0.2,
                          }}
                          className="h-full rounded-full bg-primary/80"
                          style={
                            shouldAnimate
                              ? undefined
                              : { width: `${(r.value / 120) * 100}%` }
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}