"use client";

import { motion } from "framer-motion";
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

interface ResultPanelProps {
  summary: Record<string, unknown>;
}

export default function ResultPanel({ summary }: ResultPanelProps) {
  const status = summary.claim_status as string;
  const amount = summary.approved_amount as number;
  const confidence = summary.global_confidence as number;
  const coverageConf = summary.coverage_confidence as number;
  const issues = (summary.issues as string[]) || [];
  const fraudRisk = summary.fraud_risk as number;
  const reasoning = summary.coverage_reasoning as string;
  const docsCount = summary.documents_processed as number;
  const paymentProcessed = summary.payment_processed as boolean;
  const checklist = (summary.evidence_checklist as Array<Record<string, unknown>>) || [];

  const isApproved = status === "APPROVED";
  const isDenied = status === "DENIED";

  const statusColor = isApproved
    ? "oklch(0.7 0.17 160)"
    : isDenied
    ? "oklch(0.65 0.2 15)"
    : "oklch(0.8 0.16 80)";

  return (
    <motion.div
      className="space-y-4 p-6 pb-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Decision Banner */}
      <motion.div
        className="rounded-2xl p-6 text-center glass-panel"
        style={{ borderColor: `${statusColor}40` }}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          {isApproved && <CheckCircle2 className="w-8 h-8" style={{ color: statusColor }} />}
          {isDenied && <XCircle className="w-8 h-8" style={{ color: statusColor }} />}
          {!isApproved && !isDenied && (
            <AlertTriangle className="w-8 h-8" style={{ color: statusColor }} />
          )}
          <h2
            className="text-2xl font-bold"
            style={{ color: statusColor }}
          >
            CLAIM {status}
          </h2>
        </div>
        {isApproved && (
          <p className="text-3xl font-bold text-foreground">
            ${amount?.toFixed(2)}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          AI Confidence: {((confidence || 0) * 100).toFixed(1)}%
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Coverage Confidence"
          value={`${((coverageConf || 0) * 100).toFixed(1)}%`}
          color="oklch(0.7 0.17 160)"
        />
        <StatCard
          icon={Shield}
          label="Fraud Risk"
          value={`${((fraudRisk || 0) * 100).toFixed(0)}%`}
          color={fraudRisk > 0.5 ? "oklch(0.65 0.2 15)" : "oklch(0.7 0.17 160)"}
        />
        <StatCard
          icon={FileText}
          label="Documents Processed"
          value={String(docsCount || 0)}
          color="oklch(0.62 0.19 250)"
        />
        <StatCard
          icon={DollarSign}
          label="Payment"
          value={paymentProcessed ? "Processed" : "N/A"}
          color={paymentProcessed ? "oklch(0.7 0.17 160)" : "oklch(0.65 0.02 250)"}
        />
      </div>

      {/* Evidence Checklist */}
      {checklist.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-glass-border">
            <h3 className="text-sm font-semibold text-foreground">
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose" />
                  )}
                  <span className="text-muted-foreground">
                    {item.requirement as string}
                  </span>
                </div>
                <span className="text-muted-foreground/60 font-mono">
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
        <div className="glass-panel rounded-2xl overflow-hidden" style={{ borderColor: "oklch(0.65 0.2 15 / 30%)" }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: "oklch(0.65 0.2 15 / 20%)" }}>
            <h3 className="text-sm font-semibold text-rose flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              Issues Found
            </h3>
          </div>
          <div className="p-4 space-y-1 max-h-60 overflow-y-auto">
            {issues.map((issue, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                • {issue}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-glass-border">
            <h3 className="text-sm font-semibold text-foreground">
              Coverage Reasoning
            </h3>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {reasoning}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <motion.div
      className="glass-panel rounded-xl p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold" style={{ color }}>
        {value}
      </p>
    </motion.div>
  );
}
