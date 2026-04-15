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
import { LiveAgentAnimation } from "@/components/LiveAgentAnimation";
import CaseSelector from "@/components/CaseSelector";
import ResultPanel from "@/components/ResultPanel";
import { ReplayMode } from "@/components/ReplayMode";
import ClaimHistory from "@/components/ClaimHistory";
import { useEventStream } from "@/lib/useEventStream";
import {
  PIPELINE_STEPS,
  AGENT_MESSAGES,
  AGENT_COLORS,
  type LogEntry,
  type PhaseId,
} from "@/lib/claim-data";

type AppView = "landing" | "demo" | "live" | "replay";

export default function Home() {
  const [view, setView] = useState<AppView>("landing");
  const [replayRunId, setReplayRunId] = useState<string | null>(null);

  const handleReplay = useCallback((runId: string) => {
    setReplayRunId(runId);
    setView("replay");
  }, []);

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

  if (view === "replay" && replayRunId) {
    return (
      <ReplayMode
        runId={replayRunId}
        onExit={() => {
          setReplayRunId(null);
          setView("live");
        }}
      />
    );
  }

  return (
    <LiveMode
      onSwitchToDemo={() => setView("demo")}
      onSwitchToLanding={() => setView("landing")}
      onReplay={handleReplay}
    />
  );
}

function LiveMode({ onSwitchToDemo, onSwitchToLanding, onReplay }: { onSwitchToDemo: () => void; onSwitchToLanding: () => void; onReplay: (runId: string) => void }) {
  const [rightTab, setRightTab] = useState<'logs' | 'history'>('logs');
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
      <div className="flex flex-1 overflow-hidden">
        {/* Main animation area */}
        <div className="flex-1 relative overflow-hidden" style={{ flexBasis: "70%" }}>
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
                <LiveAgentAnimation
                  agentId={state.currentAgent}
                  agentEvents={state.agentEvents}
                  allEvents={state.events}
                  isCompleted={state.completedAgents.includes(state.currentAgent)}
                  addLog={addLog}
                  onComplete={() => {}}
                  onRestart={handleReset}
                />
              </motion.div>
            )}

            {isDone && (
              <motion.div
                key="done"
                className="absolute inset-0 flex items-center justify-center"
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
          className="shrink-0 overflow-hidden flex flex-col"
          style={{ flexBasis: "30%", maxWidth: "380px" }}
        >
          {/* Tab switcher */}
          <div className="flex border-b border-glass-border">
            <button
              onClick={() => setRightTab('logs')}
              className={`flex-1 py-2 text-[10px] font-bold transition-colors ${
                rightTab === 'logs' ? 'text-foreground border-b-2' : 'text-muted-foreground'
              }`}
              style={rightTab === 'logs' ? { borderBottomColor: 'oklch(0.62 0.19 250)' } : {}}
            >
              📋 Live Logs
            </button>
            <button
              onClick={() => setRightTab('history')}
              className={`flex-1 py-2 text-[10px] font-bold transition-colors ${
                rightTab === 'history' ? 'text-foreground border-b-2' : 'text-muted-foreground'
              }`}
              style={rightTab === 'history' ? { borderBottomColor: 'oklch(0.62 0.19 250)' } : {}}
            >
              📚 History
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {rightTab === 'logs' ? (
              <LiveLogPanel logs={logs} />
            ) : (
              <ClaimHistory onReplay={onReplay} />
            )}
          </div>
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
