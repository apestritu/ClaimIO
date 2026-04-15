"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AgentEvent } from "./useEventStream";

export type ReplaySpeed = 1 | 2 | 4;
export type ReplayStatus = "idle" | "loading" | "playing" | "paused" | "done";

export interface ReplayState {
  status: ReplayStatus;
  speed: ReplaySpeed;
  events: AgentEvent[];
  agentEvents: Record<string, AgentEvent[]>;
  /** All events pre-grouped by agent — available as soon as run is loaded. */
  fullAgentEvents: Record<string, AgentEvent[]>;
  visibleEvents: AgentEvent[];
  currentAgent: string | null;
  completedAgents: string[];
  currentIndex: number;
  totalEvents: number;
  error: string | null;
  runId: string | null;
  caseId: string | null;
}

const INITIAL_STATE: ReplayState = {
  status: "idle",
  speed: 1,
  events: [],
  agentEvents: {},
  fullAgentEvents: {},
  visibleEvents: [],
  currentAgent: null,
  completedAgents: [],
  currentIndex: -1,
  totalEvents: 0,
  error: null,
  runId: null,
  caseId: null,
};

function groupByAgent(events: AgentEvent[]): Record<string, AgentEvent[]> {
  const grouped: Record<string, AgentEvent[]> = {};
  for (const evt of events) {
    if (!grouped[evt.agent]) grouped[evt.agent] = [];
    grouped[evt.agent].push(evt);
  }
  return grouped;
}

const BASE_DELAY_MS = 600; // delay between events at 1x speed

