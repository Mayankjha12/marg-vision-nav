import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { PageIntro, Panel, Pipeline, SimulationVisual } from "@/components/margdrishti";

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

function PlanningPage() {
  return (
    <div className="app-grid min-h-screen">
      <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
        <PageIntro
          eyebrow="Planning pipeline"
          title="Detect. Predict. Plan. Adapt."
          description="The adaptive path-planning sequence used in the SIH prototype, derived from MATLAB closed-loop simulations across 5 scenarios and 50 runs."
          aside={<span className="system-label">Pipeline active</span>}
        />

        <div className="grid gap-5 md:grid-cols-3">
          <Card className="group border-border/80 bg-card/80 shadow-[0_16px_38px_rgba(2,6,23,0.18)] transition-colors duration-200 ease-out hover:border-primary/30 hover:bg-card">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Kinematic feasibility</p>
              <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.06em] text-foreground">4.1m</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">vs vehicle limit · 3.5m</p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Every path clears this by construction — every search edge is a bicycle-model arc, so infeasible turns are never generated, not just filtered out.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-border/80 bg-card/80 shadow-[0_16px_38px_rgba(2,6,23,0.18)] transition-colors duration-200 ease-out hover:border-primary/30 hover:bg-card">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Path tracking accuracy</p>
              <div className="mt-4 space-y-2">
                <p className="font-display text-2xl font-semibold tracking-[-0.06em] text-foreground">0.329m</p>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">mean cross-track error</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Segment-based, correct metric vs 0.475m point-based sawtooth at ~14Hz. The controller didn’t get worse — the measurement got more honest.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                0.420m at 0.5m resampling vs 0.712m at native 2m spacing.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-border/80 bg-card/80 shadow-[0_16px_38px_rgba(2,6,23,0.18)] transition-colors duration-200 ease-out hover:border-primary/30 hover:bg-card">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Frenet vs Hybrid A*</p>
              <div className="mt-4 space-y-2">
                <p className="font-display text-2xl font-semibold tracking-[-0.06em] text-foreground">1.4ms</p>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Frenet plan time</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                7 candidate curves, fixed lattice vs Hybrid A* worst case 852ms / 28,779 nodes in dense unstructured field.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Frenet is used only where a centreline exists — that’s the cascade design, not a fallback.
              </p>
            </CardContent>
          </Card>
        </div>

        <Panel title="Planning Sequence" label="Measured flow" className="mt-5"><Pipeline /></Panel>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <Panel title="Candidate Path View" label="Urban intersection trace"><SimulationVisual compact variant="urban" /></Panel>
          <Panel title="Path State" label="Measured">
            <div className="space-y-4 p-5">
              {[['Current path', 'SAFE'], ['Candidate paths', '07'], ['Selected planner', 'FRENET'], ['Replanning', 'STANDBY']].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"><span className="text-xs text-muted-foreground">{label}</span><span className="font-mono text-xs font-semibold text-primary">{value}</span></div>)}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}