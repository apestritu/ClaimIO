"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_DOCUMENTS, type LogEntry } from '@/lib/claim-data';
import type { CollectAgentData } from '@/lib/agent-data-mapper';
import { getDocTypeStyle } from '@/lib/doc-type-styles';

interface CollectAnimationProps {
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
  onReportGenerated: (report: { name: string; color: string }) => void;
  agentData?: CollectAgentData;
}

const DOC_SLOTS = [
  { type: 'Policy', icon: '📋', color: 'oklch(0.62 0.19 250)', label: 'Policy' },
  { type: 'ClaimForm', icon: '📝', color: 'oklch(0.55 0.2 270)', label: 'Claim Form' },
  { type: 'BagReport', icon: '🧳', color: 'oklch(0.8 0.16 80)', label: 'Bag Report' },
  { type: 'FlightTicket', icon: '✈️', color: 'oklch(0.7 0.15 195)', label: 'Flight Ticket' },
  { type: 'Receipt', icon: '🧾', color: 'oklch(0.7 0.17 160)', label: 'Receipts' },
];

export function CollectAnimation({ addLog, onComplete, onReportGenerated, agentData }: CollectAnimationProps) {
  const [droppedCount, setDroppedCount] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const startedRef = useRef(false);

  const docGroups = agentData && Object.keys(agentData.docsByType).length > 0
    ? Object.entries(agentData.docsByType).map(([type, filenames]) => ({
        type,
        docs: filenames.map((fn, i) => {
          const style = getDocTypeStyle(type);
          const found = agentData.documents.find(d => d.name === fn);
          return {
            id: `${type}-${i}`,
            name: fn,
            size: found?.size ?? '—',
            type: type as 'Policy' | 'ClaimForm' | 'BagReport' | 'FlightTicket' | 'Receipt',
            confidence: found?.confidence ?? 0,
            icon: style.icon,
            color: style.color,
          };
        }),
      }))
    : [
        { type: 'Policy', docs: MOCK_DOCUMENTS.filter(d => d.type === 'Policy') },
        { type: 'ClaimForm', docs: MOCK_DOCUMENTS.filter(d => d.type === 'ClaimForm') },
        { type: 'BagReport', docs: MOCK_DOCUMENTS.filter(d => d.type === 'BagReport') },
        { type: 'FlightTicket', docs: MOCK_DOCUMENTS.filter(d => d.type === 'FlightTicket') },
        { type: 'Receipt', docs: MOCK_DOCUMENTS.filter(d => d.type === 'Receipt') },
      ];

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    addLog({ icon: '🏭', text: 'Factory assembly line starting...' });

    const t: ReturnType<typeof setTimeout>[] = [];

    // Drop each doc group onto the conveyor one by one
    docGroups.forEach((g, i) => {
      t.push(setTimeout(() => {
        setDroppedCount(i + 1);
        const avgConf = g.docs.reduce((s, d) => s + d.confidence, 0) / g.docs.length;
        addLog({
          icon: '✓',
          text: `${g.type}: ${g.docs.length} file(s), confidence ${avgConf.toFixed(2)}`,
        });
      }, 300 + i * 350));
    });

    // Press phase
    const pressStart = 300 + docGroups.length * 350 + 200;
    t.push(setTimeout(() => {
      setPressing(true);
      addLog({ icon: '📊', text: 'Document-set confidence: 0.89' });
    }, pressStart));

    // Show PDF output
    t.push(setTimeout(() => {
      setPressing(false);
      setShowPdf(true);
      addLog({ icon: '�', text: 'Evidence Collection ready' });
      onReportGenerated({ name: 'Evidence Collection', color: 'oklch(0.55 0.2 270)' });
    }, pressStart + 750));

    // Show stamp
    t.push(setTimeout(() => {
      setShowStamp(true);
    }, pressStart + 1100));

    // Complete
    t.push(setTimeout(onComplete, pressStart + 2000));

    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beltProgress = pressing || showPdf
    ? 100
    : Math.max(0, (droppedCount / DOC_SLOTS.length) * 100);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-6">
      {/* Title */}
      <motion.div
        className="text-[10px] font-mono uppercase tracking-[0.2em]"
        style={{ color: 'oklch(0.55 0.2 270)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        🏭 Evidence Collection — Assembly Line
      </motion.div>

      {/* Conveyor belt with mold slots */}
      <div className="relative flex items-end justify-center gap-4" style={{ height: 160 }}>
        {DOC_SLOTS.map((slot, i) => {
          const dropped = i < droppedCount;
          return (
            <div key={slot.type} className="relative flex flex-col items-center" style={{ width: 80 }}>
              {/* Mold slot */}
              <motion.div
                className="w-16 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1"
                style={{
                  borderColor: dropped
                    ? slot.color
                    : 'oklch(0.35 0.02 256)',
                  background: dropped
                    ? `${slot.color}12`
                    : 'oklch(0.18 0.02 256 / 60%)',
                  boxShadow: dropped
                    ? `0 0 15px ${slot.color}20, inset 0 0 8px ${slot.color}08`
                    : 'none',
                  transition: 'border-color 0.3s, background 0.3s, box-shadow 0.3s',
                }}
              >
                {dropped ? (
                  <motion.div
                    className="flex flex-col items-center gap-0.5"
                    initial={{ y: -50, opacity: 0, scale: 0.4 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  >
                    <span className="text-2xl">{slot.icon}</span>
                    <span className="text-[7px] font-mono font-bold" style={{ color: slot.color }}>
                      {docGroups[i]?.docs.length || 0} file{(docGroups[i]?.docs.length || 0) > 1 ? 's' : ''}
                    </span>
                  </motion.div>
                ) : (
                  <span className="text-2xl opacity-20">{slot.icon}</span>
                )}
              </motion.div>

              {/* Status light */}
              <motion.div
                className="w-2.5 h-2.5 rounded-full mt-2"
                style={{
                  background: dropped ? 'oklch(0.7 0.17 160)' : 'oklch(0.25 0.02 256)',
                  boxShadow: dropped ? '0 0 8px oklch(0.7 0.17 160 / 50%)' : 'none',
                }}
                animate={dropped ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.4 }}
              />

              {/* Label */}
              <span
                className="text-[9px] font-mono mt-1.5 text-center"
                style={{ color: dropped ? slot.color : 'oklch(0.4 0.02 256)' }}
              >
                {slot.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Conveyor track */}
      <div className="w-full max-w-lg h-1.5 rounded-full" style={{ background: 'oklch(0.22 0.02 256)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'oklch(0.55 0.2 270)' }}
          animate={{ width: `${beltProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Press / PDF output area */}
      <div className="relative flex flex-col items-center" style={{ minHeight: 80 }}>
        <AnimatePresence mode="wait">
          {pressing && !showPdf && (
            <motion.div
              key="press"
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div
                className="text-4xl"
                animate={{ scaleY: [1, 0.5, 1] }}
                transition={{ repeat: 3, duration: 0.35 }}
              >
                🏭
              </motion.div>
              <span className="text-[9px] font-mono" style={{ color: 'oklch(0.55 0.2 270)' }}>
                Pressing documents...
              </span>
            </motion.div>
          )}

          {showPdf && (
            <motion.div
              key="pdf"
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 250, damping: 15 }}
            >
              {/* PDF card */}
              <motion.div
                className="relative rounded-xl px-6 py-4 flex flex-col items-center gap-2"
                style={{
                  background: 'oklch(0.16 0.025 270 / 90%)',
                  border: '2px solid oklch(0.55 0.2 270 / 50%)',
                  boxShadow: '0 0 25px oklch(0.55 0.2 270 / 15%), 0 8px 30px oklch(0 0 0 / 30%)',
                }}
              >
                <span className="text-2xl">📄</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: 'oklch(0.75 0.15 270)' }}>
                  Evidence Collection
                </span>

                {/* Doc type dots */}
                <div className="flex gap-1.5 mt-1">
                  {DOC_SLOTS.map((slot) => (
                    <div
                      key={slot.type}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: slot.color }}
                    />
                  ))}
                </div>

                <span className="text-[7px] font-mono text-muted-foreground">
                  {MOCK_DOCUMENTS.length} documents collected
                </span>

                {/* Confidence stamp */}
                {showStamp && (
                  <motion.div
                    className="px-4 py-1.5 rounded-md text-center text-[10px] font-bold font-mono mt-1"
                    style={{
                      background: 'oklch(0.7 0.15 195 / 15%)',
                      border: '1px solid oklch(0.7 0.15 195 / 30%)',
                      color: 'oklch(0.7 0.15 195)',
                    }}
                    initial={{ scale: 2.5, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  >
                    C_docs: 0.89
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
