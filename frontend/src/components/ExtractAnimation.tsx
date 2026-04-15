"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_DOCUMENTS, type LogEntry } from '@/lib/claim-data';
import type { ExtractAgentData } from '@/lib/agent-data-mapper';
import { getDocTypeStyle } from '@/lib/doc-type-styles';

interface ExtractAnimationProps {
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
  onReportGenerated: (report: { name: string; color: string }) => void;
  agentData?: ExtractAgentData;
}

interface FactBubble {
  id: string;
  icon: string;
  label: string;
  value: string;
  color: string;
}

const DOC_FACTS: Record<string, FactBubble[]> = {
  'Policy': [
    { id: 'f1', icon: '📋', label: 'policy_number', value: 'TRV-2024-8841', color: 'oklch(0.55 0.2 270)' },
    { id: 'f2', icon: '📅', label: 'coverage_start', value: '2024-01-01', color: 'oklch(0.62 0.19 250)' },
  ],
  'ClaimForm': [
    { id: 'f3', icon: '📅', label: 'incident_date', value: '2024-03-15', color: 'oklch(0.62 0.19 250)' },
    { id: 'f4', icon: '🧳', label: 'bag_delay_start', value: '2024-03-15', color: 'oklch(0.8 0.16 80)' },
  ],
  'BagReport': [
    { id: 'f5', icon: '🧳', label: 'damage_type', value: 'Lost baggage', color: 'oklch(0.8 0.16 80)' },
    { id: 'f6', icon: '📍', label: 'location', value: 'CDG Airport', color: 'oklch(0.7 0.15 195)' },
  ],
  'FlightTicket': [
    { id: 'f7', icon: '✈️', label: 'trip', value: '2024-03-12 → 2024-03-20', color: 'oklch(0.7 0.15 195)' },
    { id: 'f8', icon: '✈️', label: 'flight', value: 'AA-123 / CDG→JFK', color: 'oklch(0.7 0.15 195)' },
  ],
  'Receipt': [
    { id: 'f9', icon: '💰', label: 'amount_1', value: '$127.50 USD', color: 'oklch(0.7 0.17 160)' },
    { id: 'f10', icon: '💰', label: 'amount_2', value: '$45.00 USD', color: 'oklch(0.7 0.17 160)' },
    { id: 'f11', icon: '💱', label: 'conversion', value: 'EUR → USD', color: 'oklch(0.8 0.16 80)' },
  ],
};

const LANE_COUNT = 4;

