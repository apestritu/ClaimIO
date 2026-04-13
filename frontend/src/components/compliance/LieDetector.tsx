"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIMANT_NAME, RECEIPT_AMOUNTS, COMPLIANCE_RESULT } from './compliance-data';

interface LieDetectorProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Phase = 'idle' | 'connecting' | 'sanctions' | 'fraud' | 'printing' | 'done';

export function LieDetector({ onComplete, autoPlay = true }: LieDetectorProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sanctionWavePoints, setSanctionWavePoints] = useState<number[]>([]);
  const [fraudWavePoints, setFraudWavePoints] = useState<number[]>([]);
  const [sanctionResult, setSanctionResult] = useState<'clear' | 'alert' | null>(null);
  const [fraudResult, setFraudResult] = useState<'clear' | 'alert' | null>(null);
  const [showTape, setShowTape] = useState(false);
  const startedRef = useRef(false);
  const sanctionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fraudIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Connect
    timers.push(setTimeout(() => setPhase('connecting'), 300));

    // Phase 2: Sanctions waveform
    timers.push(setTimeout(() => {
      setPhase('sanctions');

      sanctionIntervalRef.current = setInterval(() => {
        setSanctionWavePoints(prev => {
          // Flat green line with minor noise (no deception)
          const noise = (Math.random() - 0.5) * 6;
          const newPoint = 50 + noise;
          return [...prev.slice(-80), newPoint];
        });
      }, 50);
    }, 1200));

    // Sanctions result
    timers.push(setTimeout(() => {
      if (sanctionIntervalRef.current) clearInterval(sanctionIntervalRef.current);
      setSanctionResult(COMPLIANCE_RESULT.sanctionsClear ? 'clear' : 'alert');
    }, 3500));

    // Phase 3: Fraud waveform
    timers.push(setTimeout(() => {
      setPhase('fraud');

      fraudIntervalRef.current = setInterval(() => {
        setFraudWavePoints(prev => {
          // Low flat line — no duplicates
          const noise = (Math.random() - 0.5) * 8;
          const newPoint = 50 + noise;
          return [...prev.slice(-80), newPoint];
        });
      }, 50);
    }, 4000));

    // Fraud result
    timers.push(setTimeout(() => {
      if (fraudIntervalRef.current) clearInterval(fraudIntervalRef.current);
      setFraudResult(COMPLIANCE_RESULT.hasDuplicates ? 'alert' : 'clear');
    }, 6200));

    // Phase 4: Print tape
    timers.push(setTimeout(() => {
      setPhase('printing');
      setShowTape(true);
    }, 7000));

    timers.push(setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 9000));

    return () => {
      timers.forEach(clearTimeout);
      if (sanctionIntervalRef.current) clearInterval(sanctionIntervalRef.current);
      if (fraudIntervalRef.current) clearInterval(fraudIntervalRef.current);
    };
  }, [autoPlay, onComplete]);

  // Build SVG path from wave points
  const buildWavePath = (points: number[], width: number, height: number) => {
    if (points.length < 2) return '';
    const stepX = width / 80;
    return points
      .map((y, i) => {
        const x = i * stepX;
        const scaledY = (y / 100) * height;
        return i === 0 ? `M ${x} ${scaledY}` : `L ${x} ${scaledY}`;
      })
      .join(' ');
  };

  const sanctionPath = useMemo(() => buildWavePath(sanctionWavePoints, 400, 60), [sanctionWavePoints]);
  const fraudPath = useMemo(() => buildWavePath(fraudWavePoints, 400, 60), [fraudWavePoints]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden gap-5">
      {/* Title */}
      <motion.div
        className="text-[10px] font-mono uppercase tracking-[0.2em]"
        style={{ color: 'oklch(0.6 0.1 250)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        📊 Polygraph — Compliance Analysis
      </motion.div>

      {/* Machine body */}
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          width: 560,
          background: 'oklch(0.12 0.02 256)',
          border: '2px solid oklch(0.25 0.04 256)',
          boxShadow: '0 8px 40px oklch(0 0 0 / 50%)',
        }}
      >
        {/* Machine header */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ background: 'oklch(0.15 0.025 256)', borderBottom: '1px solid oklch(0.25 0.04 256)' }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(0.65 0.2 15)' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(0.8 0.16 80)' }} />
              <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(0.7 0.17 160)' }} />
            </div>
            <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.06 250)' }}>
              POLYCHECK™ v4.1
            </span>
          </div>
          <div className="flex items-center gap-2">
            {phase !== 'idle' && (
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: phase === 'done' ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)' }}
                animate={phase !== 'done' ? { opacity: [1, 0.2, 1] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
            <span className="text-[7px] font-mono" style={{ color: 'oklch(0.5 0.06 250)' }}>
              {phase === 'idle' ? 'STANDBY' : phase === 'done' ? 'COMPLETE' : 'RECORDING'}
            </span>
          </div>
        </div>

        {/* Subject connected */}
        <div className="px-4 py-2 flex items-center gap-3" style={{ borderBottom: '1px solid oklch(0.2 0.03 256)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs">👤</span>
            <span className="text-[9px] font-mono font-bold text-foreground">{CLAIMANT_NAME}</span>
          </div>
          {phase !== 'idle' && (
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, oklch(0.5 0.08 250), oklch(0.3 0.04 256))' }} />
              <span className="text-[7px] font-mono" style={{ color: 'oklch(0.5 0.08 250)' }}>CONNECTED</span>
            </motion.div>
          )}
          <div className="flex-1" />
          {/* Receipt amounts fed in */}
          <div className="flex gap-1">
            {RECEIPT_AMOUNTS.map((amt, i) => (
              <div
                key={i}
                className="px-1.5 py-0.5 rounded text-[6px] font-mono"
                style={{
                  background: 'oklch(0.18 0.02 256)',
                  border: '1px solid oklch(0.25 0.03 256)',
                  color: 'oklch(0.5 0.04 256)',
                }}
              >
                {amt}
              </div>
            ))}
          </div>
        </div>

        {/* Channel 1: Sanctions waveform */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid oklch(0.2 0.03 256)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[7px] font-mono uppercase" style={{ color: 'oklch(0.5 0.06 250)' }}>
              CH1 — Sanctions Screening
            </span>
            {sanctionResult && (
              <motion.span
                className="text-[7px] font-mono font-bold"
                style={{ color: sanctionResult === 'clear' ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {sanctionResult === 'clear' ? '✅ NO DECEPTION' : '🚨 ALERT'}
              </motion.span>
            )}
          </div>
          <div
            className="relative rounded-md overflow-hidden"
            style={{
              height: 60,
              background: 'oklch(0.08 0.015 256)',
              border: '1px solid oklch(0.2 0.03 256)',
            }}
          >
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={i} x1={0} y1={i * 15} x2="100%" y2={i * 15} stroke="oklch(0.5 0.06 250)" strokeWidth={0.5} />
              ))}
            </svg>

            {/* Waveform */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
              {sanctionPath && (
                <motion.path
                  d={sanctionPath}
                  fill="none"
                  stroke={sanctionResult === 'clear' ? 'oklch(0.7 0.17 160)' : sanctionResult === 'alert' ? 'oklch(0.65 0.2 15)' : 'oklch(0.7 0.17 160)'}
                  strokeWidth={1.5}
                  filter={`drop-shadow(0 0 4px ${sanctionResult === 'alert' ? 'oklch(0.65 0.2 15)' : 'oklch(0.7 0.17 160 / 50%)'})`}
                />
              )}
            </svg>

            {/* Steady beep indicator */}
            {(phase === 'sanctions' || sanctionResult) && (
              <motion.div
                className="absolute right-2 top-2 w-2 h-2 rounded-full"
                style={{ background: sanctionResult === 'clear' ? 'oklch(0.7 0.17 160)' : 'oklch(0.7 0.17 160)' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
        </div>

        {/* Channel 2: Fraud waveform */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid oklch(0.2 0.03 256)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[7px] font-mono uppercase" style={{ color: 'oklch(0.5 0.06 250)' }}>
              CH2 — Fraud Analysis
            </span>
            {fraudResult && (
              <motion.span
                className="text-[7px] font-mono font-bold"
                style={{ color: fraudResult === 'clear' ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {fraudResult === 'clear' ? '✅ STABLE — LOW RISK' : '🚨 SPIKES DETECTED'}
              </motion.span>
            )}
          </div>
          <div
            className="relative rounded-md overflow-hidden"
            style={{
              height: 60,
              background: 'oklch(0.08 0.015 256)',
              border: '1px solid oklch(0.2 0.03 256)',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={i} x1={0} y1={i * 15} x2="100%" y2={i * 15} stroke="oklch(0.5 0.06 250)" strokeWidth={0.5} />
              ))}
            </svg>

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
              {fraudPath && (
                <motion.path
                  d={fraudPath}
                  fill="none"
                  stroke={fraudResult === 'clear' ? 'oklch(0.7 0.15 195)' : fraudResult === 'alert' ? 'oklch(0.65 0.2 15)' : 'oklch(0.7 0.15 195)'}
                  strokeWidth={1.5}
                  filter={`drop-shadow(0 0 4px ${fraudResult === 'alert' ? 'oklch(0.65 0.2 15)' : 'oklch(0.7 0.15 195 / 50%)'})`}
                />
              )}
            </svg>

            {(phase === 'fraud' || fraudResult) && (
              <motion.div
                className="absolute right-2 top-2 w-2 h-2 rounded-full"
                style={{ background: 'oklch(0.7 0.15 195)' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </div>
        </div>

        {/* Printer slot */}
        <div className="px-4 py-2 flex items-center justify-center">
          {!showTape && (
            <div className="text-[7px] font-mono text-muted-foreground/40">
              {phase === 'idle' ? 'Ready' : 'Analyzing...'}
            </div>
          )}
        </div>
      </motion.div>

      {/* Printed results tape */}
      <AnimatePresence>
        {showTape && (
          <motion.div
            className="flex items-center gap-5 px-6 py-3 rounded-xl"
            style={{
              background: 'oklch(0.95 0.01 80)',
              border: '1px solid oklch(0.85 0.02 80)',
              boxShadow: '0 4px 20px oklch(0 0 0 / 20%)',
            }}
            initial={{ opacity: 0, y: -10, scaleY: 0 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          >
            <div className="flex flex-col gap-0.5">
              <div className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.3 0.05 256)' }}>
                ═══ POLYCHECK RESULTS ═══
              </div>
              <div className="text-[8px] font-mono" style={{ color: 'oklch(0.35 0.04 256)' }}>
                Sanctions: <span className="font-bold" style={{ color: 'oklch(0.35 0.15 160)' }}>CLEAR ({COMPLIANCE_RESULT.sanctionsConf})</span>
              </div>
              <div className="text-[8px] font-mono" style={{ color: 'oklch(0.35 0.04 256)' }}>
                Fraud Risk: <span className="font-bold" style={{ color: 'oklch(0.35 0.15 160)' }}>{COMPLIANCE_RESULT.fraudRisk.toFixed(2)} ({COMPLIANCE_RESULT.fraudLabel})</span>
              </div>
              <div className="text-[7px] font-mono mt-0.5" style={{ color: 'oklch(0.5 0.03 256)' }}>
                ─────────────────────────
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option D — Lie Detector / Polygraph
      </div>
    </div>
  );
}
