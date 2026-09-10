import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, Panel, Pipeline, SimulationVisual } from "@/components/margdrishti";

export const Route = createFileRoute("/planning")({
  head: () => ({ meta: [
    { title: "Planning — MARGDRISHTI AI" },
    { name: "description", content: "Prototype planning pipeline from detection through adaptive replanning." },
    { property: "og:title", content: "Path Planning — MARGDRISHTI AI" },
    { property: "og:description", content: "Visualize the prototype flow from detection to path replanning." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PlanningPage,
});

function PlanningPage() {
  return <div className="app-grid min-h-screen"><div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
    <PageIntro eyebrow="Planning pipeline" title="Detect. Predict. Plan. Adapt." description="A simple visual skeleton of the adaptive path-planning sequence. Detailed candidate trajectories and replanning logic will follow." aside={<span className="system-label">Pipeline online</span>} />
    <Panel title="Planning Sequence" label="Concept flow"><Pipeline /></Panel>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
      <Panel title="Candidate Path View" label="Visualization placeholder"><SimulationVisual compact variant="urban" /></Panel>
      <Panel title="Path State" label="Simulated">
        <div className="space-y-4 p-5">
          {[['Current path', 'SAFE'], ['Candidate paths', '07'], ['Selected planner', 'FRENET'], ['Replanning', 'STANDBY']].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"><span className="text-xs text-muted-foreground">{label}</span><span className="font-mono text-xs font-semibold text-primary">{value}</span></div>)}
        </div>
      </Panel>
    </div>
  </div></div>;
}