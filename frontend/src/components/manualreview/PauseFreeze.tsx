"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIM_ID, G_SCORE, ESCALATION_REASON } from './manualreview-data';

interface PauseFreezeProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'running' | 'freeze' | 'banner' | 'reason' | 'grab' | 'fadeout' | 'card' | 'done';

export function PauseFreeze({ onComplete, autoPlay = true }: PauseFreezeProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setStage('running'), 400));
    t.push(setTimeout(() => setStage('freeze'), 2200));
    t.push(setTimeout(() => setStage('banner'), 3200));
    t.push(setTimeout(() => setStage('reason'), 4400));
    t.push(setTimeout(() => setStage('grab'), 5600));
    t.push(setTimeout(() => setStage('fadeout'), 7000));
    t.push(setTimeout(() => setStage('card'), 8200));
    t.push(setTimeout(() => setStage('done'), 9500));
    t.push(setTimeout(() => onComplete?.(), 11000));

    return () => t.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const stageOrder: Stage[] = ['idle', 'running', 'freeze', 'banner', 'reason', 'grab', 'fadeout', 'card', 'done'];
  const stageIdx = stageOrder.indexOf(stage);
  const isFrozen = stageIdx >= 2 && stageIdx <= 5;
  const showVHS = stageIdx >= 2 && stageIdx <= 5;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 80)' }}>
          ⏸️ Pause / Freeze Frame — Manual Review
        </span>
      </div>

      {/* Frozen desaturation overlay */}
      {isFrozen && (
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: 'oklch(0.2 0.06 250 / 30%)', mixBlendMode: 'multiply' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* VHS PAUSED label */}
      {showVHS && (
        <motion.div
          className="absolute top-16 right-8 z-20 px-3 py-1 rounded"
          style={{
            background: 'oklch(0 0 0 / 60%)',
            border: '1px solid oklch(0.5 0.05 0 / 40%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="text-[10px] font-mono font-bold" style={{ color: 'oklch(0.9 0.02 0)' }}>⏸ PAUSED</span>
        </motion.div>
      )}

      {/* CRT scanlines when frozen */}
      {isFrozen && (
        <div className="absolute inset-0 z-10 pointer-events-none" style={{
          background: 'repeating-linear-gradient(0deg, oklch(0 0 0 / 4%) 0px, transparent 1px, transparent 3px)',
        }} />
      )}

      {/* Simulated pipeline scene (frozen mid-flow) */}
      <div className="relative" style={{ width: 550, height: 250 }}>
        {/* Fake pipeline steps */}
        <div className="flex items-center gap-3 px-4">
          {['Upload', 'Ingest', 'Validate', 'Evaluate', 'Decision'].map((step, i) => {
            const isComplete = i < 4;
            const isCurrent = i === 4;
            return (
              <div key={step} className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: isComplete ? 'oklch(0.7 0.17 160 / 15%)' : isCurrent ? 'oklch(0.8 0.16 80 / 15%)' : 'oklch(0.18 0.02 256)',
                    border: `2px solid ${isComplete ? 'oklch(0.7 0.17 160 / 40%)' : isCurrent ? 'oklch(0.8 0.16 80 / 40%)' : 'oklch(0.25 0.03 256)'}`,
                  }}
                  animate={isCurrent && stage === 'running' ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 1, repeat: stage === 'running' ? Infinity : 0 }}
                >
                  <span className="text-[8px] font-mono font-bold" style={{
                    color: isComplete ? 'oklch(0.7 0.17 160)' : isCurrent ? 'oklch(0.8 0.16 80)' : 'oklch(0.4 0.03 256)',
                  }}>
                    {isComplete ? '✓' : isCurrent ? '...' : (i + 1)}
                  </span>
                </motion.div>
                {i < 4 && <div className="w-6 h-0.5 rounded" style={{ background: isComplete ? 'oklch(0.7 0.17 160 / 30%)' : 'oklch(0.25 0.03 256)' }} />}
              </div>
            );
          })}
        </div>

        {/* Claim packet floating in scene */}
        <motion.div
          className="absolute flex flex-col items-center"
          style={{ left: '50%', top: 80, transform: 'translateX(-50%)', zIndex: 5 }}
          animate={
            stage === 'grab' ? { x: 200, y: -50, opacity: 0, scale: 0.5 } :
            stage === 'running' ? { y: [0, -5, 0] } : {}
          }
          transition={
            stage === 'grab' ? { duration: 0.8, ease: 'easeIn' } :
            { duration: 2, repeat: Infinity }
          }
        >
          <div
            className="w-24 h-28 rounded-xl flex flex-col items-center justify-center gap-1"
            style={{
              background: 'oklch(0.16 0.03 256)',
              border: '2px solid oklch(0.55 0.15 250 / 40%)',
              boxShadow: '0 4px 15px oklch(0 0 0 / 30%)',
            }}
          >
            <span className="text-xl">📋</span>
            <span className="text-[7px] font-mono" style={{ color: 'oklch(0.55 0.15 250)' }}>Claim Packet</span>
            <span className="text-[6px] font-mono text-muted-foreground">{CLAIM_ID}</span>
          </div>
        </motion.div>

        {/* Hand reaching in to grab */}
        <AnimatePresence>
          {stage === 'grab' && (
            <motion.div
              className="absolute text-3xl"
              style={{ right: -40, top: 60, zIndex: 15 }}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: -20, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 12 }}
            >
              🤚
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing particles (during running) */}
        {stage === 'running' && Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: 'oklch(0.55 0.15 250 / 40%)',
              left: 200 + i * 30,
              top: 110,
            }}
            animate={{ y: [0, -15, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      {/* NEEDS HUMAN REVIEW banner */}
      <AnimatePresence>
        {(stageIdx >= 3 && stageIdx <= 5) && (
          <motion.div
            className="absolute left-0 right-0 z-20 flex items-center justify-center py-3"
            style={{
              top: '40%',
              background: 'oklch(0.8 0.16 80 / 12%)',
              borderTop: '2px solid oklch(0.8 0.16 80 / 40%)',
              borderBottom: '2px solid oklch(0.8 0.16 80 / 40%)',
              backdropFilter: 'blur(4px)',
            }}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="text-center">
              <div className="text-sm font-black font-mono tracking-wider" style={{ color: 'oklch(0.8 0.16 80)' }}>
                ⚠️ NEEDS HUMAN REVIEW
              </div>

              {stageIdx >= 4 && (
                <motion.div
                  className="text-[8px] font-mono mt-1"
                  style={{ color: 'oklch(0.7 0.1 80)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {ESCALATION_REASON}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End-state card */}
      <AnimatePresence>
        {(stage === 'card' || stage === 'done') && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ background: 'oklch(0.14 0.02 256 / 90%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="rounded-2xl px-8 py-6 text-center"
              style={{
                background: 'oklch(0.15 0.025 80 / 95%)',
                border: '2px solid oklch(0.8 0.16 80 / 40%)',
                boxShadow: '0 0 30px oklch(0.8 0.16 80 / 12%)',
              }}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="text-2xl mb-2">⏸️</div>
              <div className="text-sm font-bold" style={{ color: 'oklch(0.8 0.16 80)' }}>ESCALATED TO MANUAL REVIEW</div>
              <div className="mt-3 space-y-0.5 text-[8px] font-mono">
                <div><span className="text-muted-foreground">Claim:</span> <span className="text-foreground">{CLAIM_ID}</span></div>
                <div><span className="text-muted-foreground">Reason:</span> <span style={{ color: 'oklch(0.8 0.16 80)' }}>{ESCALATION_REASON}</span></div>
                <div><span className="text-muted-foreground">AI Confidence:</span> <span className="text-foreground">{G_SCORE}</span></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40 z-20">
        Option C — Pause / Freeze Frame
      </div>
    </div>
  );
}
