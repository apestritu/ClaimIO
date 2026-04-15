"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RotateCcw } from "lucide-react";
import { LandingPage } from "@/components/landing/LandingPage";
import { DemoMode } from "@/components/DemoMode";
import { PipelineBar } from "@/components/PipelineBar";
import { AgentAvatar } from "@/components/AgentAvatar";
import { LiveLogPanel } from "@/components/LiveLogPanel";
import { AgentPhaseAnimation } from "@/components/AgentPhaseAnimation";
import CaseSelector from "@/components/CaseSelector";
import ResultPanel from "@/components/ResultPanel";
import { useEventStream } from "@/lib/useEventStream";
import {
  PIPELINE_STEPS,
  AGENT_MESSAGES,
  AGENT_COLORS,
  type LogEntry,
  type PhaseId,
} from "@/lib/claim-data";

type AppView = "landing" | "demo" | "live";

export default function Home() {
  const [view, setView] = useState<AppView>("landing");

  if (view === "landing") {
    return <LandingPage onEnter={() => setView("demo")} />;
  }

  if (view === "demo") {
    return (
      <DemoMode
        onSwitchToLive={() => setView("live")}
        onSwitchToLanding={() => setView("landing")}
      />
    );
  }

  return (
    <LiveMode
      onSwitchToDemo={() => setView("demo")}
      onSwitchToLanding={() => setView("landing")}
    />
  );
}

function LiveMode({ onSwitchToDemo, onSwitchToLanding }: { onSwitchToDemo: () => void; onSwitchToLanding: () => void }) {
  const { state, startPipeline, reset } = useEventStream();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const prevEventsLen = useRef(0);

  const phase: PhaseId = state.finalSummary
    ? "done"
    : (state.currentAgent as PhaseId) || "select";

  const activeStep = PIPELINE_STEPS.findIndex((s) => s.id === state.currentAgent);
  const completedSteps = PIPELINE_STEPS
    .map((s, i) => (state.completedAgents.includes(s.id) ? i : -1))
    .filter((i) => i >= 0);

  const addLog = useCallback((log: Omit<LogEntry, "id" | "timestamp">) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [...prev, { ...log, id: crypto.randomUUID(), timestamp }]);
  }, []);

  useEffect(() => {
    const newEvents = state.events.slice(prevEventsLen.current);
    prevEventsLen.current = state.events.length;

    for (const evt of newEvents) {
      const icon =
        evt.status === "completed"
          ? "✅"
          : evt.status === "failed"
          ? "❌"
          : evt.status === "working"
          ? "⚙️"
          : "📨";
      addLog({ icon, text: evt.message, agent: evt.agent });
    }
  }, [state.events, addLog]);


  const handleStart = useCallback(
    (caseId: string) => {
      setLogs([]);
      prevEventsLen.current = 0;
      addLog({ icon: "🚀", text: `Starting pipeline for ${caseId}...` });
      startPipeline(caseId);
    },
    [startPipeline, addLog]
  );

  const handleReset = useCallback(() => {
    reset();
    setLogs([]);
    prevEventsLen.current = 0;
  }, [reset]);

  const hasStarted = state.events.length > 0 || state.isRunning;
  const isDone = !!state.finalSummary;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 glass-panel border-b border-glass-border">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-primary" />
          <span className="text-lg font-bold text-gradient-primary">ClaimIO</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Back to landing */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium glass-panel hover:bg-glass-border transition-colors text-muted-foreground"
            onClick={() => {
              if (hasStarted) handleReset();
              onSwitchToLanding();
            }}
          >
            ← Home
          </button>
          {/* Switch to demo */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium glass-panel hover:bg-glass-border transition-colors text-emerald"
            onClick={() => {
              if (hasStarted) handleReset();
              onSwitchToDemo();
            }}
          >
            🧪 Switch to Demo
          </button>
          {hasStarted && (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium glass-panel hover:bg-glass-border transition-colors"
              onClick={handleReset}
            >
              <RotateCcw size={10} />
              Reset
            </button>
          )}
          <div className="text-xs font-mono text-muted-foreground">
            {state.isRunning && state.currentAgent && (
              <>
                Active: <span className="text-foreground">{state.currentAgent}</span>
              </>
            )}
            {isDone && (
              <span className="text-emerald font-semibold">Pipeline Complete</span>
            )}
            {!hasStarted && (
              <span className="text-muted-foreground">🔴 Live — Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline */}
      {hasStarted && (
        <PipelineBar activeStep={activeStep} completedSteps={completedSteps} />
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Main animation area */}
        <div className={`flex-1 relative ${isDone ? "overflow-y-auto" : "overflow-hidden"}`} style={{ flexBasis: "70%" }}>
          {hasStarted && phase !== "select" && phase !== "done" && (
            <AgentAvatar
              phase={phase}
              message={AGENT_MESSAGES[phase] || "Processing..."}
              glowColor={AGENT_COLORS[phase] || "oklch(0.62 0.19 250)"}
            />
          )}

          <AnimatePresence mode="wait">
            {!hasStarted && (
              <motion.div
                key="select"
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                transition={{ duration: 0.5 }}
              >
                <CaseSelector
                  onStart={handleStart}
                  addLog={addLog}
                  isRunning={state.isRunning}
                />
              </motion.div>
            )}

            {hasStarted && !isDone && state.currentAgent && (
              <motion.div
                key={state.currentAgent}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                transition={{ duration: 0.5 }}
              >
                <AgentPhaseAnimation
                  agentId={state.currentAgent}
                  events={state.events}
                  isCompleted={state.completedAgents.includes(state.currentAgent)}
                />
              </motion.div>
            )}

            {isDone && (
              <motion.div
                key="done"
                className="flex items-start justify-center py-6"
                initial={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
                transition={{ duration: 0.5 }}
              >
                <div className="max-w-lg w-full">
                  {state.finalSummary && <ResultPanel summary={state.finalSummary} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel */}
        <div
          className="shrink-0 overflow-hidden"
          style={{ flexBasis: "30%", maxWidth: "380px" }}
        >
          <LiveLogPanel logs={logs} />
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="px-6 py-3">
          <div className="rounded-xl px-4 py-3 glass-panel" style={{ borderColor: "oklch(0.65 0.2 15 / 30%)" }}>
            <p className="text-sm" style={{ color: "oklch(0.65 0.2 15)" }}>{state.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
