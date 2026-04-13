"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIMANT_NAME, RECEIPT_AMOUNTS, COMPLIANCE_RESULT } from './compliance-data';

interface ForensicLabProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type ScanPhase = 'idle' | 'biometric' | 'searching' | 'result';
type FraudPhase = 'idle' | 'layout' | 'uv' | 'scoring' | 'result';

export function ForensicLab({ onComplete, autoPlay = true }: ForensicLabProps) {
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [fraudPhase, setFraudPhase] = useState<FraudPhase>('idle');
  const [dbSearchProgress, setDbSearchProgress] = useState(0);
  const [uvSweepPos, setUvSweepPos] = useState(0);
  const [highlightedAmounts, setHighlightedAmounts] = useState<number[]>([]);
  const [fraudScore, setFraudScore] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // LEFT STATION: Sanctions biometric scan
    timers.push(setTimeout(() => setScanPhase('biometric'), 400));
    timers.push(setTimeout(() => setScanPhase('searching'), 1800));

    // DB search progress
    const dbInterval = setInterval(() => {
      setDbSearchProgress(prev => {
        if (prev >= 100) { clearInterval(dbInterval); return 100; }
        return prev + 4;
      });
    }, 80);
    timers.push(setTimeout(() => {
      clearInterval(dbInterval);
      setDbSearchProgress(100);
      setScanPhase('result');
    }, 3800));

    // RIGHT STATION: Fraud evidence layout
    timers.push(setTimeout(() => setFraudPhase('layout'), 600));
    timers.push(setTimeout(() => setFraudPhase('uv'), 1800));

    // UV sweep animation
    const uvInterval = setInterval(() => {
      setUvSweepPos(prev => {
        if (prev >= 100) { clearInterval(uvInterval); return 100; }
        return prev + 2;
      });
    }, 40);
    timers.push(setTimeout(() => clearInterval(uvInterval), 3600) as unknown as ReturnType<typeof setTimeout>);

    // Highlight receipts under UV
    RECEIPT_AMOUNTS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setHighlightedAmounts(prev => [...prev, i]);
      }, 2200 + i * 400));
    });

    // Fraud scoring
    timers.push(setTimeout(() => setFraudPhase('scoring'), 3800));
    const scoreInterval = setInterval(() => {
      setFraudScore(prev => {
        const target = COMPLIANCE_RESULT.fraudRisk * 100;
        if (prev >= target) { clearInterval(scoreInterval); return target; }
        return prev + 2;
      });
    }, 50);
    timers.push(setTimeout(() => {
      clearInterval(scoreInterval);
      setFraudScore(COMPLIANCE_RESULT.fraudRisk * 100);
      setFraudPhase('result');
    }, 4600));

    // Report card
    timers.push(setTimeout(() => setShowReport(true), 5200));
    timers.push(setTimeout(() => onComplete?.(), 7000));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(dbInterval);
      clearInterval(uvInterval);
      clearInterval(scoreInterval);
    };
  }, [autoPlay, onComplete]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden gap-6">
      {/* Title */}
      <motion.div
        className="text-[10px] font-mono uppercase tracking-[0.2em]"
        style={{ color: 'oklch(0.6 0.1 250)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        🔬 Forensic Lab — CSI Investigation
      </motion.div>

      <div className="flex gap-8 w-full max-w-3xl px-4">
        {/* ── LEFT STATION: Sanctions Biometric ── */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.06 250 / 70%)' }}>
            🧬 Station 1 — Identity Analysis
          </div>

          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{
              height: 280,
              background: 'oklch(0.12 0.02 256)',
              border: '1px solid oklch(0.25 0.04 256)',
            }}
          >
            {/* Overhead light effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-2 rounded-b-full" style={{ background: 'oklch(0.5 0.08 250 / 15%)' }} />

            {/* Biometric scan area */}
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
              {/* Name with biometric grid */}
              <div className="relative">
                <motion.div
                  className="px-6 py-3 rounded-lg text-center"
                  style={{
                    background: 'oklch(0.18 0.02 256)',
                    border: `1px solid ${scanPhase === 'result'
                      ? (COMPLIANCE_RESULT.sanctionsClear ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.65 0.2 15 / 50%)')
                      : 'oklch(0.3 0.04 256)'}`,
                  }}
                >
                  <div className="text-[8px] font-mono text-muted-foreground mb-1">SUBJECT</div>
                  <div className="text-sm font-mono font-bold text-foreground">{CLAIMANT_NAME}</div>
                </motion.div>

                {/* Biometric scan grid overlay */}
                {scanPhase === 'biometric' && (
                  <motion.div
                    className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
                    style={{ border: '1px solid oklch(0.55 0.15 250 / 40%)' }}
                  >
                    {/* Grid lines */}
                    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <line key={`bg${i}`} x1={0} y1={i * 10} x2="100%" y2={i * 10} stroke="oklch(0.55 0.15 250)" strokeWidth={0.5} />
                      ))}
                      {Array.from({ length: 12 }).map((_, i) => (
                        <line key={`bv${i}`} x1={i * 15} y1={0} x2={i * 15} y2="100%" stroke="oklch(0.55 0.15 250)" strokeWidth={0.5} />
                      ))}
                    </svg>
                    <motion.div
                      className="absolute left-0 right-0 h-[2px]"
                      style={{ background: 'oklch(0.55 0.15 250)', boxShadow: '0 0 10px oklch(0.55 0.15 250)' }}
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                )}
              </div>

              {/* Database search */}
              {(scanPhase === 'searching' || scanPhase === 'result') && (
                <motion.div
                  className="w-full max-w-[200px] flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* DB icon */}
                  <motion.div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'oklch(0.2 0.03 256)',
                      border: '1px solid oklch(0.3 0.04 256)',
                    }}
                    animate={scanPhase === 'searching' ? { rotateY: [0, 360] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  >
                    <span className="text-lg">🗄️</span>
                  </motion.div>

                  {/* Progress ring */}
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.2 0.02 256)" strokeWidth="2.5" />
                      <motion.circle
                        cx="18" cy="18" r="14"
                        fill="none"
                        stroke={scanPhase === 'result'
                          ? (COMPLIANCE_RESULT.sanctionsClear ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)')
                          : 'oklch(0.55 0.15 250)'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 14}
                        animate={{ strokeDashoffset: 2 * Math.PI * 14 * (1 - dbSearchProgress / 100) }}
                        transition={{ duration: 0.1 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-mono font-bold text-foreground">
                        {scanPhase === 'result' ? (COMPLIANCE_RESULT.sanctionsClear ? '✅' : '❌') : `${Math.round(dbSearchProgress)}%`}
                      </span>
                    </div>
                  </div>

                  <span className="text-[7px] font-mono text-muted-foreground">
                    {scanPhase === 'result'
                      ? `No match in 12M+ records`
                      : 'Searching OFAC database...'}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT STATION: Fraud UV Analysis ── */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.06 250 / 70%)' }}>
            🔦 Station 2 — Fraud Analysis
          </div>

          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{
              height: 280,
              background: 'oklch(0.12 0.02 256)',
              border: '1px solid oklch(0.25 0.04 256)',
            }}
          >
            {/* Overhead light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-2 rounded-b-full" style={{ background: 'oklch(0.4 0.12 280 / 15%)' }} />

            <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
              {/* Evidence tags */}
              <div className="flex flex-wrap justify-center gap-2 w-full max-w-[220px] relative">
                {RECEIPT_AMOUNTS.map((amt, i) => {
                  const isHighlighted = highlightedAmounts.includes(i);
                  const isResult = fraudPhase === 'result';
                  return (
                    <motion.div
                      key={i}
                      className="relative px-3 py-2 rounded-md"
                      style={{
                        background: isResult
                          ? 'oklch(0.7 0.17 160 / 10%)'
                          : isHighlighted
                            ? 'oklch(0.4 0.15 280 / 20%)'
                            : 'oklch(0.18 0.02 256)',
                        border: `1px solid ${isResult
                          ? 'oklch(0.7 0.17 160 / 30%)'
                          : isHighlighted
                            ? 'oklch(0.5 0.18 280 / 40%)'
                            : 'oklch(0.3 0.03 256)'}`,
                        boxShadow: isHighlighted && !isResult
                          ? '0 0 15px oklch(0.5 0.18 280 / 25%)'
                          : 'none',
                      }}
                      initial={fraudPhase === 'idle' ? { opacity: 0, scale: 0.8 } : {}}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {/* Evidence number badge */}
                      <div
                        className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold"
                        style={{
                          background: 'oklch(0.8 0.16 80)',
                          color: 'oklch(0.15 0.02 256)',
                        }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[9px] font-mono font-bold text-foreground">{amt}</span>
                    </motion.div>
                  );
                })}

                {/* UV light sweep */}
                {fraudPhase === 'uv' && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, transparent ${uvSweepPos - 15}%, oklch(0.4 0.18 280 / 30%) ${uvSweepPos}%, transparent ${uvSweepPos + 15}%)`,
                      borderRadius: 8,
                    }}
                  />
                )}
              </div>

              {/* Fraud thermometer */}
              {(fraudPhase === 'scoring' || fraudPhase === 'result') && (
                <motion.div
                  className="flex items-center gap-3 w-full max-w-[200px]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="text-[7px] font-mono text-muted-foreground shrink-0">Risk</div>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'oklch(0.2 0.02 256)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: fraudScore <= 30
                          ? 'oklch(0.7 0.17 160)'
                          : fraudScore <= 60
                            ? 'oklch(0.8 0.16 80)'
                            : 'oklch(0.65 0.2 15)',
                      }}
                      animate={{ width: `${fraudScore}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="text-[8px] font-mono font-bold shrink-0" style={{
                    color: fraudScore <= 30 ? 'oklch(0.7 0.17 160)' : 'oklch(0.8 0.16 80)',
                  }}>
                    {Math.round(fraudScore)}%
                  </span>
                </motion.div>
              )}

              {/* Result label */}
              {fraudPhase === 'result' && (
                <motion.div
                  className="px-3 py-1 rounded-full text-[8px] font-bold"
                  style={{
                    background: 'oklch(0.7 0.17 160 / 15%)',
                    border: '1px solid oklch(0.7 0.17 160 / 30%)',
                    color: 'oklch(0.7 0.17 160)',
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  ✅ No duplicates — {COMPLIANCE_RESULT.fraudLabel} risk
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Forensic report card */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            className="flex items-center gap-5 px-6 py-3 rounded-xl"
            style={{
              background: 'oklch(0.14 0.02 256 / 90%)',
              border: '1px solid oklch(0.7 0.17 160 / 30%)',
              boxShadow: '0 0 30px oklch(0.7 0.17 160 / 12%)',
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div className="text-2xl" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.2 }}>
              📋
            </motion.div>
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>FORENSIC REPORT: ALL CLEAR</div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-mono text-muted-foreground">
                  Identity: <span style={{ color: 'oklch(0.7 0.17 160)' }}>VERIFIED ({COMPLIANCE_RESULT.sanctionsConf})</span>
                </span>
                <div className="w-px h-3" style={{ background: 'oklch(0.3 0.03 256)' }} />
                <span className="text-[8px] font-mono text-muted-foreground">
                  Fraud: <span style={{ color: 'oklch(0.7 0.17 160)' }}>{COMPLIANCE_RESULT.fraudLabel} ({COMPLIANCE_RESULT.fraudRisk})</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option B — Forensic Lab / CSI
      </div>
    </div>
  );
}
