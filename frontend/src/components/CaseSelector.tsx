"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, FileText, X } from "lucide-react";
import type { LogEntry } from "@/lib/claim-data";

interface CaseInfo {
  id: string;
  name: string;
  document_count: number;
  documents: string[];
}

const MOCK_CASES: CaseInfo[] = [
  {
    id: "Case 1",
    name: "Case 1",
    document_count: 6,
    documents: [
      "policy_cert.pdf",
      "claim_form_v2.pdf",
      "bag_damage_report.pdf",
      "flight_ticket_AA123.pdf",
      "repair_receipt.pdf",
      "replacement_receipt.pdf",
    ],
  },
  {
    id: "Case 2",
    name: "Case 2",
    document_count: 4,
    documents: [
      "auto_policy.pdf",
      "accident_report.pdf",
      "repair_estimate.pdf",
      "photos.zip",
    ],
  },
];

interface CaseSelectorProps {
  onStart: (caseId: string) => void;
  addLog: (log: Omit<LogEntry, "id" | "timestamp">) => void;
  isRunning: boolean;
  demoMode?: boolean;
}

export default function CaseSelector({
  onStart,
  addLog,
  isRunning,
  demoMode = false,
}: CaseSelectorProps) {
  const [cases, setCases] = useState<CaseInfo[]>(demoMode ? MOCK_CASES : []);
  const [selected, setSelected] = useState<string | null>(null);
  const [boxState, setBoxState] = useState<"empty" | "filling" | "sealed">("empty");
  const [loadedDocs, setLoadedDocs] = useState<string[]>([]);

  useEffect(() => {
    if (demoMode) {
      setCases(MOCK_CASES);
      return;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiBase}/api/cases`)
      .then((r) => r.json())
      .then((data) => {
        setCases(data.cases || []);
      })
      .catch(() => {});
  }, [demoMode]);

  const handleSelectCase = useCallback(
    (caseId: string) => {
      if (isRunning) return;
      const c = cases.find((x) => x.id === caseId);
      if (!c) return;

      setSelected(caseId);
      setBoxState("filling");
      setLoadedDocs([]);
      addLog({ icon: "📦", text: `Loading case: ${c.name}...` });

      c.documents.forEach((doc, i) => {
        setTimeout(() => {
          setLoadedDocs((prev) => [...prev, doc]);
          addLog({ icon: "📄", text: `Loaded: ${doc}` });
          if (i === c.documents.length - 1) {
            setTimeout(() => {
              setBoxState("sealed");
              addLog({
                icon: "✅",
                text: `${c.documents.length} documents ready for processing`,
              });
            }, 600);
          }
        }, (i + 1) * 300);
      });
    },
    [cases, isRunning, addLog]
  );

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-8">
        <AnimatePresence mode="wait">
          {boxState === "empty" ? (
            <motion.div
              key="case-select"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CloudUpload size={48} className="text-muted-foreground" />
              </motion.div>
              <div className="text-center mb-2">
                <p className="text-sm font-medium text-foreground">
                  Select a claim case to process
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a case below to start the AI pipeline
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {cases.map((c) => (
                  <motion.button
                    key={c.id}
                    onClick={() => handleSelectCase(c.id)}
                    disabled={isRunning}
                    className="px-6 py-4 rounded-xl glass-panel hover:bg-glass-border transition-all text-left"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {c.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {c.document_count} documents
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="box"
              className="relative w-80 h-56 flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Cardboard box */}
              <div className="relative w-48 h-36">
                <div
                  className="absolute bottom-0 w-full h-28 rounded-md"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.6 0.1 60), oklch(0.5 0.1 55))",
                    boxShadow: "0 8px 30px oklch(0 0 0 / 40%)",
                  }}
                />
                <AnimatePresence>
                  {boxState === "sealed" && (
                    <>
                      <motion.div
                        className="absolute top-6 left-0 w-1/2 h-8 origin-bottom rounded-tl-sm"
                        style={{ background: "oklch(0.55 0.1 58)" }}
                        initial={{ rotateX: -180 }}
                        animate={{ rotateX: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                      <motion.div
                        className="absolute top-6 right-0 w-1/2 h-8 origin-bottom rounded-tr-sm"
                        style={{ background: "oklch(0.52 0.1 56)" }}
                        initial={{ rotateX: -180 }}
                        animate={{ rotateX: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                      <motion.div
                        className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10"
                        style={{
                          background:
                            "radial-gradient(circle, oklch(0.62 0.19 250), oklch(0.5 0.2 250))",
                          boxShadow: "0 0 20px oklch(0.62 0.19 250 / 50%)",
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                          delay: 0.5,
                        }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: "oklch(1 0 0)" }}
                        >
                          AI
                        </span>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {loadedDocs.map((doc, i) => (
                  <motion.div
                    key={doc}
                    className="absolute w-16 h-20 rounded-sm flex flex-col items-center justify-center"
                    style={{
                      background: "oklch(0.95 0 0)",
                      left: `${20 + (i % 3) * 20}%`,
                      boxShadow: "0 2px 8px oklch(0 0 0 / 20%)",
                    }}
                    initial={{
                      y: -200,
                      x: (i - 2.5) * 15,
                      rotate: (i - 2.5) * 8,
                      opacity: 0,
                    }}
                    animate={{
                      y: boxState === "sealed" ? 30 : 10 + i * 2,
                      x: (i - 2.5) * 5,
                      rotate: (i - 2.5) * 3,
                      opacity: boxState === "sealed" ? 0 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      opacity: { duration: 0.3 },
                    }}
                  >
                    <FileText
                      size={14}
                      style={{ color: "oklch(0.55 0.2 15)" }}
                    />
                    <span
                      className="text-[6px] mt-1 text-center px-1 truncate w-full"
                      style={{ color: "oklch(0.3 0 0)" }}
                    >
                      {doc.slice(0, 12)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {boxState === "sealed" && !isRunning && (
            <motion.button
              className="px-8 py-3 rounded-xl font-semibold text-sm tracking-wide text-primary-foreground"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.62 0.19 250), oklch(0.55 0.2 270))",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 30px oklch(0.62 0.19 250 / 40%)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selected && onStart(selected)}
            >
              Process Claim →
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
