import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CarFront, Route as RouteIcon, ScanLine } from "lucide-react";
import { MetricCard, PageIntro, Panel, SimulationVisual } from "@/components/margdrishti";

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

function DashboardPage() {
  return (
    <div className="app-grid min-h-[calc(100vh-5rem)]">
      <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
        <PageIntro
          eyebrow="Adaptive path planning & collision avoidance"
          title="Indian roads. Unstructured motion. Adaptive intelligence."
          description="A demonstration interface for visualizing perception, prediction, and path planning in closed-loop road scenarios."
          aside={<span className="system-label">SIH prototype / UI visualization</span>}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Panel title="Live Simulation" label="Visualization placeholder">
            <SimulationVisual />
          </Panel>
          <aside className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <MetricCard label="System State" value="SAFE" detail="Illustrative path status" tone="safe" />
            <MetricCard label="Tracked Objects" value="04" detail="Simulated demonstration values" />
            <MetricCard label="Active Planner" value="FRENET" detail="Planning mode placeholder" />
          </aside>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {[
            { icon: ScanLine, title: "Perception", text: "Camera, LiDAR, and radar visualization placeholders.", to: "/perception" as const },
            { icon: RouteIcon, title: "Path Planning", text: "Basic planning pipeline and trajectory concept.", to: "/planning" as const },
            { icon: Activity, title: "Measured Results", text: "A concise view of overall closed-loop results.", to: "/performance" as const },
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