import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CarFront, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageIntro, scenarioVideoPaths } from "@/components/margdrishti";

export const Route = createFileRoute("/scenarios")({
  head: () => ({ meta: [
    { title: "Scenarios — MARGDRISHTI AI" },
    { name: "description", content: "Five measured road scenarios from the MATLAB closed-loop simulation dataset for the MARGDRISHTI AI prototype." },
    { property: "og:title", content: "Road Scenarios — MARGDRISHTI AI" },
    { property: "og:description", content: "Explore five unstructured Indian-road scenarios from the measured SIH simulation run set." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ScenariosPage,
});

const scenarioProfiles = [
  {
    name: "Village Road",
    code: "SCN-01",
    tag: "unmarked lanes, pedestrians, livestock",
    detail: "No centreline, moderate density — validates the core unstructured-planning claim.",
    metrics: { completion: "90%", collisions: 0, clearance: "5.36 m" },
  },
  {
    name: "Urban Intersection",
    code: "SCN-02",
    tag: "unsignalized crossing, dense crossings",
    detail: "5 agents, no right of way, no signalling — 1.39m clearance shows tight but successful gap-threading.",
    metrics: { completion: "40%", collisions: 6, clearance: "1.39 m" },
  },
  {
    name: "Highway Merge",
    code: "SCN-03",
    tag: "high-speed merge, short gap decisions",
    detail: "6 agents, tight gap acceptance window — 1 collision from a late-merge decision.",
    metrics: { completion: "80%", collisions: 1, clearance: "4.56 m" },
  },
  {
    name: "Dense Market",
    code: "SCN-04",
    tag: "pedestrians, two-wheelers, occlusion",
    detail: "9 agents, 32m corridor, heavy mutual occlusion — track re-birth loses velocity estimate mid-scenario.",
    metrics: { completion: "20%", collisions: 7, clearance: "1.19 m" },
  },
  {
    name: "Cattle Crossing",
    code: "SCN-05",
    tag: "sudden obstruction, emergency braking",
    detail: "Cattle occluded by parked truck until entering carriageway, zero initial velocity — tests emergency braking, not prediction.",
    metrics: { completion: "40%", collisions: 5, clearance: "2.93 m" },
  },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

function TopLine() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
    />
  );
}

function completionTone(completion: string) {
  const value = parseInt(completion, 10);
  if (value >= 70) return "bg-emerald-400/80";
  if (value >= 40) return "bg-primary/80";
  return "bg-amber-400/80";
}

function ScenarioCard({
  scenario,
  isSelected,
  modalOpen,
  animate,
  onOpen,
}: {
  scenario: (typeof scenarioProfiles)[number];
  isSelected: boolean;
  modalOpen: boolean;
  animate: boolean;
  onOpen: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Video sirf screen ke paas aane par load hota hai
  useEffect(() => {
    if (reducedMotion) {
      setShouldLoad(false);
      return;
    }

    const element = videoRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => setShouldLoad(entries[0].isIntersecting),
      { rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // Modal khula ho to preview ruk jata hai
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!shouldLoad || reducedMotion || modalOpen) {
      video.pause();
      return;
    }

    video.muted = true;
    video.play().catch(() => undefined);
  }, [shouldLoad, reducedMotion, modalOpen]);

  const source = scenarioVideoPaths[scenario.name as keyof typeof scenarioVideoPaths];
  const barColor = completionTone(scenario.metrics.completion);
  const percent = Math.min(parseInt(scenario.metrics.completion, 10) || 0, 100);

  const chip =
    "rounded-full border border-border/80 bg-background/25 px-2 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-foreground/80";

  const placeholder = (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_40%_30%,rgba(125,211,252,0.1),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(9,13,24,0.95))]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary">
        <CarFront size={16} aria-hidden="true" />
      </div>
    </div>
  );

  return (
    <motion.article
      variants={animate ? cardVariants : undefined}
      role="button"
      tabIndex={0}
      aria-label={`Open ${scenario.name} scenario`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={`group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-card/40 transition-[border-color,background-color,box-shadow] duration-300 hover:bg-card/60 hover:shadow-[0_14px_36px_rgba(2,6,23,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] ${
        isSelected ? "border-primary/40" : "border-border/80 hover:border-primary/30"
      }`}
    >
      <TopLine />

      {/* Video */}
      <div className="relative aspect-video overflow-hidden border-b border-border/60">
        {reducedMotion || videoError ? (
          placeholder
        ) : (
          <video
            ref={videoRef}
            src={shouldLoad ? source : undefined}
            muted
            loop
            playsInline
            autoPlay={shouldLoad}
            preload="metadata"
            onError={() => setVideoError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,23,0.5),transparent_55%)]" />

        <span className="absolute bottom-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-slate-100 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <Play size={12} className="translate-x-[1px]" aria-hidden="true" />
        </span>
      </div>

      {/* Details: pehle jaisa text style */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">{scenario.code}</p>
          <span className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Preview
          </span>
        </div>

        <h2 className="mt-1.5 font-display text-lg font-semibold text-foreground">{scenario.name}</h2>

        <p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">
          {scenario.name} — {scenario.tag}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={chip}>{scenario.metrics.completion}</span>
          <span className={chip}>{scenario.metrics.collisions} col</span>
          <span className={chip}>{scenario.metrics.clearance}</span>
        </div>

        {/* Completion bar */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary/60">
          <motion.div
            initial={animate ? { width: 0 } : false}
            whileInView={{ width: `${percent}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease, delay: 0.3 }}
            className={`h-full rounded-full ${barColor}`}
            style={animate ? undefined : { width: `${percent}%` }}
          />
        </div>
      </div>
    </motion.article>
  );
}

function ScenariosPage() {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = reducedMotion !== true;

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const activeIndex = selectedScenario ? scenarioProfiles.findIndex((scenario) => scenario.name === selectedScenario) : -1;
  const activeScenario = activeIndex >= 0 ? scenarioProfiles[activeIndex] : null;

  const closeModal = () => {
    setSelectedScenario(null);
    setIsPlaying(false);
  };

  const goToScenario = (direction: number) => {
    if (activeIndex < 0) return;
    const nextIndex = (activeIndex + direction + scenarioProfiles.length) % scenarioProfiles.length;
    setSelectedScenario(scenarioProfiles[nextIndex].name);
    setIsPlaying(true);
  };

  // Keyboard: Esc band, left/right se scenario badalna
  useEffect(() => {
    if (!selectedScenario) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedScenario(null);
        setIsPlaying(false);
      }

      if (event.key === "ArrowRight") {
        const nextIndex = activeIndex === scenarioProfiles.length - 1 ? 0 : activeIndex + 1;
        setSelectedScenario(scenarioProfiles[nextIndex].name);
        setIsPlaying(true);
      }

      if (event.key === "ArrowLeft") {
        const prevIndex = activeIndex === 0 ? scenarioProfiles.length - 1 : activeIndex - 1;
        setSelectedScenario(scenarioProfiles[prevIndex].name);
        setIsPlaying(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedScenario, activeIndex]);

  // Modal khula ho to peeche ka page scroll na kare
  useEffect(() => {
    if (!selectedScenario) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedScenario]);

  // Naya scenario khulne par video shuru se
  useEffect(() => {
    const video = modalVideoRef.current;
    if (!video || !selectedScenario) return;
    video.currentTime = 0;
  }, [selectedScenario]);

  // Mute badalne par video restart nahi hota
  useEffect(() => {
    const video = modalVideoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted, selectedScenario]);

  // Play / pause
  useEffect(() => {
    const video = modalVideoRef.current;
    if (!video || !selectedScenario) return;

    if (isPlaying) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isPlaying, selectedScenario]);

  const roundBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-200 transition-all duration-200 ease-out hover:border-primary/35 hover:text-primary";

  return (
    <div className="app-grid min-h-screen">
      <div className="mx-auto w-full max-w-[1080px] px-4 py-6 lg:px-6 lg:py-8">
        <PageIntro
          eyebrow="Scenario library"
          title="Five roads. Five planning challenges."
          description="Each scenario is shown as a measured MATLAB simulation preview, with the full closed-loop run available in the detail modal."
          aside={<span className="system-label">5 scenarios · 50 runs</span>}
        />

        {/* Grid: 3 upar, 2 neeche beech me (tablet pe 2, mobile pe 1) */}
        <motion.div
          variants={shouldAnimate ? gridVariants : undefined}
          initial={shouldAnimate ? "hidden" : false}
          whileInView={shouldAnimate ? "show" : undefined}
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-wrap justify-center gap-3"
        >
          {scenarioProfiles.map((scenario) => (
            <ScenarioCard
              key={scenario.name}
              scenario={scenario}
              isSelected={selectedScenario === scenario.name}
              modalOpen={selectedScenario !== null}
              animate={shouldAnimate}
              onOpen={() => {
                setSelectedScenario(scenario.name);
                setIsPlaying(true);
                setIsMuted(true);
              }}
            />
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {activeScenario ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.3, ease }}
              onClick={(event) => event.stopPropagation()}
              className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(9,13,24,0.98))] shadow-[0_30px_80px_rgba(2,6,23,0.75)]"
            >
              <TopLine />

              <button
                type="button"
                onClick={closeModal}
                className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-200 transition-all duration-200 ease-out hover:border-primary/40 hover:text-primary"
                aria-label="Close scenario detail"
              >
                <X size={16} aria-hidden="true" />
              </button>

              <div className="grid gap-0 lg:grid-cols-[1.5fr_0.9fr]">
                <div className="p-3 md:p-4">
                  <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
                    <video
                      ref={modalVideoRef}
                      src={scenarioVideoPaths[activeScenario.name as keyof typeof scenarioVideoPaths]}
                      muted={isMuted}
                      playsInline
                      autoPlay={isPlaying}
                      loop
                      preload="auto"
                      className="aspect-video w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent px-3 pb-3 pt-8">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPlaying((value) => !value)}
                          className={roundBtn}
                          aria-label={isPlaying ? "Pause simulation video" : "Play simulation video"}
                        >
                          {isPlaying ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMuted((value) => !value)}
                          className={roundBtn}
                          aria-label={isMuted ? "Unmute simulation video" : "Mute simulation video"}
                        >
                          {isMuted ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="mr-1 font-mono text-xs tracking-[0.1em] text-slate-300">
                          {activeIndex + 1} / {scenarioProfiles.length}
                        </span>
                        <button type="button" onClick={() => goToScenario(-1)} className={roundBtn} aria-label="Previous scenario">
                          <ArrowLeft size={15} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => goToScenario(1)} className={roundBtn} aria-label="Next scenario">
                          <ArrowRight size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scenario badalne par side panel smoothly fade hota hai */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.aside
                    key={activeScenario.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease }}
                    className="border-t border-border/70 bg-slate-950/30 p-4 lg:border-l lg:border-t-0"
                  >
                    <div className="mb-3 pr-10">
                      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">{activeScenario.code}</p>
                      <h3 className="mt-1 font-display text-xl font-semibold text-foreground">{activeScenario.name}</h3>
                    </div>

                    <p className="text-sm leading-6 text-muted-foreground">{activeScenario.detail}</p>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { k: "Completion", v: activeScenario.metrics.completion },
                        { k: "Collisions", v: activeScenario.metrics.collisions },
                        { k: "Clearance", v: activeScenario.metrics.clearance },
                      ].map(({ k, v }) => (
                        <div key={k} className="rounded-lg border border-border/80 bg-background/25 px-2.5 py-2">
                          <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{k}</p>
                          <p className="mt-1 font-mono text-base text-foreground">{v}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg border border-border/80 bg-background/20 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Scenario signal</p>
                      <p className="mt-1.5 text-sm leading-6 text-foreground/80">
                        {activeScenario.name} — {activeScenario.tag}
                      </p>
                    </div>
                  </motion.aside>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default ScenariosPage;