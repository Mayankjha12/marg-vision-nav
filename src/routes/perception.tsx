import { createFileRoute } from "@tanstack/react-router";
import { Box, ScanSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageIntro, Panel, SensorCard } from "@/components/margdrishti";

const sensorFusionData = [
  {
    name: "Camera",
    axisA: "Bearing noise",
    axisB: "Range noise",
    valueA: 0.08,
    valueB: 0.4,
    qualityA: "excellent",
    qualityB: "poor",
    note: "Depth from a single image is hard",
  },
  {
    name: "Radar",
    axisA: "Range noise",
    axisB: "Cross-range noise",
    valueA: 0.08,
    valueB: 0.35,
    qualityA: "excellent",
    qualityB: "poor",
    note: "Exactly inverted from camera — this complementarity is why we fuse both",
  },
  {
    name: "Lidar",
    axisA: "Range noise",
    axisB: "Cross-range noise",
    valueA: 0.05,
    valueB: 0.05,
    qualityA: "excellent",
    qualityB: "excellent",
    note: "~0.05m both axes, but range-limited to 40m and coarse for shape classification",
  },
];

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
  return (
    <div className="app-grid min-h-screen">
      <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
        <PageIntro
          eyebrow="Sensor perception"
          title="Perception layer across the closed-loop run set."
          description="Sensor coverage and scene-object observations recorded during the SIH prototype runs across 5 scenarios and 50 MATLAB simulations."
          aside={<span className="system-label system-label-safe">50 runs · 5 scenarios</span>}
        />

        <div className="grid gap-5 md:grid-cols-3">
          <SensorCard name="Camera" description="Road-object detection and scene context from the measured simulation dataset." />
          <SensorCard name="LiDAR" description="Depth reconstruction and obstacle geometry from the closed-loop environment." />
          <SensorCard name="Radar" description="Relative range and velocity estimates for dynamic road users in the scenario set." />
        </div>

        <Panel title="Sensor complementarity" label="Fusion signal quality" className="mt-5">
          <div className="grid gap-4 p-5 md:grid-cols-3 lg:p-6">
            {sensorFusionData.map((sensor) => (
              <Card key={sensor.name} className="group h-full border-border/80 bg-card/80 shadow-[0_16px_38px_rgba(2,6,23,0.18)] transition-colors duration-200 ease-out hover:border-primary/30 hover:bg-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{sensor.name}</p>
                    <span className="system-label system-label-safe">{sensor.name === "Lidar" ? "Most accurate" : sensor.name === "Radar" ? "Complementary" : "Contextual"}</span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <NoiseBar label={sensor.axisA} value={sensor.valueA} quality={sensor.qualityA} />
                    <NoiseBar label={sensor.axisB} value={sensor.valueB} quality={sensor.qualityB} />
                  </div>

                  <p className="mt-5 text-sm leading-6 text-muted-foreground">{sensor.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Panel>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/80 bg-card/80 shadow-[0_16px_38px_rgba(2,6,23,0.18)] transition-colors duration-200 ease-out hover:border-primary/30">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Track ID churn</p>
                <span className="system-label system-label-safe">4 real agents</span>
              </div>

              <div className="mt-5 flex items-end gap-3">
                <div className="font-display text-4xl font-semibold tracking-[-0.06em] text-foreground md:text-5xl">25.8</div>
                <div className="pb-2 text-2xl font-medium text-primary">→</div>
                <div className="font-display text-4xl font-semibold tracking-[-0.06em] text-foreground md:text-5xl">6.4</div>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Track fragmentation when agents occlude each other; raising the confirmation threshold from 2 hits to 3 hits cut spurious tracks fourfold.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/80 shadow-[0_16px_38px_rgba(2,6,23,0.18)] transition-colors duration-200 ease-out hover:border-primary/30">
            <CardContent className="p-5 lg:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Scaling note</p>
              <p className="mt-4 text-base leading-7 text-foreground">
                ID churn stays flat <span className="font-semibold text-primary">(1.6 → 1.2 per agent)</span> from 4 to 25 agents — association does not degrade at this density.
              </p>
            </CardContent>
          </Card>
        </div>

        <Panel title="Detected Objects" label="Measured scene states" className="mt-5">
          <div className="grid gap-4 p-5 md:grid-cols-[1fr_1.5fr] lg:p-7">
            <div className="flex min-h-60 items-center justify-center border border-dashed border-border bg-secondary/30"><div className="text-center"><ScanSearch className="mx-auto text-primary" size={40} /><p className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Detection feed</p></div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Car", "Two-wheeler", "Pedestrian", "Cattle"].map((item, index) => <div key={item} className="flex items-center gap-3 border border-border bg-secondary/30 p-4"><span className="icon-well h-10 w-10"><Box size={17} /></span><div><p className="text-sm font-semibold text-foreground">{item}</p><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">Road object 0{index + 1} · measured state</p></div></div>)}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}