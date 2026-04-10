"use client";

import {
  FileSearch,
  FolderCheck,
  Brain,
  BarChart3,
  Shield,
  Scale,
  Gavel,
  CreditCard,
  Bell,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const STEPS = [
  { id: "IngestAgent", label: "Ingest", icon: FileSearch, desc: "OCR + Classify" },
  { id: "EvidenceCollectionAgent", label: "Evidence", icon: FolderCheck, desc: "Verify Docs" },
  { id: "FactExtractionAgent", label: "Facts", icon: Brain, desc: "Extract Data" },
  { id: "EvidenceEvaluationAgent", label: "Evaluate", icon: BarChart3, desc: "Assess Quality" },
  { id: "CoverageReasoningAgent", label: "Coverage", icon: Shield, desc: "Policy Analysis" },
  { id: "ComplianceAgent", label: "Compliance", icon: Scale, desc: "Sanctions + Fraud" },
  { id: "DecisionAgent", label: "Decision", icon: Gavel, desc: "Approve / Deny" },
  { id: "PaymentAgent", label: "Payment", icon: CreditCard, desc: "Process Pay" },
  { id: "CloseNotifyAgent", label: "Close", icon: Bell, desc: "Notify Claimant" },
];

interface PipelineProps {
  currentAgent: string | null;
  completedAgents: string[];
  onSelectAgent: (agentId: string) => void;
  selectedAgent: string | null;
}

export default function Pipeline({
  currentAgent,
  completedAgents,
  onSelectAgent,
  selectedAgent,
}: PipelineProps) {
  return (
    <div className="bg-oai-surface rounded-2xl border border-oai-border overflow-hidden">
      <div className="px-5 py-4 border-b border-oai-border">
        <h2 className="text-sm font-semibold text-oai-text">Agent Pipeline</h2>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const isActive = currentAgent === step.id;
            const isCompleted = completedAgents.includes(step.id);
            const isSelected = selectedAgent === step.id;
            const isPending = !isActive && !isCompleted;

            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => onSelectAgent(step.id)}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-300 min-w-[80px]",
                    isSelected && "ring-1 ring-oai-green/50",
                    isActive && "bg-oai-green/15 animate-pulse-glow",
                    isCompleted && !isActive && "bg-oai-green/5",
                    isPending && "opacity-40"
                  )}
                >
                  <div
                    className={clsx(
                      "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300",
                      isActive && "bg-oai-green text-white",
                      isCompleted && !isActive && "bg-oai-green/20 text-oai-green",
                      isPending && "bg-oai-surface-3 text-oai-text-muted"
                    )}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span
                    className={clsx(
                      "text-[10px] font-medium leading-tight text-center",
                      isActive && "text-oai-green",
                      isCompleted && "text-oai-text-secondary",
                      isPending && "text-oai-text-muted"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight
                    className={clsx(
                      "w-3 h-3 flex-shrink-0 mx-0.5",
                      isCompleted ? "text-oai-green/50" : "text-oai-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { STEPS };
