import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Camera,
  CarFront,
  Clock3,
  Code2,
  Cpu,
  Gauge,
  Map,
  Radar,
  Route as RouteIcon,
  ScanLine,
  ShieldAlert,
  Users,
} from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const navItems = [
  { to: "/" as const, label: "Dashboard" },
  { to: "/scenarios" as const, label: "Scenarios" },
  { to: "/perception" as const, label: "Perception" },
  { to: "/planning" as const, label: "Planning" },
  { to: "/performance" as const, label: "Performance" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isPerformancePage = location.pathname === "/performance";

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
            className={`flex items-center justify-between gap-3 rounded-full border border-white/10 bg-[#050d1a]/90 px-2 py-2.5 shadow-[0_22px_60px_rgba(2,6,23,0.7)] backdrop-blur-2xl transition-all duration-200 ease-out ${
              scrolled ? "bg-[#050d1a]/95" : "bg-[#050d1a]/90"
            }`}
          >
            <Link to="/" className="group flex min-w-fit items-center gap-2.5 rounded-full py-1.5 pl-1 pr-2 transition-transform duration-200 ease-out hover:scale-[1.01]" aria-label="MARGDRISHTI AI dashboard">
              <span className="brand-mark h-8 w-8 text-[0.9rem]">
                <RouteIcon aria-hidden="true" size={16} />
              </span>
              <span className="font-display text-[0.96rem] font-semibold tracking-[-0.04em] text-foreground">MARGDRISHTI <span className="text-primary">AI</span></span>
            </Link>

            <nav className="nav-scroll mx-auto flex max-w-[740px] items-center justify-center gap-1 overflow-x-auto rounded-full px-1 py-1" aria-label="Primary navigation">
              {navItems.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  className="nav-link"
                  activeProps={{ className: "nav-link nav-link-active" }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex min-w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1.5 pr-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-safe">
              <span className="status-pulse" aria-hidden="true" />
              <span className="hidden sm:inline">Simulation live</span>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>

      {/* Limitations section conditionally rendered only on /performance page */}
      {isPerformancePage && (
        <section className="mx-auto max-w-[1460px] px-4 pb-0 pt-8 md:px-4">
          <div className="mb-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-primary/80">
              <span className="h-px w-8 bg-primary/50" />
              platform limits
              <span className="h-px w-8 bg-primary/50" />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.05em] text-foreground md:text-3xl">Limitations & Scope</h2>
          </div>

          <div className="relative overflow-hidden rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.7),rgba(9,13,24,0.9))] shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
            <div className="rounded-[1.2rem] border border-white/5 bg-slate-950/40">
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current scope</span>
                <span className="inline-flex items-center rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-primary/90">Scope</span>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    value: "agents",
                    title: "Agents in all scenarios are non-cooperative",
                    icon: Users,
                    description: "Agents in all scenarios are non-cooperative — they follow fixed scripts and do not avoid the ego vehicle. Every scenario here is a worst-case test where the entire avoidance burden falls on the ego vehicle.",
                  },
                  {
                    value: "latency",
                    title: "Worst-case replan latency is bounded, not unbounded",
                    icon: Clock3,
                    description: "Worst-case replan latency (305.6ms in Dense Market) exceeds the 100ms budget, but is bounded — an expansion cap limits the search, and on failure the previous path is held for one cycle. A stale path for 100ms is safer than no path.",
                  },
                  {
                    value: "matlab",
                    title: "Base MATLAB implementation",
                    icon: Code2,
                    description: "Runs entirely on base MATLAB — no toolboxes required. Every algorithm is a standalone function that can become a Simulink MATLAB Function block directly.",
                  },
                ].map(({ value, title, description, icon: Icon }) => (
                  <AccordionItem key={value} value={value} className="border-b border-border/60 last:border-b-0">
                    <AccordionTrigger className="group flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-foreground transition-all duration-200 ease-out hover:no-underline data-[state=open]:bg-primary/[0.03] data-[state=open]:text-foreground">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary shadow-[inset_0_0_18px_rgba(125,211,252,0.06)] transition-all duration-200 ease-out group-hover:border-primary/30 group-hover:bg-primary/8">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-left">{title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 text-sm leading-6 text-muted-foreground">
                      <div className="ml-11 rounded-xl border-l border-primary/15 pl-4 text-[0.93rem] text-muted-foreground/90">
                        {description}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      )}

      <footer className="site-footer relative mt-8 overflow-hidden border-t border-border px-4 pb-5 pt-0 text-xs text-muted-foreground">
        <div aria-hidden="true" className="site-footer__glow" />
        <div aria-hidden="true" className="site-footer__spark" />

        <div className="mx-auto max-w-[1460px] py-6 md:py-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="brand-mark"><RouteIcon aria-hidden="true" size={18} /></span>
                <div className="font-display text-sm font-bold tracking-[0.12em] text-foreground">MARGDRISHTI <span className="text-primary">AI</span></div>
              </div>
              <div className="text-[0.62rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">Autonomous Systems Lab</div>
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-foreground">Navigate</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {[
                  { to: "/", label: "Dashboard" },
                  { to: "/scenarios", label: "Scenarios" },
                  { to: "/perception", label: "Perception" },
                  { to: "/planning", label: "Planning" },
                  { to: "/performance", label: "Performance" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="footer-link inline-flex rounded-full px-0 py-0.5 text-muted-foreground transition-all duration-200 ease-out">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-foreground">Results</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>54% completion</li>
                <li>32x prediction gain</li>
                <li>249x planning speed</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-foreground">Scope</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>Base MATLAB</li>
                <li>5 scenarios</li>
                <li>50 closed-loop runs</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-border pt-3 text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="text-foreground/85">© 2026 MARGDRISHTI AI</span>
            <span className="text-foreground/90">Measured, not estimated.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, aside, titleClassName }: { eyebrow: string; title: ReactNode; description: string; aside?: ReactNode; titleClassName?: string }) {
  return (
    <div className="mb-8 flex flex-col items-center justify-between gap-5 border-b border-border pb-7 text-center">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <span className="h-px w-6 bg-primary" />{eyebrow}
        </div>
        <h1 className={['font-display block overflow-hidden text-3xl font-semibold tracking-[-0.05em] text-foreground md:text-5xl', titleClassName].filter(Boolean).join(' ')}>{title}</h1>
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
  "Village Road": "/VID-20260909-WA0104.mp4",
  "Urban Intersection": "/VID-20260909-WA0103.mp4",
  "Highway Merge": "/VID-20260909-WA0105.mp4",
  "Dense Market": "/VID-20260909-WA0106.mp4",
  "Cattle Crossing": "/VID-20260909-WA0107.mp4"
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
      <div className={`flex h-full min-h-[16rem] items-center justify-center border border-dashed border-border bg-secondary/30 ${className}`} onClick={onClick}>
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
    <div className={`group relative h-full min-h-[16rem] overflow-hidden ${className}`} onClick={onClick}>
      <video
        src={src}
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        muted
        playsInline
        autoPlay={autoPlay}
        loop={loop}
        preload="metadata"
        onError={() => setVideoError(true)}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_28%),linear-gradient(to_top,rgba(2,6,23,0.8),rgba(2,6,23,0.08),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 pb-3 pt-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-200">{label}</span>
        {active ? <span className="system-label system-label-safe">Playing</span> : <span className="system-label">Preview</span>}
      </div>
    </div>
  );
}