export function ExtractAnimation({ addLog, onComplete, onReportGenerated, agentData }: ExtractAnimationProps) {
  const [activeLanes, setActiveLanes] = useState<(typeof MOCK_DOCUMENTS[0] | null)[]>(Array(LANE_COUNT).fill(null));
  const [processedDocs, setProcessedDocs] = useState<string[]>([]);
  const [extractedFacts, setExtractedFacts] = useState<FactBubble[]>([]);
  const [showFactMap, setShowFactMap] = useState(false);
  const [showCurrencyFlip, setShowCurrencyFlip] = useState(false);
  const startedRef = useRef(false);

  const uniqueDocs = agentData
    ? agentData.extractions.map((ext, i) => ({
        id: String(i + 1),
        name: ext.filename,
        size: '—',
        type: ext.docType as typeof MOCK_DOCUMENTS[0]['type'],
        confidence: ext.confidence,
        icon: ext.icon,
        color: ext.color,
      }))
    : MOCK_DOCUMENTS.filter((d, i, arr) => arr.findIndex(x => x.type === d.type) === i);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    addLog({ icon: '🧠', text: `Extracting facts from ${MOCK_DOCUMENTS.length} documents (${LANE_COUNT} parallel)...` });

    const batches: typeof uniqueDocs[] = [];
    for (let i = 0; i < uniqueDocs.length; i += LANE_COUNT) {
      batches.push(uniqueDocs.slice(i, i + LANE_COUNT));
    }

    let batchIndex = 0;

    const processBatch = () => {
      if (batchIndex >= batches.length) {
        setTimeout(() => {
          setShowFactMap(true);
          addLog({ icon: '🗺️', text: 'Fact Map consolidated — all extractions complete' });
          onReportGenerated({ name: 'Fact_Extraction.pdf', color: 'oklch(0.7 0.15 195)' });
          setTimeout(onComplete, 2500);
        }, 800);
        return;
      }

      const batch = batches[batchIndex];
      const newLanes: (typeof MOCK_DOCUMENTS[0] | null)[] = Array(LANE_COUNT).fill(null);
      batch.forEach((doc, i) => {
        newLanes[i] = doc;
        addLog({ icon: '⚙️', text: `[Thread ${i + 1}] Processing ${doc.name}...` });
      });
      setActiveLanes(newLanes);

      if (batch.some(d => d.type === 'Receipt')) {
        setTimeout(() => setShowCurrencyFlip(true), 1200);
        setTimeout(() => setShowCurrencyFlip(false), 2200);
      }

      setTimeout(() => {
        batch.forEach((doc) => {
          const facts = DOC_FACTS[doc.type] || [];
          setExtractedFacts(prev => [...prev, ...facts]);
          setProcessedDocs(prev => [...prev, doc.id]);
          addLog({ icon: '✅', text: `${doc.name} → ${doc.type} | conf: ${doc.confidence.toFixed(2)}` });
        });

        setActiveLanes(Array(LANE_COUNT).fill(null));
        batchIndex++;
        setTimeout(processBatch, 600);
      }, 2500);
    };

    setTimeout(processBatch, 600);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 pt-16 pb-4 gap-4">
      {/* Document cards row */}
      <div className="flex gap-2 flex-wrap justify-center">
        {uniqueDocs.map((doc, i) => {
          const isDone = processedDocs.includes(doc.id);
          const isActive = activeLanes.some(l => l?.id === doc.id);
          return (
            <motion.div
              key={doc.id}
              className="w-24 h-11 rounded-lg flex items-center gap-1.5 px-2 text-[10px] font-mono"
              style={{
                background: 'oklch(0.2 0.02 256)',
                border: `1px solid ${isDone ? 'oklch(0.7 0.17 160 / 50%)' : isActive ? 'oklch(0.7 0.15 195 / 50%)' : 'oklch(0.3 0.02 256)'}`,
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <span>{doc.icon}</span>
              <span className="truncate text-muted-foreground">{doc.type}</span>
              {isDone && <span className="text-emerald ml-auto">✓</span>}
            </motion.div>
          );
        })}
      </div>

      {/* Parallel lanes label */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
        <span>⚡</span>
        <span>{LANE_COUNT} parallel workers</span>
      </div>

      {/* Processing lanes */}
      <div className="w-full max-w-2xl space-y-2">
        {Array.from({ length: LANE_COUNT }).map((_, laneIdx) => {
          const doc = activeLanes[laneIdx];
          return (
            <motion.div
              key={laneIdx}
              className="h-20 rounded-lg relative overflow-hidden flex items-center px-4"
              style={{
                background: doc ? 'oklch(0.18 0.03 195 / 20%)' : 'oklch(0.18 0.02 256 / 30%)',
                border: `1px solid ${doc ? 'oklch(0.7 0.15 195 / 20%)' : 'oklch(0.3 0.02 256 / 30%)'}`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: laneIdx * 0.05 }}
            >
              <AnimatePresence mode="wait">
                {doc && (
                  <motion.div
                    key={doc.id}
                    className="flex items-center gap-4 w-full"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    {/* Open book doc */}
                    <div
                      className="w-14 h-14 rounded-md flex items-center justify-center text-lg relative"
                      style={{
                        background: 'oklch(0.22 0.02 256)',
                        border: `1px solid ${doc.color}`,
                        boxShadow: `0 0 15px ${doc.color}30`,
                      }}
                    >
                      {doc.icon}
                      {/* AI brain icon */}
                      <motion.div
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{ background: 'oklch(0.7 0.15 195)', color: 'oklch(0.145 0.03 256)' }}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🧠
                      </motion.div>
                    </div>

                    {/* Doc info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-mono text-foreground truncate">{doc.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{doc.type} — extracting...</div>
                    </div>

                    {/* Sparkle particles */}
                    {[0, 1, 2].map(p => (
                      <motion.div
                        key={p}
                        className="absolute w-1 h-1 rounded-full"
                        style={{ background: 'oklch(0.7 0.15 195)', left: `${30 + p * 15}%`, top: '30%' }}
                        animate={{
                          y: [-5, -15],
                          opacity: [0.8, 0],
                          scale: [1, 0.5],
                        }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: p * 0.3 }}
                      />
                    ))}

                    {/* Fact bubbles popping out */}
                    <div className="flex gap-1 flex-wrap max-w-[180px]">
                      {(DOC_FACTS[doc.type] || []).map((fact, fi) => (
                        <motion.div
                          key={fact.id}
                          className="px-2 py-0.5 rounded-full text-[9px] font-mono whitespace-nowrap"
                          style={{
                            background: `${fact.color}20`,
                            border: `1px solid ${fact.color}40`,
                            color: fact.color,
                          }}
                          initial={{ opacity: 0, y: 10, scale: 0.5 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.8 + fi * 0.4, type: 'spring', stiffness: 250 }}
                        >
                          {fact.icon} <span className="font-bold">{fact.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!doc && (
                <div className="text-[10px] font-mono text-muted-foreground/30">
                  Thread {laneIdx + 1} — idle
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Currency conversion micro-animation */}
      <AnimatePresence>
        {showCurrencyFlip && (
          <motion.div
            className="flex items-center gap-2 text-sm font-bold"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <motion.span
              style={{ color: 'oklch(0.8 0.16 80)' }}
              animate={{ rotateY: [0, 90] }}
              transition={{ duration: 0.3 }}
            >
              €
            </motion.span>
            <span className="text-[10px] text-muted-foreground">→</span>
            <motion.span
              style={{ color: 'oklch(0.7 0.17 160)' }}
              initial={{ rotateY: -90 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              $
            </motion.span>
            <span className="text-[10px] font-mono text-muted-foreground ml-1">EUR → USD normalized</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fact Map orb */}
      <AnimatePresence>
        {showFactMap && (
          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          >
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center relative"
              style={{
                background: 'radial-gradient(circle, oklch(0.7 0.15 195 / 30%), oklch(0.55 0.2 270 / 10%))',
                border: '1px solid oklch(0.7 0.15 195 / 40%)',
                boxShadow: '0 0 40px oklch(0.7 0.15 195 / 25%), 0 0 80px oklch(0.55 0.2 270 / 10%)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-2xl">🗺️</span>
              {/* Orbiting fact dots */}
              {extractedFacts.slice(0, 8).map((fact, i) => (
                <motion.div
                  key={fact.id}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ background: fact.color }}
                  animate={{
                    x: Math.cos((i / 8) * Math.PI * 2) * 35,
                    y: Math.sin((i / 8) * Math.PI * 2) * 35,
                  }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                />
              ))}
            </motion.div>
            <p className="text-[13px] font-mono text-cyan">
              Fact Map — {extractedFacts.length} facts extracted
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
