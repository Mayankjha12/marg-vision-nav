import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Camera,
  CarFront,
  Cpu,
  Gauge,
  Map,
  Radar,
  Route as RouteIcon,
  ScanLine,
} from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { to: "/" as const, label: "Dashboard", icon: Gauge },
  { to: "/scenarios" as const, label: "Scenarios", icon: Map },
  { to: "/perception" as const, label: "Perception", icon: ScanLine },
  { to: "/planning" as const, label: "Planning", icon: RouteIcon },
  { to: "/performance" as const, label: "Performance", icon: Activity },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-[1600px] items-center gap-8 px-4 lg:px-8">
          <Link to="/" className="group flex min-w-fit items-center gap-3" aria-label="MARGDRISHTI AI dashboard">
            <span className="brand-mark"><RouteIcon aria-hidden="true" size={20} /></span>
            <span>
              <span className="block font-display text-base font-bold tracking-[0.08em] text-foreground">MARGDRISHTI <span className="text-primary">AI</span></span>
              <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">Autonomous systems lab</span>
            </span>
          </Link>

          <nav className="nav-scroll order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-border py-2 lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:border-0 lg:py-0" aria-label="Primary navigation">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="nav-link"
                activeProps={{ className: "nav-link nav-link-active" }}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex min-w-fit items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-safe">
            <span className="status-pulse" aria-hidden="true" />
            Simulation active
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border px-4 py-7 text-center text-xs text-muted-foreground">
        Prototype visualization based on measured closed-loop simulation results.
      </footer>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description: string; aside?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end">
      <div className="max-w-3xl">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <span className="h-px w-6 bg-primary" />{eyebrow}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-normal text-foreground md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
      </div>
      {aside}
    </div>
  );
}

export function Panel({ title, label, children, className = "" }: { title: string; label?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`glass-panel ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{title}</h2>
        {label ? <span className="system-label">{label}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ label, value, detail, tone = "default" }: { label: string; value: string; detail: string; tone?: "default" | "safe" | "warning" }) {
  return (
    <article className="metric-card">
      <div className={`metric-accent metric-${tone}`} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-4 font-mono text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

export function SimulationVisual({ compact = false, variant = "village" }: { compact?: boolean; variant?: "village" | "urban" | "highway" | "market" | "cattle" }) {
  return (
    <div className={`simulation-stage simulation-${variant} ${compact ? "simulation-compact" : ""}`}>
      <div className="stage-grid" />
      <div className="road-strip">
        <span className="road-edge road-edge-left" />
        <span className="road-edge road-edge-right" />
        <span className="road-mark road-mark-one" />
        <span className="road-mark road-mark-two" />
        <span className="road-mark road-mark-three" />
      </div>
      <div className="path-line path-line-shadow" />
      <div className="path-line" />
      <div className="vehicle vehicle-ego"><CarFront size={compact ? 13 : 18} aria-label="Autonomous vehicle" /></div>
      <div className="vehicle vehicle-agent"><CarFront size={compact ? 11 : 15} aria-label="Simulated road user" /></div>
      <span className="obstacle obstacle-one" />
      <span className="obstacle obstacle-two" />
      {!compact && (
        <>
          <div className="sim-hud sim-hud-top"><span className="status-pulse" /> LIVE SIMULATION</div>
          <div className="sim-hud sim-hud-bottom">PATH 01 / SAFE</div>
          <div className="scan-sweep" />
        </>
      )}
    </div>
  );
}

const sensorIcons = { Camera, LiDAR: Radar, Radar };

export function SensorPlaceholder({ name, description }: { name: keyof typeof sensorIcons; description: string }) {
  const Icon = sensorIcons[name];
  return (
    <article className="glass-panel p-5">
      <div className="flex items-start justify-between">
        <span className="icon-well"><Icon size={22} aria-hidden="true" /></span>
        <span className="system-label system-label-safe">Simulated</span>
      </div>
      <h2 className="mt-7 font-display text-lg font-semibold text-foreground">{name}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-safe"><span className="status-dot" /> Signal available</div>
    </article>
  );
}

export function Pipeline() {
  const steps = [
    { label: "Detection", icon: ScanLine },
    { label: "Prediction", icon: Activity },
    { label: "Planning", icon: RouteIcon },
    { label: "Replanning", icon: Cpu },
  ];
  return (
    <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center lg:p-8">
      {steps.map(({ label, icon: Icon }, index) => (
        <div className="contents" key={label}>
          <div className="pipeline-step">
            <span className="icon-well"><Icon size={22} aria-hidden="true" /></span>
            <span className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-foreground">{label}</span>
            <span className="mt-2 font-mono text-[10px] text-muted-foreground">0{index + 1} / ACTIVE</span>
          </div>
          {index < steps.length - 1 ? <ArrowRight className="mx-auto rotate-90 text-primary md:rotate-0" size={18} aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}