export function useReplayPipeline() {
  const [state, setState] = useState<ReplayState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Advance to next event
  const advance = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== "playing") return;

    const nextIdx = s.currentIndex + 1;
    if (nextIdx >= s.events.length) {
      setState((prev) => ({ ...prev, status: "done" }));
      return;
    }

    const event = s.events[nextIdx];
    setState((prev) => {
      const visibleEvents = [...prev.visibleEvents, event];
      const agentEvents = { ...prev.agentEvents };
      if (!agentEvents[event.agent]) agentEvents[event.agent] = [];
      agentEvents[event.agent] = [...agentEvents[event.agent], event];
      const completedAgents = [...prev.completedAgents];
      let currentAgent = prev.currentAgent;

      if (event.status === "working") {
        currentAgent = event.agent;
      }
      if (event.status === "completed") {
        if (!completedAgents.includes(event.agent)) {
          completedAgents.push(event.agent);
        }
        if (event.agent === currentAgent) {
          currentAgent = null;
        }
      }

      return {
        ...prev,
        visibleEvents,
        agentEvents,
        currentAgent,
        completedAgents,
        currentIndex: nextIdx,
      };
    });

    // Schedule next
    const delay = BASE_DELAY_MS / stateRef.current.speed;
    timerRef.current = setTimeout(advance, delay);
  }, []);

  // Load events for a run
  const loadRun = useCallback(async (runId: string) => {
    clearTimer();
    setState({ ...INITIAL_STATE, status: "loading", runId });

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/history/${runId}/events`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const events: AgentEvent[] = data.events ?? [];

      setState({
        ...INITIAL_STATE,
        status: "paused",
        runId,
        caseId: data.case_id ?? null,
        events,
        fullAgentEvents: groupByAgent(events),
        totalEvents: events.length,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "idle",
        error: err instanceof Error ? err.message : "Failed to load events",
      }));
    }
  }, [clearTimer]);

  // Play / resume
  const play = useCallback(() => {
    setState((prev) => {
      if (prev.status === "done") return prev;
      return { ...prev, status: "playing" };
    });
    // Kick off advance on next tick
    const delay = BASE_DELAY_MS / stateRef.current.speed;
    timerRef.current = setTimeout(advance, delay);
  }, [advance]);

  // Pause
  const pause = useCallback(() => {
    clearTimer();
    setState((prev) => ({ ...prev, status: "paused" }));
  }, [clearTimer]);

  // Set speed
  const setSpeed = useCallback((speed: ReplaySpeed) => {
    setState((prev) => ({ ...prev, speed }));
  }, []);

  // Skip to next agent
  const skipToNextAgent = useCallback(() => {
    const s = stateRef.current;
    if (s.status === "done") return;

    const currentIdx = s.currentIndex;
    const currentAgentName = s.currentAgent;

    // Find the next event that belongs to a different agent
    let targetIdx = currentIdx + 1;
    while (targetIdx < s.events.length) {
      const evt = s.events[targetIdx];
      if (evt.agent !== currentAgentName && evt.agent !== "Orchestrator" && evt.status === "working") {
        break;
      }
      targetIdx++;
    }
    // Apply all events up to targetIdx
    if (targetIdx > currentIdx + 1) {
      const eventsToApply = s.events.slice(currentIdx + 1, targetIdx);
      setState((prev) => {
        const visibleEvents = [...prev.visibleEvents, ...eventsToApply];
        const agentEvents = { ...prev.agentEvents };
        const completedAgents = [...prev.completedAgents];
        let currentAgent = prev.currentAgent;

        for (const event of eventsToApply) {
          if (!agentEvents[event.agent]) agentEvents[event.agent] = [];
          agentEvents[event.agent] = [...agentEvents[event.agent], event];
          if (event.status === "working") currentAgent = event.agent;
          if (event.status === "completed") {
            if (!completedAgents.includes(event.agent)) completedAgents.push(event.agent);
            if (event.agent === currentAgent) currentAgent = null;
          }
        }

        return {
          ...prev,
          visibleEvents,
          agentEvents,
          currentAgent,
          completedAgents,
          currentIndex: targetIdx - 1,
        };
      });
    }
  }, []);

  // Rebuild visible state from events[0..targetIndex]
  const rebuildState = useCallback((allEvents: AgentEvent[], targetIndex: number) => {
    const slice = allEvents.slice(0, targetIndex + 1);
    const agentEvents: Record<string, AgentEvent[]> = {};
    const completedAgents: string[] = [];
    let currentAgent: string | null = null;

    for (const evt of slice) {
      if (!agentEvents[evt.agent]) agentEvents[evt.agent] = [];
      agentEvents[evt.agent].push(evt);
      if (evt.status === "working") currentAgent = evt.agent;
      if (evt.status === "completed") {
        if (!completedAgents.includes(evt.agent)) completedAgents.push(evt.agent);
      }
    }

    return { visibleEvents: slice, agentEvents, completedAgents, currentAgent };
  }, []);

  // Find event indices where each non-Orchestrator agent first appears (working)
  const getAgentBoundaries = useCallback((events: AgentEvent[]) => {
    const boundaries: number[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      if (evt.agent !== "Orchestrator" && evt.status === "working" && !seen.has(evt.agent)) {
        seen.add(evt.agent);
        boundaries.push(i);
      }
    }
    return boundaries;
  }, []);

  // Step forward to next pipeline agent
  const stepForward = useCallback(() => {
    clearTimer();
    const s = stateRef.current;
    const boundaries = getAgentBoundaries(s.events);
    // Find the next boundary after currentIndex
    const targetIdx = boundaries.find((b) => b > s.currentIndex);
    if (targetIdx === undefined) {
      // No more agents — jump to end
      const lastIdx = s.events.length - 1;
      const built = rebuildState(s.events, lastIdx);
      setState((prev) => ({ ...prev, ...built, currentIndex: lastIdx, status: "done" }));
      return;
    }
    const built = rebuildState(s.events, targetIdx);
    setState((prev) => ({ ...prev, ...built, currentIndex: targetIdx, status: "paused" }));
  }, [clearTimer, rebuildState, getAgentBoundaries]);

  // Step backward to previous pipeline agent
  const stepBackward = useCallback(() => {
    clearTimer();
    const s = stateRef.current;
    const boundaries = getAgentBoundaries(s.events);
    // Find the current agent's boundary
    const currentBoundary = [...boundaries].reverse().find((b) => b <= s.currentIndex);
    // Find the boundary before that
    const currentBoundaryIdx = currentBoundary !== undefined ? boundaries.indexOf(currentBoundary) : -1;
    if (currentBoundaryIdx <= 0) {
      // Already at or before first agent — go to start
      setState((prev) => ({
        ...prev,
        visibleEvents: [],
        agentEvents: {},
        completedAgents: [],
        currentAgent: null,
        currentIndex: -1,
        status: "paused",
      }));
      return;
    }
    const targetIdx = boundaries[currentBoundaryIdx - 1];
    const built = rebuildState(s.events, targetIdx);
    setState((prev) => ({ ...prev, ...built, currentIndex: targetIdx, status: "paused" }));
  }, [clearTimer, rebuildState, getAgentBoundaries]);

  // Seek to a specific event index
  const seekTo = useCallback((index: number) => {
    clearTimer();
    const s = stateRef.current;
    const clamped = Math.max(-1, Math.min(index, s.events.length - 1));
    if (clamped < 0) {
      setState((prev) => ({
        ...prev,
        visibleEvents: [],
        agentEvents: {},
        completedAgents: [],
        currentAgent: null,
        currentIndex: -1,
        status: "paused",
      }));
      return;
    }
    const built = rebuildState(s.events, clamped);
    setState((prev) => ({
      ...prev,
      ...built,
      currentIndex: clamped,
      status: clamped >= s.events.length - 1 ? "done" : "paused",
    }));
  }, [clearTimer, rebuildState]);

  // Restart
  const restart = useCallback(() => {
    clearTimer();
    setState((prev) => ({
      ...INITIAL_STATE,
      status: "paused",
      runId: prev.runId,
      caseId: prev.caseId,
      events: prev.events,
      fullAgentEvents: prev.fullAgentEvents,
      totalEvents: prev.totalEvents,
    }));
  }, [clearTimer]);

  // Stop / exit replay
  const stop = useCallback(() => {
    clearTimer();
    setState(INITIAL_STATE);
  }, [clearTimer]);

  return {
    state,
    loadRun,
    play,
    pause,
    setSpeed,
    skipToNextAgent,
    stepForward,
    stepBackward,
    seekTo,
    restart,
    stop,
  };
}
