import { createFileRoute } from "@tanstack/react-router";
import { Activity, Box, Camera, Gauge, Layers3, Radar, ScanSearch } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedNumber, PageIntro, Panel } from "@/components/margdrishti";

const sensorFusionData = [
  {
    name: "Camera",
    axisA: "Bearing noise",
    axisB: "Range noise",
    valueA: 0.08,
    valueB: 0.4,
    qualityA: "excellent",
    qualityB: "poor",
    note: "Depth from a single image is hard. Scene context remains strong, but absolute range is weak.",
  },
  {
    name: "Radar",
    axisA: "Range noise",
    axisB: "Cross-range noise",
    valueA: 0.08,
    valueB: 0.35,
    qualityA: "excellent",
    qualityB: "poor",
    note: "Complementary to vision — radar keeps range and motion estimates stable when the camera blurs or clips.",
  },
  {
    name: "Lidar",
    axisA: "Range noise",
    axisB: "Cross-range noise",
    valueA: 0.05,
    valueB: 0.05,
    qualityA: "excellent",
    qualityB: "excellent",
    note: "High-fidelity geometry in the first 40m, but the point cloud is sparse for fine classification and shape detail.",
  },
] as const;

const sensorCards = [
  {
    name: "Camera",
    label: "Scene context",
    detail: "Road-object detection and scene context recorded across the measured simulation set.",
    icon: Camera,
  },
  {
    name: "LiDAR",
    label: "Depth geometry",
    detail: "Obstacle geometry and depth reconstruction from the closed-loop environment.",
    icon: ScanSearch,
  },
  {
    name: "Radar",
    label: "Motion state",
    detail: "Relative range and velocity estimates for dynamic road users in the scenario set.",
    icon: Radar,
  },
] as const;

const objectCards = [
  { name: "Car", count: "42 tracked" },
  { name: "Two-wheeler", count: "18 tracked" },
  { name: "Pedestrian", count: "14 tracked" },
  { name: "Cattle", count: "06 tracked" },
] as const;

