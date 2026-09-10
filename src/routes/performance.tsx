import { createFileRoute } from "@tanstack/react-router";
import { MetricCard, PageIntro, Panel } from "@/components/margdrishti";

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

function PerformancePage() {
  return <div className="app-grid min-h-screen"><div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
    <PageIntro eyebrow="Measured performance" title="Closed-loop results at a glance." description="Overall measurements from 5 scenarios × 10 random seeds. Seeds vary sensor noise, missed detections, and false alarms—not traffic patterns." aside={<span className="system-label system-label-safe">50 simulation runs</span>} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Completion Rate" value="54%" detail="Overall scenario completion" tone="safe" />
      <MetricCard label="Collisions" value="19" detail="Moving-agent collisions" tone="warning" />
      <MetricCard label="Clearance" value="3.08 m" detail="Overall minimum clearance" />
      <MetricCard label="Replanning Latency" value="10.7 ms" detail="Mean closed-loop latency" />
    </div>
    <Panel title="Results Context" label="Measured" className="mt-5">
      <div className="grid gap-6 p-6 md:grid-cols-3">
        <div><p className="font-mono text-2xl text-foreground">05</p><p className="mt-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">Road scenarios</p></div>
        <div><p className="font-mono text-2xl text-foreground">10</p><p className="mt-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">Random seeds each</p></div>
        <div><p className="font-mono text-2xl text-safe">0</p><p className="mt-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">Static-obstacle hits</p></div>
      </div>
    </Panel>
  </div></div>;
}