/**
 * LivePerceptionDemo
 * ------------------------------------------------------------------
 * Additive component. Does NOT modify any existing file or data.
 *
 * Runs a real, in-browser object-detection model (TensorFlow.js +
 * COCO-SSD) over your existing scenario videos and draws live bounding
 * boxes on a canvas overlaid on the video. This proves the "Perception"
 * page is backed by something that actually runs, not just a static
 * table of numbers.
 *
 * SETUP (2 steps):
 *
 * 1. Add these two dependencies to package.json -> "dependencies":
 *      "@tensorflow/tfjs": "^4.22.0",
 *      "@tensorflow-models/coco-ssd": "^2.2.3"
 *    then run your package manager's install (npm install / bun install).
 *
 * 2. Drop this file at:  src/components/live-perception.tsx
 *    Then in src/routes/perception.tsx ONLY add two lines, nothing else:
 *      a) top of file, with the other imports:
 *           import { LivePerceptionDemo } from "@/components/live-perception";
 *      b) inside <PerceptionPage>, just before the final closing
 *         </div></div> (i.e. right after the last <Panel>...</Panel> block
 *         for "Object classes tracked", and before the "Data fidelity"
 *         section, or after it — either spot works), add:
 *           <LivePerceptionDemo />
 *
 * Nothing else in perception.tsx needs to change. All existing tables,
 * panels, and copy stay exactly as they are.
 * ------------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Play, ScanEye } from "lucide-react";
import { Panel } from "@/components/margdrishti";
import { scenarioVideoPaths } from "@/components/margdrishti";

type Detection = {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // x, y, width, height (video-pixel space)
};

// Reuses the exact same video files already wired up on the Scenarios page —
// no new assets needed.
const scenarioNames = Object.keys(scenarioVideoPaths) as (keyof typeof scenarioVideoPaths)[];

// Loose CoT class -> our own taxonomy label, so it reads like the rest of
// the "Object classes tracked" table instead of raw COCO labels.
const classLabelMap: Record<string, string> = {
  car: "Car",
  truck: "Bus / truck",
  bus: "Bus / truck",
  motorcycle: "Two-wheeler",
  bicycle: "Two-wheeler",
  person: "Pedestrian",
  cow: "Animal",
  dog: "Animal",
  horse: "Animal",
  sheep: "Animal",
};

function displayLabel(rawClass: string) {
  return classLabelMap[rawClass] ?? rawClass;
}

export function LivePerceptionDemo() {
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<import("@tensorflow-models/coco-ssd").ObjectDetection | null>(null);
  const rafRef = useRef<number | null>(null);

  const [scenario, setScenario] = useState<keyof typeof scenarioVideoPaths>(scenarioNames[0]);
  const [modelStatus, setModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);

  // Load the model once, client-side only. SSR-safe: this effect never
  // runs during server rendering, so nothing browser-only leaks into SSR.
  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      setModelStatus("loading");
      try {
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        if (cancelled) return;
        modelRef.current = model;
        setModelStatus("ready");
      } catch (error) {
        console.error("Perception model failed to load", error);
        if (!cancelled) setModelStatus("error");
      }
    }

    void loadModel();
    return () => {
      cancelled = true;
    };
  }, []);

  // Detection loop, tied to the video's own playback via requestAnimationFrame.
  useEffect(() => {
    if (!isRunning) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const model = modelRef.current;
    if (!video || !canvas || !model) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fpsWindowStart = lastFrameTime;
    let stopped = false;

    async function tick() {
      if (stopped || !video || video.paused || video.ended) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      // Throttle actual model inference to ~6-8 calls/sec — plenty for a
      // demo, keeps the tab from pegging the CPU.
      if (now - lastFrameTime > 130) {
        lastFrameTime = now;
        try {
          const predictions = await model!.detect(video);
          const boxed: Detection[] = predictions
            .filter((p) => p.score > 0.5)
            .map((p) => ({ class: p.class, score: p.score, bbox: p.bbox as [number, number, number, number] }));
          setLiveDetections(boxed);
          drawBoxes(ctx, canvas, video, boxed);

          frameCount += 1;
          if (now - fpsWindowStart > 1000) {
            setFps(frameCount);
            frameCount = 0;
            fpsWindowStart = now;
          }
        } catch (error) {
          console.error("Detection tick failed", error);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, scenario]);

  function drawBoxes(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    detections: Detection[],
  ) {
    // Keep canvas pixel size in sync with the video's rendered size.
    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const scaleX = rect.width / video.videoWidth;
    const scaleY = rect.height / video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det) => {
      const [x, y, w, h] = det.bbox;
      const bx = x * scaleX;
      const by = y * scaleY;
      const bw = w * scaleX;
      const bh = h * scaleY;

      ctx.strokeStyle = "rgba(125, 211, 252, 0.95)";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);

      const label = `${displayLabel(det.class)} ${(det.score * 100).toFixed(0)}%`;
      ctx.font = "600 11px system-ui, sans-serif";
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(bx, Math.max(by - 18, 0), textWidth + 10, 18);

      ctx.fillStyle = "rgba(224, 242, 254, 0.95)";
      ctx.fillText(label, bx + 5, Math.max(by - 5, 12));
    });
  }

  function handleStart() {
    const video = videoRef.current;
    if (!video || modelStatus !== "ready") return;
    void video.play();
    setIsRunning(true);
  }

  function handleScenarioChange(next: keyof typeof scenarioVideoPaths) {
    setIsRunning(false);
    setLiveDetections([]);
    setScenario(next);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }

  return (
    <Panel title="Live perception — object detection" label="Runs in your browser" className="mt-5">
      <div className="p-5 lg:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Runs a real in-browser detection model over the measured simulation clips — not a static
            table. Boxes are drawn live, frame by frame, from the actual video.
          </p>

          <div className="flex flex-wrap gap-2">
            {scenarioNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleScenarioChange(name)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  scenario === name
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          whileHover={reducedMotion ? undefined : { y: -3 }}
          className="glass-panel relative overflow-hidden p-3"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <video
              key={scenario}
              ref={videoRef}
              src={scenarioVideoPaths[scenario]}
              muted
              playsInline
              loop
              className="h-full w-full object-contain"
              onLoadedData={() => {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                if (canvas && video) {
                  const rect = video.getBoundingClientRect();
                  canvas.width = rect.width;
                  canvas.height = rect.height;
                }
              }}
            />
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

            {!isRunning ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={modelStatus !== "ready"}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {modelStatus === "loading" && <Loader2 size={16} className="animate-spin" />}
                  {modelStatus === "ready" && <Play size={16} />}
                  {modelStatus === "loading" ? "Loading model…" : "Run live detection"}
                </button>
              </div>
            ) : null}

            {modelStatus === "error" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6 text-center text-sm text-muted-foreground">
                Detection model failed to load — check your connection and refresh.
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ScanEye size={14} aria-hidden="true" />
              <span>
                {isRunning
                  ? `${liveDetections.length} objects tracked · ~${fps} inferences/sec`
                  : "Idle — press run to start live inference"}
              </span>
            </div>
            <span className="system-label system-label-safe">Client-side · TensorFlow.js</span>
          </div>
        </motion.div>
      </div>
    </Panel>
  );
}
