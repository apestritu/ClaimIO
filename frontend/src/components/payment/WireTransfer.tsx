"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PAYMENT_AMOUNT, ACCOUNT_DISPLAY } from './payment-data';

interface WireTransferProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'disconnected' | 'requesting' | 'connected' | 'flowing' | 'complete';

export function WireTransfer({ onComplete, autoPlay = true }: WireTransferProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [counter, setCounter] = useState(0);
  const [particles, setParticles] = useState<number[]>([]);
  const [showBadge, setShowBadge] = useState(false);
  const startedRef = useRef(false);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setStage('disconnected'), 300));
    timers.push(setTimeout(() => setStage('requesting'), 1200));
    timers.push(setTimeout(() => setStage('connected'), 3000));

    // Start flowing
    timers.push(setTimeout(() => {
      setStage('flowing');

      // Spawn particles
      let pId = 0;
      const particleInterval = setInterval(() => {
        setParticles(prev => [...prev.slice(-12), pId++]);
      }, 200);
      timers.push(setTimeout(() => clearInterval(particleInterval), 4500) as unknown as ReturnType<typeof setTimeout>);

      // Counter ticking up
      const target = 487.30;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      counterRef.current = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          if (counterRef.current) clearInterval(counterRef.current);
        }
        setCounter(current);
      }, 70);
    }, 3800));

    // Complete
    timers.push(setTimeout(() => {
      if (counterRef.current) clearInterval(counterRef.current);
      setCounter(487.30);
      setStage('complete');
      setShowBadge(true);
    }, 8200));

    timers.push(setTimeout(() => onComplete?.(), 10500));

    return () => {
      timers.forEach(clearTimeout);
      if (counterRef.current) clearInterval(counterRef.current);
    };
  }, [autoPlay, onComplete]);

  const pipelineActive = stage === 'connected' || stage === 'flowing' || stage === 'complete';
  const pipelineColor = stage === 'complete' ? 'oklch(0.7 0.17 160)' : pipelineActive ? 'oklch(0.55 0.15 250)' : 'oklch(0.25 0.03 256)';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          💸 Wire Transfer — Money Pipeline
        </span>
      </div>

      <div className="relative flex items-center gap-0" style={{ width: 650 }}>
        {/* LEFT ENDPOINT — Insurance Company */}
        <motion.div
          className="relative flex flex-col items-center gap-2 shrink-0"
          style={{ width: 160 }}
        >
          <div
            className="w-24 h-28 rounded-xl flex flex-col items-center justify-center gap-1"
            style={{
              background: 'oklch(0.14 0.025 256)',
              border: `2px solid ${stage === 'complete' ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.3 0.05 250 / 40%)'}`,
              boxShadow: stage === 'complete' ? '0 0 20px oklch(0.7 0.17 160 / 15%)' : '0 4px 20px oklch(0 0 0 / 30%)',
            }}
          >
            <span className="text-2xl">🏢</span>
            <span className="text-[7px] font-mono text-muted-foreground">Insurance Co.</span>
            {/* Vault inside */}
            <div className="px-2 py-1 rounded-md mt-1" style={{
              background: 'oklch(0.18 0.03 250)',
              border: '1px solid oklch(0.3 0.04 250)',
            }}>
              <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.7 0.15 195)' }}>{PAYMENT_AMOUNT}</span>
            </div>
          </div>

          {stage === 'complete' && (
            <motion.div
              className="text-[8px] font-mono font-bold"
              style={{ color: 'oklch(0.7 0.17 160)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Sent ✅
            </motion.div>
          )}
        </motion.div>

        {/* PIPELINE */}
        <div className="flex-1 relative" style={{ height: 60 }}>
          {/* Pipe body */}
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full overflow-hidden"
            style={{
              height: 16,
              background: 'oklch(0.12 0.02 256)',
              border: `2px solid ${pipelineColor}40`,
              boxShadow: pipelineActive ? `0 0 15px ${pipelineColor}15` : 'none',
            }}
          >
            {/* Inner liquid */}
            {(stage === 'flowing' || stage === 'complete') && (
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: stage === 'complete'
                    ? 'oklch(0.7 0.17 160 / 30%)'
                    : 'linear-gradient(90deg, oklch(0.7 0.17 160 / 25%), oklch(0.55 0.15 250 / 15%))',
                }}
                initial={{ width: '0%' }}
                animate={{ width: stage === 'complete' ? '100%' : `${Math.min(counter / 487.30 * 100, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            )}
          </div>

          {/* Money particles flowing through */}
          {stage === 'flowing' && particles.map((id) => (
            <motion.div
              key={id}
              className="absolute top-1/2 -translate-y-1/2 text-[8px] font-bold"
              style={{ color: 'oklch(0.7 0.17 160)' }}
              initial={{ left: '0%', opacity: 0.8 }}
              animate={{ left: '100%', opacity: 0 }}
              transition={{ duration: 2, ease: 'linear' }}
            >
              💵
            </motion.div>
          ))}

          {/* Envelope (requesting phase) */}
          <AnimatePresence>
            {stage === 'requesting' && (
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 text-lg"
                initial={{ left: '5%', opacity: 1 }}
                animate={{ left: '85%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              >
                ✉️
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection status badge */}
          {showBadge && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full"
              style={{
                background: 'oklch(0.7 0.17 160 / 15%)',
                border: '1px solid oklch(0.7 0.17 160 / 40%)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>Transfer Complete ✅</span>
            </motion.div>
          )}

          {/* Disconnected indicator */}
          {stage === 'disconnected' && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <span className="text-[8px] font-mono" style={{ color: 'oklch(0.65 0.2 15)' }}>✗ Not Connected</span>
            </motion.div>
          )}
        </div>

        {/* RIGHT ENDPOINT — Claimant */}
        <motion.div
          className="relative flex flex-col items-center gap-2 shrink-0"
          style={{ width: 160 }}
        >
          <div
            className="w-24 h-28 rounded-xl flex flex-col items-center justify-center gap-1"
            style={{
              background: 'oklch(0.14 0.025 256)',
              border: `2px solid ${stage === 'complete' ? 'oklch(0.7 0.17 160 / 50%)' : pipelineActive ? 'oklch(0.55 0.15 250 / 40%)' : 'oklch(0.25 0.03 256)'}`,
              boxShadow: stage === 'complete' ? '0 0 20px oklch(0.7 0.17 160 / 15%)' : '0 4px 20px oklch(0 0 0 / 30%)',
              opacity: stage === 'disconnected' || stage === 'requesting' ? 0.5 : 1,
            }}
          >
            <span className="text-2xl">👤</span>
            <span className="text-[7px] font-mono text-muted-foreground">Claimant</span>

            {/* Account info or ? */}
            <div className="px-2 py-1 rounded-md mt-1" style={{
              background: pipelineActive ? 'oklch(0.18 0.03 160)' : 'oklch(0.18 0.02 256)',
              border: `1px solid ${pipelineActive ? 'oklch(0.3 0.05 160)' : 'oklch(0.25 0.03 256)'}`,
            }}>
              {pipelineActive ? (
                <span className="text-[7px] font-mono" style={{ color: 'oklch(0.6 0.1 160)' }}>🏦 ACH {ACCOUNT_DISPLAY}</span>
              ) : (
                <motion.span
                  className="text-[8px] font-mono"
                  style={{ color: 'oklch(0.8 0.16 80)' }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ?
                </motion.span>
              )}
            </div>
          </div>

          {/* Counter */}
          {(stage === 'flowing' || stage === 'complete') && (
            <motion.div
              className="text-sm font-bold font-mono"
              style={{ color: stage === 'complete' ? 'oklch(0.7 0.17 160)' : 'oklch(0.7 0.15 195)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ${counter.toFixed(2)}
            </motion.div>
          )}

          {stage === 'complete' && (
            <motion.div
              className="text-[8px] font-mono font-bold"
              style={{ color: 'oklch(0.7 0.17 160)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Received ✅
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option B — Wire Transfer / Money Pipeline
      </div>
    </div>
  );
}
