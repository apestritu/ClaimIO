"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIM_ID, G_SCORE, ESCALATION_REASON } from './manualreview-data';

interface HandoffToHumanProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'packet' | 'aiEnter' | 'humanEnter' | 'handoff' | 'transfer' | 'speech' | 'seated' | 'card' | 'done';

export function HandoffToHuman({ onComplete, autoPlay = true }: HandoffToHumanProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setStage('packet'), 400));
    t.push(setTimeout(() => setStage('aiEnter'), 1400));
    t.push(setTimeout(() => setStage('humanEnter'), 2600));
    t.push(setTimeout(() => setStage('handoff'), 3800));
    t.push(setTimeout(() => setStage('transfer'), 4800));
    t.push(setTimeout(() => setStage('speech'), 5800));
    t.push(setTimeout(() => setStage('seated'), 7000));
    t.push(setTimeout(() => setStage('card'), 8200));
    t.push(setTimeout(() => setStage('done'), 9500));
    t.push(setTimeout(() => onComplete?.(), 11000));

    return () => t.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const stageOrder: Stage[] = ['idle', 'packet', 'aiEnter', 'humanEnter', 'handoff', 'transfer', 'speech', 'seated', 'card', 'done'];
  const stageIdx = stageOrder.indexOf(stage);

  const aiVisible = stageIdx >= 2 && stageIdx <= 6;
  const humanVisible = stageIdx >= 3;
  const packetWithAI = stageIdx >= 2 && stageIdx < 5;
  const packetWithHuman = stageIdx >= 5;
  const aiFading = stageIdx >= 6;

  // Color shift: vibrant → muted amber
  const bgFilter = stageIdx >= 5
    ? 'oklch(0.14 0.02 40)'
    : 'oklch(0.145 0.03 256)';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden transition-colors duration-1000" style={{ background: bgFilter }}>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 80)' }}>
          🤝 Handoff to Human — Manual Review
        </span>
      </div>

      <div className="relative flex items-center justify-center" style={{ width: 600, height: 300 }}>
        {/* AI Avatar (left side) */}
        <AnimatePresence>
          {aiVisible && (
            <motion.div
              className="absolute flex flex-col items-center gap-2"
              style={{ left: stageIdx >= 4 ? 200 : 80 }}
              initial={{ x: -100, opacity: 0 }}
              animate={{
                x: 0,
                opacity: aiFading ? 0.3 : 1,
                scale: aiFading ? 0.8 : 1,
              }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: aiFading ? 'oklch(0.2 0.03 250 / 50%)' : 'oklch(0.2 0.04 250)',
                  border: `2px solid ${aiFading ? 'oklch(0.3 0.05 250 / 30%)' : 'oklch(0.55 0.15 250 / 50%)'}`,
                  boxShadow: aiFading ? 'none' : '0 0 15px oklch(0.55 0.15 250 / 15%)',
                }}
              >
                <span className="text-2xl">🤖</span>
              </div>
              <span className="text-[7px] font-mono" style={{ color: aiFading ? 'oklch(0.4 0.04 256)' : 'oklch(0.55 0.15 250)' }}>AI Agent</span>

              {/* Speech bubble */}
              {stage === 'speech' && (
                <motion.div
                  className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap"
                  style={{
                    background: 'oklch(0.18 0.03 250)',
                    border: '1px solid oklch(0.3 0.05 250 / 40%)',
                  }}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <span className="text-[7px] font-mono italic" style={{ color: 'oklch(0.6 0.08 250)' }}>
                    &quot;This one needs your expertise.&quot;
                  </span>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: 'oklch(0.18 0.03 250)', borderRight: '1px solid oklch(0.3 0.05 250 / 40%)', borderBottom: '1px solid oklch(0.3 0.05 250 / 40%)' }} />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Claim Packet (center) */}
        <motion.div
          className="absolute flex flex-col items-center z-10"
          animate={{
            x: packetWithAI ? -20 : packetWithHuman ? 80 : 0,
            y: stage === 'packet' ? 0 : packetWithHuman && stage === 'seated' ? 40 : -10,
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          <motion.div
            className="w-20 h-24 rounded-lg flex flex-col items-center justify-center gap-0.5"
            style={{
              background: 'oklch(0.16 0.03 256)',
              border: `2px solid ${packetWithHuman ? 'oklch(0.8 0.16 80 / 50%)' : 'oklch(0.55 0.15 250 / 40%)'}`,
              boxShadow: `0 4px 15px oklch(0 0 0 / 30%), 0 0 12px ${packetWithHuman ? 'oklch(0.8 0.16 80 / 15%)' : 'oklch(0.55 0.15 250 / 10%)'}`,
              transition: 'border-color 1s, box-shadow 1s',
            }}
            animate={stage === 'packet' ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 2, repeat: stage === 'packet' ? Infinity : 0 }}
          >
            <span className="text-lg">📋</span>
            <span className="text-[6px] font-mono" style={{ color: packetWithHuman ? 'oklch(0.8 0.16 80)' : 'oklch(0.55 0.15 250)' }}>
              Claim Packet
            </span>
          </motion.div>
        </motion.div>

        {/* Human figure (right side) */}
        <AnimatePresence>
          {humanVisible && (
            <motion.div
              className="absolute flex flex-col items-center gap-2"
              style={{ right: 80 }}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'oklch(0.2 0.04 80)',
                  border: '2px solid oklch(0.8 0.16 80 / 50%)',
                  boxShadow: '0 0 15px oklch(0.8 0.16 80 / 15%)',
                }}
              >
                <span className="text-2xl">👤</span>
              </div>
              <span className="text-[7px] font-mono" style={{ color: 'oklch(0.8 0.16 80)' }}>Human Reviewer</span>

              {/* Desk */}
              {stageIdx >= 7 && (
                <motion.div
                  className="w-24 h-3 rounded-t-sm mt-1"
                  style={{
                    background: 'oklch(0.25 0.04 40)',
                    boxShadow: '0 2px 6px oklch(0 0 0 / 25%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* End-state card */}
      <AnimatePresence>
        {(stage === 'card' || stage === 'done') && (
          <motion.div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-xl px-6 py-4 text-center"
            style={{
              background: 'oklch(0.15 0.025 80 / 90%)',
              border: '2px solid oklch(0.8 0.16 80 / 40%)',
              boxShadow: '0 0 25px oklch(0.8 0.16 80 / 12%)',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="text-lg mb-1">⏸️</div>
            <div className="text-xs font-bold" style={{ color: 'oklch(0.8 0.16 80)' }}>ESCALATED TO MANUAL REVIEW</div>
            <div className="mt-2 space-y-0.5 text-[8px] font-mono">
              <div><span className="text-muted-foreground">Claim:</span> <span className="text-foreground">{CLAIM_ID}</span></div>
              <div><span className="text-muted-foreground">Reason:</span> <span style={{ color: 'oklch(0.8 0.16 80)' }}>{ESCALATION_REASON}</span></div>
              <div><span className="text-muted-foreground">AI Confidence:</span> <span className="text-foreground">{G_SCORE}</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option A — Handoff to Human
      </div>
    </div>
  );
}
