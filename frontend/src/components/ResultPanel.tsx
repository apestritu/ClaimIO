"use client";

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Shield,
  FileText,
  AlertOctagon,
} from "lucide-react";
import clsx from "clsx";

interface ResultPanelProps {
  summary: Record<string, unknown>;
}

export default function ResultPanel({ summary }: ResultPanelProps) {
  const status = summary.claim_status as string;
  const amount = summary.approved_amount as number;
  const confidence = summary.global_confidence as number;
  const coverageConf = summary.coverage_confidence as number;
  const meetsThresholds = summary.meets_thresholds as boolean;
  const issues = (summary.issues as string[]) || [];
  const fraudRisk = summary.fraud_risk as number;
  const sanctionsHit = summary.sanctions_hit as boolean;
  const reasoning = summary.coverage_reasoning as string;
  const docsCount = summary.documents_processed as number;
  const paymentProcessed = summary.payment_processed as boolean;
  const checklist = (summary.evidence_checklist as Array<Record<string, unknown>>) || [];

  const isApproved = status === "APPROVED";
  const isDenied = status === "DENIED";

  return (
    <div className="space-y-4">
      {/* Decision Banner */}
      <div
        className={clsx(
          "rounded-2xl border p-6 text-center",
          isApproved &&
            "bg-gradient-to-br from-oai-green/20 to-oai-green/5 border-oai-green/30",
          isDenied &&
            "bg-gradient-to-br from-oai-red/20 to-oai-red/5 border-oai-red/30",
          !isApproved &&
            !isDenied &&
            "bg-gradient-to-br from-oai-yellow/20 to-oai-yellow/5 border-oai-yellow/30"
        )}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          {isApproved && <CheckCircle2 className="w-8 h-8 text-oai-green" />}
          {isDenied && <XCircle className="w-8 h-8 text-oai-red" />}
          {!isApproved && !isDenied && (
            <AlertTriangle className="w-8 h-8 text-oai-yellow" />
          )}
          <h2
            className={clsx(
              "text-2xl font-bold",
              isApproved && "text-oai-green",
              isDenied && "text-oai-red",
              !isApproved && !isDenied && "text-oai-yellow"
            )}
          >
            CLAIM {status}
          </h2>
        </div>
        {isApproved && (
          <p className="text-3xl font-bold text-oai-text">
            ${amount?.toFixed(2)}
          </p>
        )}
        <p className="text-sm text-oai-text-secondary mt-1">
          AI Confidence: {(confidence * 100).toFixed(1)}%
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Coverage Confidence"
          value={`${(coverageConf * 100).toFixed(1)}%`}
          color="green"
        />
        <StatCard
          icon={Shield}
          label="Fraud Risk"
          value={`${((fraudRisk || 0) * 100).toFixed(0)}%`}
          color={fraudRisk > 0.5 ? "red" : "green"}
        />
        <StatCard
          icon={FileText}
          label="Documents Processed"
          value={String(docsCount || 0)}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Payment"
          value={paymentProcessed ? "Processed" : "N/A"}
          color={paymentProcessed ? "green" : "muted"}
        />
      </div>

      {/* Evidence Checklist */}
      {checklist.length > 0 && (
        <div className="bg-oai-surface rounded-2xl border border-oai-border overflow-hidden">
          <div className="px-5 py-3 border-b border-oai-border">
            <h3 className="text-sm font-semibold text-oai-text">
              Evidence Checklist
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {checklist.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1"
              >
                <div className="flex items-center gap-2">
                  {item.status === "provided" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-oai-green" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-oai-red" />
                  )}
                  <span className="text-oai-text-secondary">
                    {item.requirement as string}
                  </span>
                </div>
                <span className="text-oai-text-muted font-mono">
                  {item.status === "provided"
                    ? `${((item.confidence as number) * 100).toFixed(0)}%`
                    : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div className="bg-oai-surface rounded-2xl border border-oai-red/30 overflow-hidden">
          <div className="px-5 py-3 border-b border-oai-red/20">
            <h3 className="text-sm font-semibold text-oai-red flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              Issues Found
            </h3>
          </div>
          <div className="p-4 space-y-1">
            {issues.map((issue, i) => (
              <p key={i} className="text-xs text-oai-text-secondary">
                • {issue}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <div className="bg-oai-surface rounded-2xl border border-oai-border overflow-hidden">
          <div className="px-5 py-3 border-b border-oai-border">
            <h3 className="text-sm font-semibold text-oai-text">
              Coverage Reasoning
            </h3>
          </div>
          <div className="p-4">
            <p className="text-xs text-oai-text-secondary leading-relaxed whitespace-pre-wrap">
              {reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: "text-oai-green",
    red: "text-oai-red",
    blue: "text-oai-blue",
    yellow: "text-oai-yellow",
    muted: "text-oai-text-muted",
  };

  return (
    <div className="bg-oai-surface rounded-xl border border-oai-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={clsx("w-4 h-4", colorMap[color] || colorMap.muted)} />
        <span className="text-[10px] text-oai-text-muted uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p
        className={clsx(
          "text-lg font-bold",
          colorMap[color] || "text-oai-text"
        )}
      >
        {value}
      </p>
    </div>
  );
}
