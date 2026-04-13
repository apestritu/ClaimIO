"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COVERAGE_RESULT } from './coverage-data';

interface LockAndKeyProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

const RINGS = [
  { label: 'Policy Match', detail: '03/15 within 01/01–12/31', icon: '📋', pass: true },
  { label: 'Trip Match', detail: '03/15 within 03/12–03/20', icon: '✈️', pass: true },
  { label: 'Delay Threshold', detail: '48h ≥ 24h minimum', icon: '🧳', pass: true },
  { label: 'Financial Limits', detail: '$487.30 ≤ $2,000', icon: '💰', pass: true },
];

type RingState = 'idle' | 'searching' | 'locked' | 'failed';

export function LockAndKey({ onComplete, autoPlay = true }: LockAndKeyProps) {
  const [ringStates, setRingStates] = useState<RingState[]>(RINGS.map(() => 'idle'));
  const [activeRing, setActiveRing] = useState(-1);
  const [verifyPulse, setVerifyPulse] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [confValue, setConfValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    RINGS.forEach((ring, i) => {
      const start = 800 + i * 2200;

      // Start searching
      timers.push(setTimeout(() => {
        setActiveRing(i);
        setRingStates(prev => {
          const next = [...prev];
          next[i] = 'searching';
          return next;
        });
      }, start));

      // Lock into place (or fail)
      timers.push(setTimeout(() => {
        setRingStates(prev => {
          const next = [...prev];
          next[i] = ring.pass ? 'locked' : 'failed';
          return next;
        });
      }, start + 1500));
    });

    // Final verification pulse
    const totalTime = 800 + RINGS.length * 2200 + 500;
    timers.push(setTimeout(() => {
      setActiveRing(-1);
      setVerifyPulse(true);
    }, totalTime));

    // Lock opens
    timers.push(setTimeout(() => {
      setVerifyPulse(false);
      setLockOpen(true);
    }, totalTime + 1200));

    // Show result behind lock
    timers.push(setTimeout(() => setShowResult(true), totalTime + 2000));
    timers.push(setTimeout(() => setConfValue(COVERAGE_RESULT.confidence), totalTime + 2500));
    timers.push(setTimeout(() => onComplete?.(), totalTime + 4500));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const allLocked = ringStates.every(s => s === 'locked');

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Lock assembly */}
      <div className="flex flex-col items-center gap-6">
        {/* Title */}
        <motion.div
          className="text-[10px] font-mono uppercase tracking-[0.2em]"
          style={{ color: 'oklch(0.6 0.1 250)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          🔐 Coverage Verification Lock
        </motion.div>

        {/* Lock body */}
        <div className="relative flex flex-col items-center">
          {/* Shackle (top arc) */}
          <motion.div
            className="relative"
            style={{ width: 120, height: 60, marginBottom: -10 }}
            animate={lockOpen ? { y: -15, rotate: -15 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 12 }}
          >
            <div
              className="absolute bottom-0 left-[20px] right-[20px] h-[50px] rounded-t-full"
              style={{
                border: '6px solid oklch(0.4 0.06 250)',
                borderBottom: 'none',
                boxShadow: '0 -2px 15px oklch(0 0 0 / 20%)',
              }}
            />
          </motion.div>

          {/* Lock body rectangle */}
          <motion.div
            className="relative rounded-2xl flex flex-col items-center overflow-hidden"
            style={{
              width: 300,
              background: 'oklch(0.14 0.025 250)',
              border: '2px solid oklch(0.3 0.05 250 / 50%)',
              boxShadow: '0 8px 40px oklch(0 0 0 / 50%), inset 0 0 30px oklch(0 0 0 / 20%)',
            }}
            animate={verifyPulse ? {
              boxShadow: [
                '0 8px 40px oklch(0 0 0 / 50%)',
                '0 0 40px oklch(0.7 0.17 160 / 30%)',
                '0 8px 40px oklch(0 0 0 / 50%)',
              ],
            } : {}}
            transition={{ duration: 0.8, repeat: verifyPulse ? 1 : 0 }}
          >
            {/* Rings / combination dials */}
            <div className="px-6 py-5 space-y-3 w-full">
              {RINGS.map((ring, i) => {
                const state = ringStates[i];
                const isActive = activeRing === i;

                const bgColor = state === 'locked'
                  ? 'oklch(0.7 0.17 160 / 12%)'
                  : state === 'failed'
                    ? 'oklch(0.65 0.2 15 / 12%)'
                    : state === 'searching'
                      ? 'oklch(0.8 0.16 80 / 8%)'
                      : 'oklch(0.18 0.02 256)';

                const borderColor = state === 'locked'
                  ? 'oklch(0.7 0.17 160 / 40%)'
                  : state === 'failed'
                    ? 'oklch(0.65 0.2 15 / 40%)'
                    : state === 'searching'
                      ? 'oklch(0.8 0.16 80 / 40%)'
                      : 'oklch(0.25 0.03 256)';

                const textColor = state === 'locked'
                  ? 'oklch(0.7 0.17 160)'
                  : state === 'failed'
                    ? 'oklch(0.65 0.2 15)'
                    : state === 'searching'
                      ? 'oklch(0.8 0.16 80)'
                      : 'oklch(0.5 0.03 256)';

                return (
                  <motion.div
                    key={i}
                    className="relative flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: bgColor,
                      border: `1px solid ${borderColor}`,
                    }}
                    animate={state === 'searching' ? {
                      x: [0, -2, 2, -1, 1, 0],
                    } : state === 'locked' ? {
                      scale: [1, 1.02, 1],
                    } : state === 'failed' ? {
                      x: [0, -5, 5, -5, 5, 0],
                    } : {}}
                    transition={state === 'searching' ? {
                      duration: 0.3,
                      repeat: Infinity,
                    } : {
                      duration: 0.3,
                    }}
                  >
                    {/* Ring number */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{
                        background: state === 'locked'
                          ? 'oklch(0.7 0.17 160 / 25%)'
                          : state === 'failed'
                            ? 'oklch(0.65 0.2 15 / 25%)'
                            : 'oklch(0.2 0.03 256)',
                        color: textColor,
                        border: `2px solid ${borderColor}`,
                        boxShadow: state === 'locked'
                          ? '0 0 10px oklch(0.7 0.17 160 / 20%)'
                          : 'none',
                      }}
                    >
                      {state === 'locked' ? '✅' : state === 'failed' ? '❌' : state === 'searching' ? '🔄' : ring.icon}
                    </div>

                    {/* Ring info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold" style={{ color: textColor }}>
                        Ring {i + 1}: {ring.label}
                      </div>
                      <div className="text-[8px] font-mono text-muted-foreground">
                        {ring.detail}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                      {state === 'searching' && (
                        <motion.div
                          className="text-[8px] font-mono"
                          style={{ color: 'oklch(0.8 0.16 80)' }}
                          animate={{ opacity: [1, 0.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        >
                          Checking...
                        </motion.div>
                      )}
                      {state === 'locked' && (
                        <motion.div
                          className="text-[8px] font-mono font-bold"
                          style={{ color: 'oklch(0.7 0.17 160)' }}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          LOCKED ✓
                        </motion.div>
                      )}
                      {state === 'failed' && (
                        <motion.div
                          className="text-[8px] font-mono font-bold"
                          style={{ color: 'oklch(0.65 0.2 15)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          JAMMED ✗
                        </motion.div>
                      )}
                      {state === 'idle' && (
                        <div className="text-[8px] font-mono text-muted-foreground/40">Waiting</div>
                      )}
                    </div>

                    {/* Active scanning line */}
                    {state === 'searching' && (
                      <motion.div
                        className="absolute left-0 right-0 h-[1px]"
                        style={{ background: 'oklch(0.8 0.16 80)' }}
                        animate={{ top: ['20%', '80%'] }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Keyhole / status */}
            <div className="pb-4 flex flex-col items-center gap-1">
              <motion.div
                className="w-4 h-6 rounded-full"
                style={{
                  background: lockOpen
                    ? 'oklch(0.7 0.17 160 / 50%)'
                    : allLocked
                      ? 'oklch(0.8 0.16 80 / 40%)'
                      : 'oklch(0.3 0.04 256)',
                  boxShadow: lockOpen
                    ? '0 0 15px oklch(0.7 0.17 160 / 40%)'
                    : 'none',
                }}
                animate={verifyPulse ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.4, repeat: verifyPulse ? 2 : 0 }}
              />
              <span className="text-[7px] font-mono" style={{ color: lockOpen ? 'oklch(0.7 0.17 160)' : 'oklch(0.4 0.03 256)' }}>
                {lockOpen ? '🔓 UNLOCKED' : allLocked ? '🔑 Verifying...' : `${ringStates.filter(s => s === 'locked').length}/${RINGS.length} rings`}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Result card behind the lock */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              className="rounded-2xl p-5 w-72"
              style={{
                background: 'oklch(0.14 0.02 256 / 95%)',
                border: '1px solid oklch(0.7 0.17 160 / 30%)',
                boxShadow: '0 0 40px oklch(0.7 0.17 160 / 15%), 0 8px 30px oklch(0 0 0 / 40%)',
              }}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 150, damping: 15 }}
            >
              <div className="text-center mb-3">
                <motion.div className="text-2xl mb-1" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.2 }}>
                  ✅
                </motion.div>
                <div className="text-[10px] font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>VAULT OPENED — APPROVED</div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-2 py-1 rounded-lg" style={{ background: 'oklch(0.2 0.02 256)' }}>
                  <span className="text-[8px] font-mono text-muted-foreground">Amount</span>
                  <span className="text-xs font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>{COVERAGE_RESULT.amount}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 rounded-lg" style={{ background: 'oklch(0.2 0.02 256)' }}>
                  <span className="text-[8px] font-mono text-muted-foreground">Confidence</span>
                  <span className="text-xs font-bold" style={{ color: 'oklch(0.7 0.15 195)' }}>{COVERAGE_RESULT.confidence}</span>
                </div>
              </div>

              {/* Mini confidence gauge */}
              <div className="flex justify-center mt-3">
                <div className="relative w-24 h-12 overflow-hidden">
                  <svg viewBox="0 0 120 65" className="w-full h-full">
                    <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="oklch(0.3 0.02 256)" strokeWidth="8" strokeLinecap="round" />
                    <motion.path
                      d="M 10 58 A 50 50 0 0 1 110 58"
                      fill="none" stroke="oklch(0.7 0.17 160)" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray="157"
                      initial={{ strokeDashoffset: 157 }}
                      animate={{ strokeDashoffset: 157 * (1 - confValue) }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option F — Lock & Key / Vault
      </div>
    </div>
  );
}
