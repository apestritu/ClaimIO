"use client";

import { useEffect, useState } from "react";
import { FolderOpen, FileText, Play, RotateCcw } from "lucide-react";
import clsx from "clsx";

interface CaseInfo {
  id: string;
  name: string;
  document_count: number;
  documents: string[];
}

interface CaseSelectorProps {
  onStart: (caseId: string) => void;
  onReset: () => void;
  isRunning: boolean;
  hasResults: boolean;
}

export default function CaseSelector({
  onStart,
  onReset,
  isRunning,
  hasResults,
}: CaseSelectorProps) {
  const [cases, setCases] = useState<CaseInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiBase}/api/cases`)
      .then((r) => r.json())
      .then((data) => {
        setCases(data.cases || []);
        if (data.cases?.length > 0) setSelected(data.cases[0].id);
      })
      .catch(() => {});
  }, []);

  const selectedCase = cases.find((c) => c.id === selected);

  return (
    <div className="bg-oai-surface rounded-2xl border border-oai-border overflow-hidden">
      <div className="px-5 py-4 border-b border-oai-border">
        <h2 className="text-sm font-semibold text-oai-text flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-oai-green" />
          Select Claim Case
        </h2>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              disabled={isRunning}
              className={clsx(
                "p-4 rounded-xl border text-left transition-all duration-200",
                selected === c.id
                  ? "border-oai-green bg-oai-green/10 shadow-[0_0_15px_rgba(16,163,127,0.15)]"
                  : "border-oai-border bg-oai-surface-2 hover:border-oai-border-light",
                isRunning && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-oai-green" />
                <span className="text-sm font-medium text-oai-text">
                  {c.name}
                </span>
              </div>
              <p className="text-xs text-oai-text-secondary">
                {c.document_count} documents
              </p>
            </button>
          ))}
        </div>

        {selectedCase && (
          <div className="bg-oai-surface-2 rounded-xl p-4 border border-oai-border">
            <p className="text-xs text-oai-text-muted mb-2 font-medium uppercase tracking-wide">
              Documents
            </p>
            <div className="space-y-1">
              {selectedCase.documents.map((doc) => (
                <div
                  key={doc}
                  className="text-xs text-oai-text-secondary font-mono truncate"
                >
                  {doc}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => selected && onStart(selected)}
            disabled={!selected || isRunning}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
              "text-sm font-medium transition-all duration-200",
              !selected || isRunning
                ? "bg-oai-surface-3 text-oai-text-muted cursor-not-allowed"
                : "bg-oai-green text-white hover:bg-oai-green-dark active:scale-[0.98] shadow-lg shadow-oai-green/20"
            )}
          >
            {isRunning ? (
              <>
                <div className="flex gap-1">
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Process Claim
              </>
            )}
          </button>
          {hasResults && (
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-oai-border text-sm font-medium text-oai-text-secondary hover:text-oai-text hover:border-oai-border-light transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
