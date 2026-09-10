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
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const navItems = [
  { to: "/" as const, label: "Dashboard", icon: Gauge },
  { to: "/scenarios" as const, label: "Scenarios", icon: Map },
  { to: "/perception" as const, label: "Perception", icon: ScanLine },
  { to: "/planning" as const, label: "Planning", icon: RouteIcon },
  { to: "/performance" as const, label: "Performance", icon: Activity },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 px-2 pt-2 md:px-4">
        <div className="mx-auto max-w-[1460px]">
          <div
            className={`flex items-center justify-between gap-2 rounded-full border border-white/10 bg-[#0b1220]/75 px-1.5 py-1.5 shadow-[0_18px_48px_rgba(2,6,23,0.68),0_0_0_1px_rgba(148,163,184,0.08)] backdrop-blur-2xl transition-all duration-200 ease-out ${
              scrolled ? "bg-[#0b1220]/88 shadow-[0_22px_62px_rgba(2,6,23,0.8),0_0_0_1px_rgba(148,163,184,0.12)]" : "bg-[#0b1220]/75"
            }`}
          >
            <Link to="/" className="group flex min-w-fit items-center gap-3 rounded-full pl-2 pr-2.5 py-1.5 transition-transform duration-200 ease-out hover:scale-[1.01]" aria-label="MARGDRISHTI AI dashboard">
              <span className="brand-mark"><RouteIcon aria-hidden="true" size={20} /></span>
              <span>
                <span className="block font-display text-[0.94rem] font-bold tracking-[0.08em] text-foreground">MARGDRISHTI <span className="text-primary">AI</span></span>
                <span className="hidden text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:block">Autonomous systems lab</span>
              </span>
            </Link>

            <nav className="nav-scroll mx-auto flex w-full max-w-[640px] flex-1 items-center justify-center gap-0.5 overflow-x-auto rounded-full px-1 py-1" aria-label="Primary navigation">
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

            <div className="ml-auto flex min-w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2 py-1.5 pr-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-safe">
              <span className="status-pulse" aria-hidden="true" />
              <span className="hidden sm:inline">Simulation active</span>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>

      <section className="mx-auto max-w-[1460px] px-4 pb-0 pt-8 md:px-4">
        <div className="glass-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Limitations & Scope</h2>
            <span className="system-label">Scope</span>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="agents" className="border-b-0">
              <AccordionTrigger className="px-5 text-left text-sm font-medium text-foreground hover:no-underline">
                Agents in all scenarios are non-cooperative
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 text-sm leading-6 text-muted-foreground">
                Agents in all scenarios are non-cooperative — they follow fixed scripts and do not avoid the ego vehicle. Every scenario here is a worst-case test where the entire avoidance burden falls on the ego vehicle.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="latency" className="border-b-0">
              <AccordionTrigger className="px-5 text-left text-sm font-medium text-foreground hover:no-underline">
                Worst-case replan latency is bounded, not unbounded
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 text-sm leading-6 text-muted-foreground">
                Worst-case replan latency (305.6ms in Dense Market) exceeds the 100ms budget, but is bounded — an expansion cap limits the search, and on failure the previous path is held for one cycle. A stale path for 100ms is safer than no path.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="matlab" className="border-b-0">
              <AccordionTrigger className="px-5 text-left text-sm font-medium text-foreground hover:no-underline">
                Base MATLAB implementation
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5 text-sm leading-6 text-muted-foreground">
                Runs entirely on base MATLAB — no toolboxes required. Every algorithm is a standalone function that can become a Simulink MATLAB Function block directly.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-7 text-center text-xs text-muted-foreground">
        Prototype visualization based on measured closed-loop simulation results.
      </footer>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, aside }: { eyebrow: string; title: ReactNode; description: string; aside?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col items-center justify-between gap-5 border-b border-border pb-7 text-center">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <span className="h-px w-6 bg-primary" />{eyebrow}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
      </div>
      {aside ? <div className="mx-auto">{aside}</div> : null}
    </div>
  );
}

