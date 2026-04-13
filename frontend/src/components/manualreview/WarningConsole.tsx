"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIM_ID, G_SCORE, THRESHOLD, ESCALATION_REASON } from './manualreview-data';

interface WarningConsoleProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'flash' | 'klaxon' | 'alert' | 'reason' | 'queue' | 'reviewer' | 'calm' | 'done';

export function WarningConsole({ onComplete, autoPlay = true }: WarningConsoleProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [flashCount, setFlashCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setStage('flash'), 400));

    // Flash pulses
    const flashInterval = setInterval(() => {
      setFlashCount(p => p + 1);
    }, 300);
    t.push(setTimeout(() => clearInterval(flashInterval), 2200) as unknown as ReturnType<typeof setTimeout>);

    t.push(setTimeout(() => setStage('klaxon'), 1200));
    t.push(setTimeout(() => setStage('alert'), 2400));
    t.push(setTimeout(() => setStage('reason'), 3800));
    t.push(setTimeout(() => setStage('queue'), 5200));
    t.push(setTimeout(() => setStage('reviewer'), 6400));
    t.push(setTimeout(() => setStage('calm'), 7800));
    t.push(setTimeout(() => setStage('done'), 9000));
    t.push(setTimeout(() => onComplete?.(), 10500));

    return () => t.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const stageOrder: Stage[] = ['idle', 'flash', 'klaxon', 'alert', 'reason', 'queue', 'reviewer', 'calm', 'done'];
  const stageIdx = stageOrder.indexOf(stage);
  const isActive = stageIdx >= 1 && stageIdx <= 6;
  const isCalm = stageIdx >= 7;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Amber flash overlay */}
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'oklch(0.8 0.16 80 / 5%)' }}
          animate={{ opacity: flashCount % 2 === 0 ? 0.08 : 0 }}
          transition={{ duration: 0.15 }}
        />
      )}

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 80)' }}>
          ⚠️ Warning Console — Manual Review
        </span>
      </div>

      {/* Rotating klaxon lights */}
      {isActive && (
        <>
          <motion.div
            className="absolute top-16 left-8 w-6 h-6 rounded-full"
            style={{
              background: 'radial-gradient(circle, oklch(0.8 0.16 80), oklch(0.6 0.14 60))',
              boxShadow: '0 0 20px oklch(0.8 0.16 80 / 50%)',
            }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-16 right-8 w-6 h-6 rounded-full"
            style={{
              background: 'radial-gradient(circle, oklch(0.8 0.16 80), oklch(0.6 0.14 60))',
              boxShadow: '0 0 20px oklch(0.8 0.16 80 / 50%)',
            }}
            animate={{ opacity: [1, 0.3, 1], scale: [1.1, 0.9, 1.1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        </>
      )}

      <div className="relative flex items-start gap-6" style={{ width: 600 }}>
        {/* Alert card (center) */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <AnimatePresence>
            {stageIdx >= 3 && (
              <motion.div
                className="relative rounded-2xl px-8 py-6 text-center w-full max-w-sm"
                style={{
                  background: 'oklch(0.14 0.025 80 / 90%)',
                  border: `3px solid ${isCalm ? 'oklch(0.8 0.16 80 / 30%)' : 'oklch(0.8 0.16 80 / 60%)'}`,
                  boxShadow: isCalm ? 'none' : '0 0 30px oklch(0.8 0.16 80 / 20%)',
                }}
                initial={{ scale: 2, opacity: 0, y: -30 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  y: 0,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              >
                {/* Pulsing border glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ border: '3px solid oklch(0.8 0.16 80)' }}
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <motion.div
                  className="text-3xl mb-2"
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
                >
                  ⚠️
                </motion.div>
                <div className="text-sm font-black font-mono tracking-wide" style={{ color: 'oklch(0.8 0.16 80)' }}>
                  MANUAL REVIEW REQUIRED
                </div>

                {/* Reason text */}
                {stageIdx >= 4 && (
                  <motion.div
                    className="mt-3 text-[9px] font-mono leading-relaxed"
                    style={{ color: 'oklch(0.7 0.1 80)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {ESCALATION_REASON}
                  </motion.div>
                )}

                {/* Details */}
                {stageIdx >= 4 && (
                  <motion.div
                    className="mt-2 space-y-0.5 text-[8px] font-mono"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div><span className="text-muted-foreground">Claim:</span> <span className="text-foreground">{CLAIM_ID}</span></div>
                    <div><span className="text-muted-foreground">G Score:</span> <span style={{ color: 'oklch(0.65 0.2 15)' }}>{G_SCORE}</span> <span className="text-muted-foreground">/ {THRESHOLD}</span></div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Review Queue (right side) */}
        <AnimatePresence>
          {stageIdx >= 5 && (
            <motion.div
              className="flex flex-col items-center gap-2 shrink-0"
              style={{ width: 140 }}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              <span className="text-[7px] font-mono text-muted-foreground uppercase">📥 Review Queue</span>

              {/* Queue box */}
              <div
                className="w-full rounded-xl p-2 space-y-1.5"
                style={{
                  background: 'oklch(0.14 0.02 256)',
                  border: '1px solid oklch(0.3 0.04 80 / 40%)',
                }}
              >
                {/* Existing items in queue */}
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded" style={{
                    background: 'oklch(0.18 0.02 256)',
                    border: '1px solid oklch(0.25 0.03 256)',
                  }}>
                    <span className="text-[7px]">📋</span>
                    <span className="text-[6px] font-mono text-muted-foreground">CLM-2024-00{38 + i}</span>
                  </div>
                ))}

                {/* Our claim sliding in */}
                <motion.div
                  className="flex items-center gap-1.5 px-2 py-1 rounded"
                  style={{
                    background: 'oklch(0.8 0.16 80 / 10%)',
                    border: '1px solid oklch(0.8 0.16 80 / 30%)',
                  }}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                >
                  <span className="text-[7px]">📋</span>
                  <span className="text-[6px] font-mono font-bold" style={{ color: 'oklch(0.8 0.16 80)' }}>{CLAIM_ID}</span>
                </motion.div>
              </div>

              {/* Reviewer avatar */}
              {stageIdx >= 6 && (
                <motion.div
                  className="flex items-center gap-2 mt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center relative"
                    style={{
                      background: 'oklch(0.2 0.04 80)',
                      border: '1px solid oklch(0.8 0.16 80 / 40%)',
                    }}
                  >
                    <span className="text-sm">👤</span>
                    {/* Notification badge */}
                    <motion.div
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{
                        background: 'oklch(0.65 0.2 15)',
                        border: '1px solid oklch(0.65 0.2 15 / 50%)',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <span className="text-[6px] font-bold text-white">+1</span>
                    </motion.div>
                  </div>
                  <span className="text-[7px] font-mono" style={{ color: 'oklch(0.8 0.16 80)' }}>Reviewer assigned</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option B — Warning / Alert Console
      </div>
    </div>
  );
}
