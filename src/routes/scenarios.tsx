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
    detail: "Narrow, unmarked road with mixed traffic and variable lane discipline.",
    metrics: { completion: "90%", collisions: 0, clearance: "5.36 m" },
  },
  {
    name: "Urban Intersection",
    code: "SCN-02",
    tag: "unsignalized crossing, dense crossings",
    detail: "Unsignalized crossing with multiple agents and no right-of-way structure.",
    metrics: { completion: "40%", collisions: 6, clearance: "1.39 m" },
  },
  {
    name: "Highway Merge",
    code: "SCN-03",
    tag: "high-speed merge, short gap decisions",
    detail: "High-speed traffic and tight merging dynamics with minimal reaction time.",
    metrics: { completion: "80%", collisions: 1, clearance: "4.56 m" },
  },
  {
    name: "Dense Market",
    code: "SCN-04",
    tag: "pedestrians, two-wheelers, occlusion",
    detail: "Pedestrians, two-wheelers, and dense occlusion in a constrained corridor.",
    metrics: { completion: "20%", collisions: 7, clearance: "1.19 m" },
  },
  {
    name: "Cattle Crossing",
    code: "SCN-05",
    tag: "sudden obstruction, emergency braking",
    detail: "Sudden carriageway obstruction requiring rapid braking and safe replan execution.",
    metrics: { completion: "40%", collisions: 5, clearance: "2.93 m" },
  },
] as const;

