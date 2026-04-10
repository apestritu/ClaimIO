"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import CaseSelector from "@/components/CaseSelector";
import Pipeline from "@/components/Pipeline";
import AgentCard from "@/components/AgentCard";
import EventFeed from "@/components/EventFeed";
import ResultPanel from "@/components/ResultPanel";
import ClaimHistory from "@/components/ClaimHistory";
import { useEventStream } from "@/lib/useEventStream";

export default function Home() {
  const { state, startPipeline, reset } = useEventStream();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const [historyRefresh, setHistoryRefresh] = useState(0);
  const prevRunning = useRef(state.isRunning);

  useEffect(() => {
    if (prevRunning.current && !state.isRunning) {
      setHistoryRefresh((n) => n + 1);
    }
    prevRunning.current = state.isRunning;
  }, [state.isRunning]);

  const hasStarted = state.events.length > 0;
  const hasResults = state.finalSummary !== null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6 space-y-6">
        {/* Pipeline Visualization */}
        {hasStarted && (
          <Pipeline
            currentAgent={state.currentAgent}
            completedAgents={state.completedAgents}
            onSelectAgent={setSelectedAgent}
            selectedAgent={selectedAgent}
          />
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column — Controls & Results */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <CaseSelector
              onStart={startPipeline}
              onReset={reset}
              isRunning={state.isRunning}
              hasResults={hasResults}
            />

            {hasResults && state.finalSummary && (
              <ResultPanel summary={state.finalSummary} />
            )}

            <ClaimHistory refreshTrigger={historyRefresh} />
          </div>

          {/* Center Column — Agent Detail */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {!hasStarted && (
              <div className="bg-oai-surface rounded-2xl border border-oai-border p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-oai-green/10 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-oai-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-oai-text mb-2">
                  Ready to Process
                </h2>
                <p className="text-sm text-oai-text-secondary max-w-md mx-auto">
                  Select a claim case and click{" "}
                  <span className="text-oai-green font-medium">
                    Process Claim
                  </span>{" "}
                  to watch 9 AI agents analyze documents, extract facts, evaluate
                  coverage, and make a decision in real-time.
                </p>
                <div className="mt-6 flex items-center justify-center gap-6 text-[10px] text-oai-text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-oai-green" />
                    OpenAI Agents SDK
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-oai-blue" />
                    A2A Protocol
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-oai-purple" />
                    MCP Integration
                  </span>
                </div>
              </div>
            )}

            {hasStarted && (
              <>
                {selectedAgent ? (
                  <AgentCard
                    agentId={selectedAgent}
                    events={state.events}
                    isActive={state.currentAgent === selectedAgent}
                    isCompleted={state.completedAgents.includes(selectedAgent)}
                  />
                ) : (
                  <div className="space-y-4">
                    {state.completedAgents
                      .concat(state.currentAgent ? [state.currentAgent] : [])
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .filter((id) => id !== "Orchestrator")
                      .map((agentId) => (
                        <AgentCard
                          key={agentId}
                          agentId={agentId}
                          events={state.events}
                          isActive={state.currentAgent === agentId}
                          isCompleted={state.completedAgents.includes(agentId)}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column — Event Feed */}
          <div className="col-span-12 lg:col-span-4">
            <EventFeed events={state.events} />
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="bg-oai-red/10 border border-oai-red/30 rounded-xl p-4">
            <p className="text-sm text-oai-red">{state.error}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-oai-border py-4 px-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <p className="text-[10px] text-oai-text-muted">
            Built with OpenAI Codex • Agents SDK • A2A • MCP
          </p>
          <p className="text-[10px] text-oai-text-muted">
            ClaimIO © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
