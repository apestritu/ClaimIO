"use client";

import { useEffect, useRef } from "react";
import { Activity } from "lucide-react";
import clsx from "clsx";
import type { AgentEvent } from "@/lib/useEventStream";

interface EventFeedProps {
  events: AgentEvent[];
}

export default function EventFeed({ events }: EventFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="bg-oai-surface rounded-2xl border border-oai-border overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-oai-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-oai-text flex items-center gap-2">
          <Activity className="w-4 h-4 text-oai-green" />
          A2A Event Feed
        </h2>
        <span className="text-[10px] font-mono text-oai-text-muted bg-oai-surface-2 px-2 py-0.5 rounded-full">
          {events.length} events
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 max-h-[600px]">
        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs text-oai-text-muted">
              Events will appear here when the pipeline starts
            </p>
          </div>
        )}
        {events.map((evt) => (
          <div key={evt.id} className="animate-fade-in-up">
            <div className="flex items-start gap-3 group">
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    "w-2 h-2 rounded-full mt-1",
                    evt.status === "completed" && "bg-oai-green",
                    evt.status === "working" && "bg-oai-yellow",
                    evt.status === "failed" && "bg-oai-red",
                    evt.status === "submitted" && "bg-oai-blue"
                  )}
                />
                <div className="w-px h-full bg-oai-border mt-1" />
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold text-oai-green font-mono">
                    {evt.agent}
                  </span>
                  <span
                    className={clsx(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded-full",
                      evt.status === "completed" && "bg-oai-green/10 text-oai-green",
                      evt.status === "working" && "bg-oai-yellow/10 text-oai-yellow",
                      evt.status === "failed" && "bg-oai-red/10 text-oai-red",
                      evt.status === "submitted" && "bg-oai-blue/10 text-oai-blue"
                    )}
                  >
                    {evt.status}
                  </span>
                  <span className="text-[9px] text-oai-text-muted font-mono ml-auto">
                    {new Date(evt.timestamp * 1000).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-oai-text-secondary leading-relaxed">
                  {evt.message}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