function ScenarioPreviewCard({
  scenario,
  index,
  isSelected,
  onOpen,
}: {
  scenario: (typeof scenarioProfiles)[number];
  index: number;
  isSelected: boolean;
  onOpen: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setShouldLoad(false);
      return;
    }

    const element = videoRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setShouldLoad(entry.isIntersecting);
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad || reducedMotion) {
      if (video) video.pause();
      return;
    }

    video.muted = true;
    video.play().catch(() => undefined);
  }, [shouldLoad, reducedMotion]);

  const source = scenarioVideoPaths[scenario.name as keyof typeof scenarioVideoPaths];

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: index * 0.06, ease: "easeOut" }}
      whileHover={reducedMotion ? undefined : { y: -6, scale: 1.01 }}
      className={`group relative cursor-pointer overflow-hidden rounded-[1.45rem] border bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.12),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(9,13,24,0.94))] p-[1px] shadow-[0_16px_36px_rgba(2,6,23,0.22)] transition-all duration-200 ease-out ${isSelected ? "border-primary/40 shadow-[0_20px_44px_rgba(14,116,144,0.12)]" : "border-border/80 hover:border-primary/30"}`}
      onClick={onOpen}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" style={{ background: "radial-gradient(circle at 50% 18%, rgba(125, 211, 252, 0.2), transparent 28%)" }} />

      <div className="relative overflow-hidden rounded-[1.38rem] border border-white/5 bg-slate-950/40">
        {reducedMotion ? (
          <div className="flex aspect-[5/3] items-center justify-center bg-[radial-gradient(circle_at_40%_30%,rgba(125,211,252,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(9,13,24,0.95))]">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary">
                <CarFront size={18} aria-hidden="true" />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{scenario.code}</p>
            </div>
          </div>
        ) : videoError ? (
          <div className="flex aspect-[5/3] items-center justify-center bg-[radial-gradient(circle_at_40%_30%,rgba(125,211,252,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(9,13,24,0.95))]">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary">
                <CarFront size={18} aria-hidden="true" />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={shouldLoad ? source : undefined}
            poster={undefined}
            muted
            loop
            playsInline
            autoPlay={shouldLoad}
            preload="metadata"
            onError={() => setVideoError(true)}
            className="aspect-[5/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_28%),linear-gradient(to_top,rgba(2,6,23,0.78),rgba(2,6,23,0.1),transparent)]" />

        <div className="relative border-t border-border/70 bg-slate-950/55 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{scenario.code}</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">{scenario.name}</h2>
            </div>
            <span className="rounded-full border border-primary/15 bg-primary/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">Preview</span>
          </div>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">{scenario.name} — {scenario.tag}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-border/80 bg-background/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/80">{scenario.metrics.completion}</span>
            <span className="rounded-full border border-border/80 bg-background/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/80">{scenario.metrics.collisions} col</span>
            <span className="rounded-full border border-border/80 bg-background/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground/80">{scenario.metrics.clearance}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ScenariosPage() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const activeIndex = selectedScenario ? scenarioProfiles.findIndex((scenario) => scenario.name === selectedScenario) : -1;
  const activeScenario = activeIndex >= 0 ? scenarioProfiles[activeIndex] : null;

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
      }

      if (event.key === "ArrowLeft") {
        const prevIndex = activeIndex === 0 ? scenarioProfiles.length - 1 : activeIndex - 1;
        setSelectedScenario(scenarioProfiles[prevIndex].name);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedScenario, activeIndex]);

  useEffect(() => {
    const video = modalVideoRef.current;
    if (!video || !selectedScenario) return;

    video.muted = isMuted;
    video.currentTime = 0;

    if (isPlaying) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [selectedScenario, isMuted, isPlaying]);

  useEffect(() => {
    const previewVideos = document.querySelectorAll("video[data-scenario-preview='true']");
    previewVideos.forEach((video) => {
      if (selectedScenario) {
        video.pause();
      } else {
        video.play().catch(() => undefined);
      }
    });
  }, [selectedScenario]);

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

  return (
    <div className="app-grid min-h-screen">
      <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 lg:py-12">
        <PageIntro
          eyebrow="Scenario library"
          title="Five roads. Five planning challenges."
          description="Each scenario is shown as a measured MATLAB simulation preview, with the full closed-loop run available in the detail modal."
          aside={<span className="system-label">5 scenarios · 50 runs</span>}
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {scenarioProfiles.map((scenario, index) => (
            <ScenarioPreviewCard
              key={scenario.name}
              scenario={scenario}
              index={index}
              isSelected={selectedScenario === scenario.name}
              onOpen={() => {
                setSelectedScenario(scenario.name);
                setIsPlaying(true);
                setIsMuted(true);
              }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeScenario ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-6xl overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(9,13,24,0.98))] shadow-[0_30px_80px_rgba(2,6,23,0.75)]"
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-200 transition-all duration-200 ease-out hover:border-primary/40 hover:text-primary"
                aria-label="Close scenario detail"
              >
                <X size={18} aria-hidden="true" />
              </button>

              <div className="grid gap-0 xl:grid-cols-[1.55fr_0.85fr]">
                <div className="p-4 md:p-5">
                  <div className="relative overflow-hidden rounded-[1.2rem] border border-white/10 bg-slate-950/40">
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
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-200 transition-all duration-200 ease-out hover:border-primary/35 hover:text-primary"
                          aria-label={isPlaying ? "Pause simulation video" : "Play simulation video"}
                        >
                          {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMuted((value) => !value)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-200 transition-all duration-200 ease-out hover:border-primary/35 hover:text-primary"
                          aria-label={isMuted ? "Unmute simulation video" : "Mute simulation video"}
                        >
                          {isMuted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => goToScenario(-1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-200 transition-all duration-200 ease-out hover:border-primary/35 hover:text-primary"
                          aria-label="Previous scenario"
                        >
                          <ArrowLeft size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => goToScenario(1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 text-slate-200 transition-all duration-200 ease-out hover:border-primary/35 hover:text-primary"
                          aria-label="Next scenario"
                        >
                          <ArrowRight size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="border-t border-border/70 bg-slate-950/30 p-5 xl:border-l xl:border-t-0">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">{activeScenario.code}</p>
                      <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">{activeScenario.name}</h3>
                    </div>
                    <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Live</span>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">{activeScenario.detail}</p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-border/80 bg-background/25 p-3">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Completion</p>
                      <p className="mt-2 font-mono text-lg text-foreground">{activeScenario.metrics.completion}</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-background/25 p-3">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Collisions</p>
                      <p className="mt-2 font-mono text-lg text-foreground">{activeScenario.metrics.collisions}</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-background/25 p-3">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Clearance</p>
                      <p className="mt-2 font-mono text-lg text-foreground">{activeScenario.metrics.clearance}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-border/80 bg-background/20 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Scenario signal</p>
                    <p className="mt-2 text-sm leading-6 text-foreground/80">{activeScenario.name} — {activeScenario.tag}</p>
                  </div>
                </aside>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default ScenariosPage;