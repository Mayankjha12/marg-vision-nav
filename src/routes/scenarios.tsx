import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SimulationVisual } from "@/components/margdrishti";

export const Route = createFileRoute("/scenarios")({
  head: () => ({ meta: [
    { title: "Scenarios — MARGDRISHTI AI" },
    { name: "description", content: "Five prototype road environments for the MARGDRISHTI AI demonstration." },
    { property: "og:title", content: "Road Scenarios — MARGDRISHTI AI" },
    { property: "og:description", content: "Explore five unstructured Indian road simulation concepts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ScenariosPage,
});

const scenarios = [
  { name: "Village Road", code: "SCN-01", variant: "village" as const, detail: "Narrow, unmarked road with mixed traffic." },
  { name: "Urban Intersection", code: "SCN-02", variant: "urban" as const, detail: "Unsignalized crossing with multiple agents." },
  { name: "Highway Merge", code: "SCN-03", variant: "highway" as const, detail: "High-speed traffic and merging movement." },
  { name: "Dense Market", code: "SCN-04", variant: "market" as const, detail: "Pedestrians, two-wheelers, and occlusion." },
  { name: "Cattle Crossing", code: "SCN-05", variant: "cattle" as const, detail: "Sudden carriageway obstruction response." },
];

function ScenariosPage() {
  return (
    <div className="app-grid min-h-screen"><div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
      <PageIntro eyebrow="Scenario library" title="Five roads. Five planning challenges." description="Static preview cards for the prototype's planned scenario demonstrations. Interactive scenario runs will be added later." aside={<span className="system-label">5 scenarios</span>} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario, index) => (
          <article key={scenario.name} className={`glass-panel ${index === 0 ? "xl:col-span-2" : ""}`}>
            <SimulationVisual compact variant={scenario.variant} />
            <div className="flex items-start justify-between gap-4 border-t border-border p-5">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">{scenario.code}</p><h2 className="mt-2 font-display text-xl font-semibold text-foreground">{scenario.name}</h2><p className="mt-2 text-sm text-muted-foreground">{scenario.detail}</p></div>
              <span className="system-label">Preview</span>
            </div>
          </article>
        ))}
      </div>
    </div></div>
  );
}