function formatAnimatedValue(rawValue: string) {
  const digits = parseFloat(rawValue.replace(/[^\d.\-]/g, ""));
  if (Number.isNaN(digits)) return null;

  const suffix = rawValue.replace(/[\d.\-]/g, "").trim();
  return { digits, suffix };
}

export function AnimatedNumber({ value, className, decimals = 0 }: { value: string; className?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const reducedMotion = useReducedMotion();
  const { digits, suffix } = formatAnimatedValue(value) ?? { digits: 0, suffix: "" };
  const [displayValue, setDisplayValue] = useState(reducedMotion ? digits : 0);

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setDisplayValue(digits);
      return;
    }

    let frame = 0;
    let startTimestamp: number | null = null;
    const duration = 1200;

    const animate = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(digits * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [digits, inView, reducedMotion]);

  const formatted = Number(displayValue).toLocaleString(undefined, {
    minimumFractionDigits: digits % 1 === 0 ? 0 : decimals,
    maximumFractionDigits: digits % 1 === 0 ? 0 : decimals,
  });

  return <span ref={ref} className={className}>{formatted}{suffix}</span>;
}

export function TextReveal({ text }: { text: string }) {
  const reducedMotion = useReducedMotion();
  const words = text.split(" ");

  if (reducedMotion) {
    return <>{text}</>;
  }

  return (
    <>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.08 }}
          className="inline-block"
        >
          {index > 0 ? " " : ""}
          {word}
        </motion.span>
      ))}
    </>
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
  const reducedMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const formattedValue = formatAnimatedValue(value);

  return (
    <motion.article
      whileHover={reducedMotion ? undefined : { y: -3, rotateX: 1.5, rotateY: -1.5 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onMouseMove={reducedMotion ? undefined : (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
      className="metric-card group"
      style={{
        background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 32%)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div className={`metric-accent metric-${tone}`} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      {formattedValue ? (
        <AnimatedNumber value={value} className="mt-4 block font-mono text-3xl font-semibold text-foreground" decimals={formattedValue.digits % 1 === 0 ? 0 : 2} />
      ) : (
        <p className="mt-4 font-mono text-3xl font-semibold text-foreground">{value}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </motion.article>
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

export function SensorCard({ name, description }: { name: keyof typeof sensorIcons; description: string }) {
  const Icon = sensorIcons[name];
  return (
    <article className="glass-panel p-5">
      <div className="flex items-start justify-between">
        <span className="icon-well"><Icon size={22} aria-hidden="true" /></span>
        <span className="system-label system-label-safe">Measured</span>
      </div>
      <h2 className="mt-7 font-display text-lg font-semibold text-foreground">{name}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-safe"><span className="status-dot" /> Signal tracked</div>
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

export const scenarioVideoPaths = {
  "Village Road": "/videos/village-road.mp4",
  "Urban Intersection": "/videos/urban-intersection.mp4",
  "Highway Merge": "/videos/highway-merge.mp4",
  "Dense Market": "/videos/dense-market.mp4",
  "Cattle Crossing": "/videos/cattle-crossing.mp4",
} as const;

export function ScenarioVideoPlayer({
  src,
  label,
  loop = false,
  autoPlay = false,
  active = false,
  className = "",
  onClick,
}: {
  src: string;
  label: string;
  loop?: boolean;
  autoPlay?: boolean;
  active?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const [videoError, setVideoError] = useState(false);

  if (videoError) {
    return (
      <div className={`flex h-56 items-center justify-center border border-dashed border-border bg-secondary/30 ${className}`} onClick={onClick}>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <CarFront size={18} aria-hidden="true" />
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-xs text-muted-foreground">Video asset pending</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} onClick={onClick}>
      <video
        src={src}
        className="h-56 w-full object-cover"
        muted
        playsInline
        autoPlay={autoPlay}
        loop={loop}
        preload="metadata"
        onError={() => setVideoError(true)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 pb-3 pt-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-200">{label}</span>
        {active ? <span className="system-label system-label-safe">Playing</span> : <span className="system-label">Preview</span>}
      </div>
    </div>
  );
}