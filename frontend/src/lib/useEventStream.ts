"use client";

import { useState, useCallback, useRef } from "react";

export interface AgentEvent {
  id: string;
  agent: string;
  status: "submitted" | "working" | "completed" | "failed";
  message: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface PipelineState {
  isRunning: boolean;
  events: AgentEvent[];
  currentAgent: string | null;
  completedAgents: string[];
  error: string | null;
  finalSummary: Record<string, unknown> | null;
}

const INITIAL_STATE: PipelineState = {
  isRunning: false,
  events: [],
  currentAgent: null,
  completedAgents: [],
  error: null,
  finalSummary: null,
};

export function useEventStream() {
  const [state, setState] = useState<PipelineState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const startPipeline = useCallback(async (caseId: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const abort = new AbortController();
    abortRef.current = abort;

    setState({
      ...INITIAL_STATE,
      isRunning: true,
    });

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiBase}/api/claims/${caseId}/process`, {
        signal: abort.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          try {
            const parsed = JSON.parse(json);
            if (parsed.type === "keepalive") continue;

            const event: AgentEvent = parsed;

            setState((prev) => {
              const events = [...prev.events, event];
              const completedAgents = [...prev.completedAgents];
              let currentAgent = prev.currentAgent;
              let finalSummary = prev.finalSummary;

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

              if (
                event.agent === "Orchestrator" &&
                event.status === "completed" &&
                event.data?.final_summary
              ) {
                finalSummary = event.data.final_summary as Record<
                  string,
                  unknown
                >;
              }

              const isRunning = !(
                event.agent === "Orchestrator" &&
                (event.status === "completed" || event.status === "failed")
              );

              return {
                ...prev,
                events,
                currentAgent,
                completedAgents,
                finalSummary,
                isRunning,
                error:
                  event.status === "failed"
                    ? event.message
                    : prev.error,
              };
            });
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  return { state, startPipeline, reset };
}
