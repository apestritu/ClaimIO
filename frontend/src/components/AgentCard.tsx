"use client";

import { useMemo } from "react";
import { CheckCircle2, Loader2, Clock, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import type { AgentEvent } from "@/lib/useEventStream";
import { STEPS } from "./Pipeline";

interface AgentCardProps {
  agentId: string;
  events: AgentEvent[];
  isActive: boolean;
  isCompleted: boolean;
}

export default function AgentCard({
  agentId,
  events,
  isActive,
  isCompleted,
}: AgentCardProps) {
  const step = STEPS.find((s) => s.id === agentId);
  const agentEvents = useMemo(
    () => events.filter((e) => e.agent === agentId),
    [events, agentId]
  );

  const lastEvent = agentEvents[agentEvents.length - 1];
  const hasFailed = agentEvents.some((e) => e.status === "failed");

  if (!step) return null;

  return (
    <div
      className={clsx(
        "bg-oai-surface rounded-2xl border overflow-hidden transition-all duration-300",
        isActive
          ? "border-oai-green/50 shadow-[0_0_30px_rgba(16,163,127,0.1)]"
          : isCompleted
          ? "border-oai-border"
          : "border-oai-border opacity-50"
      )}
    >
      <div className="px-5 py-4 border-b border-oai-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isActive && "bg-oai-green text-white",
              isCompleted && !isActive && "bg-oai-green/20 text-oai-green",
              !isActive && !isCompleted && "bg-oai-surface-3 text-oai-text-muted"
            )}
          >
            <step.icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-oai-text">{step.label}</h3>
            <p className="text-xs text-oai-text-muted">{step.desc}</p>
          </div>
        </div>
        <div>
          {isActive && (
            <Loader2 className="w-4 h-4 text-oai-green animate-spin" />
          )}
          {isCompleted && !isActive && (
            <CheckCircle2 className="w-4 h-4 text-oai-green" />
          )}
          {hasFailed && (
            <AlertTriangle className="w-4 h-4 text-oai-red" />
          )}
          {!isActive && !isCompleted && !hasFailed && (
            <Clock className="w-4 h-4 text-oai-text-muted" />
          )}
        </div>
      </div>

      {agentEvents.length > 0 && (
        <div className="px-5 py-4 space-y-3 max-h-[400px] overflow-y-auto">
          {agentEvents.map((evt) => (
            <div key={evt.id} className="animate-fade-in-up">
              <div className="flex items-start gap-2">
                <div
                  className={clsx(
                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    evt.status === "completed" && "bg-oai-green",
                    evt.status === "working" && "bg-oai-yellow",
                    evt.status === "failed" && "bg-oai-red",
                    evt.status === "submitted" && "bg-oai-blue"
                  )}
                />
                <p className="text-xs text-oai-text-secondary leading-relaxed">
                  {evt.message}
                </p>
              </div>
              {evt.data && Object.keys(evt.data).length > 0 && evt.status === "completed" && (
                <DataPreview data={evt.data} />
              )}
            </div>
          ))}
        </div>
      )}

      {agentEvents.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-oai-text-muted">Waiting...</p>
        </div>
      )}
    </div>
  );
}

function DataPreview({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).slice(0, 6);
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 ml-3.5 bg-oai-surface-2 rounded-lg p-3 border border-oai-border">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between text-[11px] py-0.5">
          <span className="text-oai-text-muted font-mono">{key}</span>
          <span className="text-oai-text-secondary font-mono truncate ml-4 max-w-[200px]">
            {typeof value === "object" ? JSON.stringify(value).slice(0, 60) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}
