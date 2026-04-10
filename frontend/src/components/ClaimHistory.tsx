"use client";

import { useEffect, useState, useCallback } from "react";
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import clsx from "clsx";

interface HistoryRun {
  id: string;
  case_id: string;
  status: string;
  started_at: number;
  finished_at: number;
  event_count: number;
  agents_completed: string[];
  summary: Record<string, unknown> | null;
}

interface ClaimHistoryProps {
  refreshTrigger: number;
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: number, end: number): string {
  const secs = Math.round(end - start);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}m ${rem}s`;
}

export default function ClaimHistory({ refreshTrigger }: ClaimHistoryProps) {
  const [runs, setRuns] = useState<HistoryRun[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/history`);
      const data = await res.json();
      setRuns(data.runs || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  const deleteRun = async (id: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    await fetch(`${apiBase}/api/history/${id}`, { method: "DELETE" });
    setRuns((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAll = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    await fetch(`${apiBase}/api/history`, { method: "DELETE" });
    setRuns([]);
  };

  const statusIcon = (status: string) => {
    if (status === "completed")
      return <CheckCircle2 className="w-4 h-4 text-oai-green" />;
    if (status === "failed")
      return <XCircle className="w-4 h-4 text-oai-red" />;
    return <AlertTriangle className="w-4 h-4 text-oai-yellow" />;
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "text-oai-green";
    if (status === "failed") return "text-oai-red";
    return "text-oai-yellow";
  };

  return (
    <div className="bg-oai-surface rounded-2xl border border-oai-border overflow-hidden">
      <div className="px-5 py-4 border-b border-oai-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-oai-text flex items-center gap-2">
          <History className="w-4 h-4 text-oai-purple" />
          Claim History
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-1.5 rounded-lg text-oai-text-muted hover:text-oai-text hover:bg-oai-surface-2 transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={clsx("w-3.5 h-3.5", loading && "animate-spin")}
            />
          </button>
          {runs.length > 0 && (
            <button
              onClick={clearAll}
              className="p-1.5 rounded-lg text-oai-text-muted hover:text-oai-red hover:bg-oai-red/10 transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {runs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-8 h-8 text-oai-text-muted mx-auto mb-2 opacity-40" />
            <p className="text-xs text-oai-text-muted">
              No claims processed yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-oai-border">
            {runs.map((run) => {
              const expanded = expandedId === run.id;
              const summary = run.summary;
              const decision = summary?.claim_status as string | undefined;
              const amount = summary?.approved_amount as number | undefined;

              return (
                <div key={run.id} className="group">
                  <button
                    onClick={() =>
                      setExpandedId(expanded ? null : run.id)
                    }
                    className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-oai-surface-2 transition-colors"
                  >
                    {statusIcon(run.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-oai-text">
                          {run.case_id}
                        </span>
                        {decision && (
                          <span
                            className={clsx(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase",
                              decision === "APPROVED" &&
                                "bg-oai-green/15 text-oai-green",
                              decision === "DENIED" &&
                                "bg-oai-red/15 text-oai-red",
                              decision !== "APPROVED" &&
                                decision !== "DENIED" &&
                                "bg-oai-yellow/15 text-oai-yellow"
                            )}
                          >
                            {decision}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-oai-text-muted mt-0.5">
                        <span>{formatTime(run.started_at)}</span>
                        <span>
                          {formatDuration(run.started_at, run.finished_at)}
                        </span>
                        <span>{run.event_count} events</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRun(run.id);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 text-oai-text-muted hover:text-oai-red hover:bg-oai-red/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {expanded ? (
                        <ChevronUp className="w-4 h-4 text-oai-text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-oai-text-muted" />
                      )}
                    </div>
                  </button>

                  {expanded && summary && (
                    <div className="px-5 pb-4 pt-1 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <MiniStat
                          label="Amount"
                          value={
                            amount != null ? `$${amount.toFixed(2)}` : "N/A"
                          }
                        />
                        <MiniStat
                          label="Confidence"
                          value={`${(((summary.global_confidence as number) || 0) * 100).toFixed(0)}%`}
                        />
                        <MiniStat
                          label="Fraud Risk"
                          value={`${(((summary.fraud_risk as number) || 0) * 100).toFixed(0)}%`}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <FileText className="w-3 h-3 text-oai-text-muted" />
                        <span className="text-[10px] text-oai-text-muted">
                          Agents:
                        </span>
                        {run.agents_completed
                          .filter((a) => a !== "Orchestrator")
                          .map((a) => (
                            <span
                              key={a}
                              className={clsx(
                                "text-[9px] px-1.5 py-0.5 rounded-md",
                                "bg-oai-surface-2 text-oai-text-secondary"
                              )}
                            >
                              {a.replace("Agent", "")}
                            </span>
                          ))}
                      </div>
                      {(summary.coverage_reasoning as string) && (
                        <p className="text-[10px] text-oai-text-muted leading-relaxed line-clamp-3">
                          {summary.coverage_reasoning as string}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-oai-surface-2 rounded-lg p-2 text-center">
      <p className="text-[9px] text-oai-text-muted uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xs font-semibold text-oai-text mt-0.5">{value}</p>
    </div>
  );
}