function NoiseBar({ label, value, max = 0.5, quality }: { label: string; value: number; max?: number; quality: string }) {
  const percent = Math.min((value / max) * 100, 100);
  const isPoor = quality === "poor";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <span>{label}</span>
        <span className={isPoor ? "text-warning" : "text-safe"}>{value.toFixed(2)}m · {quality}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary/60">
        <div
          className={`h-full rounded-full ${isPoor ? "bg-amber-400/90" : "bg-emerald-400/90"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/perception")({
  head: () => ({ meta: [
    { title: "Perception — MARGDRISHTI AI" },
    { name: "description", content: "Perception inputs and scene-object states from the MATLAB closed-loop simulation dataset for MARGDRISHTI AI." },
    { property: "og:title", content: "Perception System — MARGDRISHTI AI" },
    { property: "og:description", content: "Camera, LiDAR, and radar data from the measured SIH prototype simulation runs across 5 scenarios." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PerceptionPage,
});

function PerceptionPage() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="app-grid min-h-screen">
      <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
        <PageIntro
          eyebrow="Sensor perception"
          title="Perception layer across the closed-loop run set."
          description="Sensor coverage and scene-object observations from the SIH prototype runs across 5 scenarios and 50 MATLAB simulations."
          aside={<span className="system-label system-label-safe">50 runs · 5 scenarios</span>}
        />

        <div className="grid gap-5 md:grid-cols-3">
          {sensorCards.map(({ name, label, detail, icon: Icon }, index) => (
            <motion.article
              key={name}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: index * 0.08, ease: "easeOut" }}
              whileHover={reducedMotion ? undefined : { y: -5, scale: 1.01 }}
              className="glass-panel group h-full p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="icon-well"><Icon size={18} aria-hidden="true" /></span>
                <span className="system-label">{label}</span>
              </div>
              <h2 className="mt-6 font-display text-xl font-semibold text-foreground">{name}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
            </motion.article>
          ))}
        </div>

        <Panel title="Sensor complementarity" label="Fusion signal quality" className="mt-5">
          <div className="p-5 lg:p-6">
            <div className="mb-6 flex items-center justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 shadow-[0_0_20px_rgba(125,211,252,0.08)]">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(125,211,252,0.9)]" aria-hidden="true" />
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Fusion flow</p>
              </div>
            </div>

            <div className="relative grid gap-4 pb-2 md:grid-cols-3">
              {!reducedMotion ? (
                <motion.div
                  aria-hidden="true"
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.25, 0.7, 0.25] }}
                  transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
                  className="pointer-events-none absolute left-[14%] right-[14%] top-[48%] hidden h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent md:block"
                >
                  <motion.div
                    initial={{ x: "-12%" }}
                    animate={{ x: ["-12%", "110%"] }}
                    transition={{ duration: 2.8, ease: "linear", repeat: Infinity }}
                    className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_16px_rgba(125,211,252,0.9)]"
                  />
                </motion.div>
              ) : null}

              {sensorFusionData.map((sensor, index) => (
                <motion.article
                  key={sensor.name}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.38, delay: index * 0.08, ease: "easeOut" }}
                  whileHover={reducedMotion ? undefined : { y: -5, scale: 1.01 }}
                  className="glass-panel group h-full p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{sensor.name}</p>
                    <span className="system-label system-label-safe">{sensor.name === "Lidar" ? "Most accurate" : sensor.name === "Radar" ? "Complementary" : "Contextual"}</span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <NoiseBar label={sensor.axisA} value={sensor.valueA} quality={sensor.qualityA} />
                    <NoiseBar label={sensor.axisB} value={sensor.valueB} quality={sensor.qualityB} />
                  </div>

                  <p className="mt-5 text-sm leading-6 text-muted-foreground">{sensor.note}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </Panel>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            whileHover={reducedMotion ? undefined : { y: -5, scale: 1.01 }}
            className="glass-panel p-5 lg:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Track ID churn</p>
              <span className="system-label system-label-safe">4 real agents</span>
            </div>

            <div className="mt-5 flex items-end gap-3">
              <AnimatedNumber value="25.8" className="font-display text-4xl font-semibold tracking-[-0.06em] text-foreground md:text-5xl" decimals={1} />
              <div className="pb-2 text-2xl font-medium text-primary">→</div>
              <AnimatedNumber value="6.4" className="font-display text-4xl font-semibold tracking-[-0.06em] text-foreground md:text-5xl" decimals={1} />
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Track fragmentation when agents occlude each other; raising the confirmation threshold from 2 hits to 3 hits cut spurious tracks fourfold.
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
            whileHover={reducedMotion ? undefined : { y: -5, scale: 1.01 }}
            className="glass-panel p-5 lg:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="icon-well"><Gauge size={18} aria-hidden="true" /></span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Scaling note</p>
            </div>
            <p className="mt-5 text-base leading-7 text-foreground">
              ID churn remains stable <span className="font-semibold text-primary">(1.6 → 1.2 per agent)</span> from 4 to 25 agents — association does not degrade at this density.
            </p>
          </motion.article>
        </div>

        <Panel title="Detected Objects" label="Measured scene states" className="mt-5">
          <div className="grid gap-4 p-5 md:grid-cols-[1fr_1.5fr] lg:p-7">
            <div className="flex min-h-60 items-center justify-center rounded-[1.2rem] border border-dashed border-border bg-secondary/30">
              <div className="text-center">
                <ScanSearch className="mx-auto text-primary" size={40} />
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Detection feed</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {objectCards.map(({ name, count }, index) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.32, delay: index * 0.06, ease: "easeOut" }}
                  whileHover={reducedMotion ? undefined : { y: -4, scale: 1.01 }}
                  className="glass-panel flex items-center gap-3 p-4"
                >
                  <span className="icon-well h-10 w-10"><Box size={17} aria-hidden="true" /></span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">{count}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="mt-5 rounded-[1.4rem] border border-border/70 bg-card/25 p-5 lg:p-6">
          <div className="mb-5 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 shadow-[0_0_20px_rgba(125,211,252,0.08)]">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(125,211,252,0.9)]" aria-hidden="true" />
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Data fidelity</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[{ label: "Detection accuracy", value: "92%", icon: Activity }, { label: "Range confidence", value: "40 m", icon: Layers3 }, { label: "Fusion latency", value: "12.4 ms", icon: Radar }].map(({ label, value, icon: Icon }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
                whileHover={reducedMotion ? undefined : { y: -4, scale: 1.01 }}
                className="glass-panel p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                  <span className="icon-well h-10 w-10"><Icon size={18} aria-hidden="true" /></span>
                </div>
                <AnimatedNumber value={value} className="mt-4 block font-display text-3xl font-semibold tracking-[-0.05em] text-foreground" decimals={value.includes("%") ? 0 : 1} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}