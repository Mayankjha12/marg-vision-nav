import { createFileRoute } from "@tanstack/react-router";
import { Box, ScanSearch } from "lucide-react";
import { PageIntro, Panel, SensorPlaceholder } from "@/components/margdrishti";

export const Route = createFileRoute("/perception")({
  head: () => ({ meta: [
    { title: "Perception — MARGDRISHTI AI" },
    { name: "description", content: "Simulated sensor and object-detection placeholders for MARGDRISHTI AI." },
    { property: "og:title", content: "Perception System — MARGDRISHTI AI" },
    { property: "og:description", content: "A clearly labeled visualization of planned camera, LiDAR, and radar inputs." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PerceptionPage,
});

function PerceptionPage() {
  return <div className="app-grid min-h-screen"><div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
    <PageIntro eyebrow="Sensor perception" title="A unified view of the road." description="These panels are UI placeholders for simulated sensor sources. They do not represent physically measured sensor outputs." aside={<span className="system-label system-label-safe">Simulated values</span>} />
    <div className="grid gap-5 md:grid-cols-3">
      <SensorPlaceholder name="Camera" description="Visual object-detection and scene context placeholder." />
      <SensorPlaceholder name="LiDAR" description="Depth and obstacle-point visualization placeholder." />
      <SensorPlaceholder name="Radar" description="Relative range and velocity visualization placeholder." />
    </div>
    <Panel title="Detected Objects" label="Placeholder" className="mt-5">
      <div className="grid gap-4 p-5 md:grid-cols-[1fr_1.5fr] lg:p-7">
        <div className="flex min-h-60 items-center justify-center border border-dashed border-border bg-secondary/30"><div className="text-center"><ScanSearch className="mx-auto text-primary" size={40} /><p className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">Detection feed</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {["Car", "Two-wheeler", "Pedestrian", "Cattle"].map((item, index) => <div key={item} className="flex items-center gap-3 border border-border bg-secondary/30 p-4"><span className="icon-well h-10 w-10"><Box size={17} /></span><div><p className="text-sm font-semibold text-foreground">{item}</p><p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">Object 0{index + 1} / simulated</p></div></div>)}
        </div>
      </div>
    </Panel>
  </div></div>;
}