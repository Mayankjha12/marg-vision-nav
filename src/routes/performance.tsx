import { createFileRoute } from "@tanstack/react-router";
import { MetricCard, PageIntro, Panel } from "@/components/margdrishti";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    description: "High-speed traffic merging scenario.",
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
  return (
    <TooltipProvider delayDuration={120}>
      <div className="app-grid min-h-screen">
        <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
          <PageIntro
            eyebrow="Measured performance"
            title="Closed-loop results at a glance."
            description="Overall measurements from 5 scenarios × 10 random seeds. Seeds vary sensor noise, missed detections, and false alarms—not traffic patterns."
            aside={<span className="system-label system-label-safe">50 simulation runs</span>}
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Completion Rate" value="54%" detail="Overall scenario completion" tone="safe" />
            <MetricCard label="Collisions" value="19" detail="Moving-agent collisions" tone="warning" />
            <MetricCard label="Clearance" value="3.08 m" detail="Overall minimum clearance" />
            <MetricCard label="Replanning Latency" value="10.7 ms" detail="Mean closed-loop latency" />
            <MetricCard label="P95 Latency" value="23.7 ms" detail="95th percentile latency" />
            <MetricCard label="Worst-case Latency" value="305.6 ms" detail="Peak observed latency" tone="warning" />
          </div>

          <p className="mt-3 max-w-3xl text-xs leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">Bounded, not unbounded</span> — expansion cap + path-hold cascade prevents overrun.
          </p>

          <Panel title="Scenario breakdown" label="Per scenario" className="mt-6">
            <div className="hidden overflow-hidden rounded-b-xl lg:block">
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-left transition-colors hover:text-primary">
                              {scenario.name}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[280px] border border-white/10 bg-slate-950/95 text-xs leading-5 text-slate-200 shadow-2xl">
                            {scenario.description}
                          </TooltipContent>
                        </Tooltip>
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

            <div className="grid gap-3 p-4 lg:hidden">
              {scenarioRows.map((scenario) => (
                <article key={scenario.name} className="rounded-2xl border border-border bg-card/60 p-4 shadow-[0_10px_30px_rgba(3,7,18,0.18)]">
                  <div className="flex items-center justify-between gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-left font-medium text-foreground transition-colors hover:text-primary">
                          {scenario.name}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[290px] border border-white/10 bg-slate-950/95 text-xs leading-5 text-slate-200 shadow-2xl">
                        {scenario.description}
                      </TooltipContent>
                    </Tooltip>
                    <span className="system-label system-label-safe">{scenario.completion}</span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl border border-border bg-background/40 p-2">
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Collisions</dt>
                      <dd className="mt-1 font-mono text-base text-foreground">{scenario.collisions}</dd>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-2">
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Static hits</dt>
                      <dd className="mt-1 font-mono text-base text-foreground">{scenario.staticHits}</dd>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-2">
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Min clearance</dt>
                      <dd className="mt-1 font-mono text-base text-foreground">{scenario.clearance}</dd>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-2">
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Lat mean</dt>
                      <dd className="mt-1 font-mono text-base text-foreground">{scenario.latMean}</dd>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-2">
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Lat max</dt>
                      <dd className="mt-1 font-mono text-base text-foreground">{scenario.latMax}</dd>
                    </div>
                    <div className="rounded-xl border border-border bg-background/40 p-2">
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Fail%</dt>
                      <dd className="mt-1 font-mono text-base text-foreground">{scenario.fail}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 rounded-xl border border-border bg-background/40 p-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Frenet/A*</span> {scenario.split}
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Results Context" label="Measured" className="mt-5">
            <div className="grid gap-6 p-6 md:grid-cols-3">
              <div><p className="font-mono text-2xl text-foreground">05</p><p className="mt-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">Road scenarios</p></div>
              <div><p className="font-mono text-2xl text-foreground">10</p><p className="mt-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">Random seeds each</p></div>
              <div><p className="font-mono text-2xl text-safe">0</p><p className="mt-2 text-xs uppercase tracking-[0.13em] text-muted-foreground">Static-obstacle hits</p></div>
            </div>
          </Panel>
        </div>
      </div>
    </TooltipProvider>
  );
}
