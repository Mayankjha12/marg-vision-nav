import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, CircleCheck, CircleX } from "lucide-react";
import { Panel } from "@/components/margdrishti";
import { simulationRuns, scenarioDisplayNames, type SimulationRun } from "@/data/simulation-runs";

export function RunReplayWidget() {
  const [current, setCurrent] = useState<SimulationRun | null>(null);
  const [spinning, setSpinning] = useState(false);

  function handleReplay() {
    setSpinning(true);
    // Small delay purely for a "picking a run" feel — the result itself
    // is a real recorded row, not generated.
    window.setTimeout(() => {
      const next = simulationRuns[Math.floor(Math.random() * simulationRuns.length)];
      setCurrent(next);
      setSpinning(false);
    }, 450);
  }

  return (
    <Panel title="Replay a real run" label="Sampled from 50 measured runs" className="mt-5">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div className="max-w-lg">
          <p className="text-sm leading-6 text-muted-foreground">
            Every number on this dashboard is aggregated from 50 real closed-loop MATLAB runs.
            Press the button to pull one individual run at random and see its actual recorded outcome —
            nothing here is generated on the fly, it's a real seed replay.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReplay}
          disabled={spinning}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Dices size={16} className={spinning ? "animate-spin" : ""} aria-hidden="true" />
          {spinning ? "Sampling…" : "Replay a random real run"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {current ? (
          <motion.div
            key={`${current.scenario}-${current.seed}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-5 mb-5 rounded-2xl border border-border bg-background/40 p-4 lg:mx-6 lg:mb-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  Seed {current.seed} · {current.nAgents} agents
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold text-foreground">
                  {scenarioDisplayNames[current.scenario]}
                </h3>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  current.collided
                    ? "bg-red-500/10 text-red-400"
                    : current.completed
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {current.collided ? <CircleX size={14} /> : <CircleCheck size={14} />}
                {current.collided ? "Collision" : current.completed ? "Completed" : "Incomplete (no collision)"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-card/40 p-2.5">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Duration</dt>
                <dd className="mt-1 font-mono text-sm text-foreground">{current.duration}s</dd>
              </div>
              <div className="rounded-xl border border-border bg-card/40 p-2.5">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Min clearance</dt>
                <dd className="mt-1 font-mono text-sm text-foreground">{current.minClear}m</dd>
              </div>
              <div className="rounded-xl border border-border bg-card/40 p-2.5">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Mean latency</dt>
                <dd className="mt-1 font-mono text-sm text-foreground">{current.latMean}ms</dd>
              </div>
              <div className="rounded-xl border border-border bg-card/40 p-2.5">
                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Max latency</dt>
                <dd className="mt-1 font-mono text-sm text-foreground">{current.latMax}ms</dd>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Panel>
  );
}
