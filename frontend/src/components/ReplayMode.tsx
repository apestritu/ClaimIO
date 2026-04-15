"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { PipelineBar } from './PipelineBar';
import { AgentAvatar } from './AgentAvatar';
import { LiveLogPanel } from './LiveLogPanel';
import { LiveAgentAnimation } from './LiveAgentAnimation';
import { ReplayControls } from './ReplayControls';
import ResultPanel from './ResultPanel';
import { useReplayPipeline } from '@/lib/useReplayPipeline';
import {
  PIPELINE_STEPS,
  AGENT_MESSAGES,
  AGENT_COLORS,
  type LogEntry,
  type PhaseId,
} from '@/lib/claim-data';

interface ReplayModeProps {
  runId: string;
  onExit: () => void;
}

export function ReplayMode({ runId, onExit }: ReplayModeProps) {
  const {
    state,
    loadRun,
    play,
    pause,
    setSpeed,
    stepForward,
    stepBackward,
    seekTo,
    restart,
    stop,
  } = useReplayPipeline();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const prevVisibleLen = useRef(0);

  // Load on mount
  useEffect(() => {
    loadRun(runId);
  }, [runId, loadRun]);

  // Sync visible events → logs
  useEffect(() => {
    const newEvents = state.visibleEvents.slice(prevVisibleLen.current);
    prevVisibleLen.current = state.visibleEvents.length;

    for (const evt of newEvents) {
      const icon =
        evt.status === 'completed'
          ? '✅'
          : evt.status === 'failed'
          ? '❌'
          : evt.status === 'working'
          ? '⚙️'
          : '📨';
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLogs((prev) => [
        ...prev,
        { id: crypto.randomUUID(), icon, text: evt.message, agent: evt.agent, timestamp },
      ]);
    }
  }, [state.visibleEvents]);

  // Reset logs on restart
  useEffect(() => {
    if (state.currentIndex === -1 && state.visibleEvents.length === 0) {
      setLogs([]);
      prevVisibleLen.current = 0;
    }
  }, [state.currentIndex, state.visibleEvents.length]);

  const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs((prev) => [...prev, { ...log, id: crypto.randomUUID(), timestamp }]);
  }, []);

  const handleExit = useCallback(() => {
    stop();
    onExit();
  }, [stop, onExit]);

  const phase: PhaseId = state.currentAgent as PhaseId || 'select';
  const activeStep = PIPELINE_STEPS.findIndex((s) => s.id === state.currentAgent);
  const completedSteps = PIPELINE_STEPS
    .map((s, i) => (state.completedAgents.includes(s.id) ? i : -1))
    .filter((i) => i >= 0);

  const isDone = state.status === 'done';
  const isLoading = state.status === 'loading';

  // Build a mock finalSummary from visible events when done
  const finalSummary = isDone
    ? (state.visibleEvents.find(
        (e) => e.agent === 'Orchestrator' && e.status === 'completed' && e.data?.final_summary
      )?.data?.final_summary as Record<string, unknown> | undefined) ?? null
    : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 glass-panel border-b border-glass-border">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-primary" />
          <span className="text-lg font-bold text-gradient-primary">ClaimIO</span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
            style={{ background: 'oklch(0.55 0.2 270 / 15%)', color: 'oklch(0.7 0.2 270)', border: '1px solid oklch(0.55 0.2 270 / 30%)' }}>
            ▶ REPLAY
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-muted-foreground">
            {state.caseId && <>Case: <span className="text-foreground">{state.caseId}</span></>}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            Run: <span className="text-foreground">{runId.slice(0, 8)}</span>
          </span>
        </div>
      </div>

      {/* Pipeline bar */}
      {(state.visibleEvents.length > 0 || isDone) && (
        <PipelineBar activeStep={activeStep} completedSteps={completedSteps} />
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Animation area */}
        <div className="flex-1 relative overflow-hidden" style={{ flexBasis: '70%' }}>
          {state.currentAgent && phase !== 'select' && !isDone && (
            <AgentAvatar
              phase={phase}
              message={AGENT_MESSAGES[phase] || 'Processing...'}
              glowColor={AGENT_COLORS[phase] || 'oklch(0.62 0.19 250)'}
            />
          )}

          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    className="w-12 h-12 rounded-full border-2 border-t-transparent"
                    style={{ borderColor: 'oklch(0.62 0.19 250)', borderTopColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-xs font-mono text-muted-foreground">Loading events...</span>
                </div>
              </motion.div>
            )}

            {!isLoading && !isDone && state.currentAgent && (
              <motion.div
                key={state.currentAgent}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                transition={{ duration: 0.5 }}
              >
                <LiveAgentAnimation
                  agentId={state.currentAgent}
                  agentEvents={state.agentEvents}
                  allEvents={state.visibleEvents}
                  isCompleted={state.completedAgents.includes(state.currentAgent)}
                  addLog={addLog}
                  onComplete={() => {}}
                  onRestart={() => restart()}
                  fullAgentEvents={state.fullAgentEvents}
                />
              </motion.div>
            )}

            {!isLoading && !isDone && !state.currentAgent && state.visibleEvents.length === 0 && (
              <motion.div
                key="ready"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col items-center gap-4">
                  <span className="text-4xl">▶</span>
                  <span className="text-sm font-mono text-muted-foreground">
                    Ready to replay • {state.totalEvents} events
                  </span>
                  <button
                    onClick={play}
                    className="px-6 py-2 rounded-xl text-sm font-bold transition-colors"
                    style={{
                      background: 'oklch(0.62 0.19 250 / 15%)',
                      color: 'oklch(0.7 0.19 250)',
                      border: '1px solid oklch(0.62 0.19 250 / 40%)',
                    }}
                  >
                    Start Replay
                  </button>
                </div>
              </motion.div>
            )}

            {isDone && (
              <motion.div
                key="done"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                transition={{ duration: 0.5 }}
              >
                <div className="max-w-lg w-full">
                  {finalSummary ? (
                    <ResultPanel summary={finalSummary} />
                  ) : (
                    <div className="text-center">
                      <span className="text-2xl">✅</span>
                      <p className="text-sm font-mono text-muted-foreground mt-2">Replay complete</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel */}
        <div className="shrink-0 overflow-hidden" style={{ flexBasis: '30%', maxWidth: '380px' }}>
          <LiveLogPanel logs={logs} />
        </div>
      </div>

      {/* Replay Controls bar at bottom */}
      {state.status !== 'idle' && state.status !== 'loading' && (
        <div className="px-6 py-3">
          <ReplayControls
            status={state.status}
            speed={state.speed}
            currentIndex={state.currentIndex}
            totalEvents={state.totalEvents}
            currentAgent={state.currentAgent}
            onPlay={play}
            onPause={pause}
            onSetSpeed={setSpeed}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onSeekTo={seekTo}
            onRestart={restart}
            onStop={handleExit}
          />
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div className="px-6 py-3">
          <div className="rounded-xl px-4 py-3 glass-panel" style={{ borderColor: 'oklch(0.65 0.2 15 / 30%)' }}>
            <p className="text-sm" style={{ color: 'oklch(0.65 0.2 15)' }}>{state.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
