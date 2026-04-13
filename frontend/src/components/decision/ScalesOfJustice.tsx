"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { METRICS, G_SCORE, THRESHOLD, APPROVED_AMOUNT, VERDICT } from './decision-data';

interface ScalesOfJusticeProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'loading' | 'settling' | 'threshold' | 'verdict';

export function ScalesOfJustice({ onComplete, autoPlay = true }: ScalesOfJusticeProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [leftOrbs, setLeftOrbs] = useState<number[]>([]);
  const [rightOrbs, setRightOrbs] = useState<number[]>([]);
  const [showGScore, setShowGScore] = useState(false);
  const [showThresholdLine, setShowThresholdLine] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const startedRef = useRef(false);

  const positiveMetrics = METRICS.filter(m => !m.subtract);
  const negativeMetrics = METRICS.filter(m => m.subtract);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setStage('loading'), 400));

    // Drop positive orbs on left pan
    positiveMetrics.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setLeftOrbs(prev => [...prev, i]);
      }, 800 + i * 900));
    });

    // Drop negative orbs on right pan
    negativeMetrics.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setRightOrbs(prev => [...prev, i]);
      }, 800 + positiveMetrics.length * 900 + 400 + i * 900));
    });

    // Settle
    const settleTime = 800 + (positiveMetrics.length + negativeMetrics.length) * 900 + 800;
    timers.push(setTimeout(() => {
      setStage('settling');
      setShowGScore(true);
    }, settleTime));

    // Threshold
    timers.push(setTimeout(() => {
      setStage('threshold');
      setShowThresholdLine(true);
    }, settleTime + 1200));

    // Verdict
    timers.push(setTimeout(() => {
      setStage('verdict');
      setShowVerdict(true);
      if (VERDICT === 'approve') setShowConfetti(true);
    }, settleTime + 2500));

    timers.push(setTimeout(() => onComplete?.(), settleTime + 5000));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete, positiveMetrics.length, negativeMetrics.length]);

  // Calculate tilt based on weighted evidence
  const leftWeight = useMemo(() =>
    leftOrbs.reduce((sum, i) => sum + positiveMetrics[i].value * positiveMetrics[i].weight, 0),
    [leftOrbs, positiveMetrics]
  );
  const rightWeight = useMemo(() =>
    rightOrbs.reduce((sum, i) => sum + negativeMetrics[i].value * negativeMetrics[i].weight, 0),
    [rightOrbs, negativeMetrics]
  );

  const tilt = useMemo(() => {
    if (stage === 'verdict') {
      return VERDICT === 'approve' ? -6 : VERDICT === 'deny' ? 6 : 0;
    }
    if (leftOrbs.length === 0 && rightOrbs.length === 0) return 0;
    const diff = rightWeight - leftWeight;
    return Math.max(-10, Math.min(10, diff * 15));
  }, [leftWeight, rightWeight, leftOrbs.length, rightOrbs.length, stage]);

  const leftPanY = tilt * 2.5;
  const rightPanY = -tilt * 2.5;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!showVerdict ? (
          <motion.div
            key="scales"
            className="relative"
            style={{ width: 600, height: 380 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
                ⚖️ Scales of Justice — Decision Engine
              </span>
            </div>

            {/* Fulcrum base */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2" style={{ zIndex: 10 }}>
              <div style={{
                width: 0, height: 0,
                borderLeft: '35px solid transparent',
                borderRight: '35px solid transparent',
                borderBottom: '50px solid oklch(0.3 0.05 250)',
                filter: 'drop-shadow(0 2px 10px oklch(0 0 0 / 40%))',
              }} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-28 h-2 rounded-md"
                style={{ background: 'oklch(0.25 0.04 250)', boxShadow: '0 2px 8px oklch(0 0 0 / 30%)' }} />
            </div>

            {/* G Score at fulcrum */}
            <AnimatePresence>
              {showGScore && (
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
                  style={{ bottom: 60 }}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle, ${G_SCORE >= THRESHOLD ? 'oklch(0.7 0.17 160 / 25%)' : 'oklch(0.65 0.2 15 / 25%)'}, transparent)`,
                      border: `2px solid ${G_SCORE >= THRESHOLD ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.65 0.2 15 / 50%)'}`,
                      boxShadow: `0 0 25px ${G_SCORE >= THRESHOLD ? 'oklch(0.7 0.17 160 / 20%)' : 'oklch(0.65 0.2 15 / 20%)'}`,
                    }}
                  >
                    <div className="text-center">
                      <div className="text-[7px] font-mono text-muted-foreground">G</div>
                      <div className="text-sm font-bold font-mono" style={{ color: G_SCORE >= THRESHOLD ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)' }}>
                        {G_SCORE.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Beam */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                width: 480, height: 6, top: 130, borderRadius: 3,
                background: 'linear-gradient(90deg, oklch(0.45 0.08 250), oklch(0.55 0.1 250), oklch(0.45 0.08 250))',
                boxShadow: '0 0 15px oklch(0.5 0.1 250 / 20%)',
                transformOrigin: 'center center',
                zIndex: 5,
              }}
              animate={{ rotate: tilt }}
              transition={{ type: 'spring', stiffness: 60, damping: 12 }}
            />

            {/* Left chain */}
            <motion.div
              className="absolute"
              style={{ left: 62, top: 136, width: 2, zIndex: 4 }}
              animate={{ height: 50 + leftPanY, y: leftPanY }}
              transition={{ type: 'spring', stiffness: 60, damping: 12 }}
            >
              <div className="w-full h-full rounded" style={{ background: 'oklch(0.4 0.06 250)' }} />
            </motion.div>

            {/* Right chain */}
            <motion.div
              className="absolute"
              style={{ right: 62, top: 136, width: 2, zIndex: 4 }}
              animate={{ height: 50 + rightPanY, y: rightPanY }}
              transition={{ type: 'spring', stiffness: 60, damping: 12 }}
            >
              <div className="w-full h-full rounded" style={{ background: 'oklch(0.4 0.06 250)' }} />
            </motion.div>

            {/* LEFT PAN — Evidence FOR */}
            <motion.div
              className="absolute"
              style={{ left: 20, width: 200, zIndex: 6 }}
              animate={{ top: 186 + leftPanY }}
              transition={{ type: 'spring', stiffness: 60, damping: 12 }}
            >
              <div className="w-full h-3 rounded-b-full" style={{ background: 'oklch(0.3 0.06 250)', boxShadow: '0 2px 8px oklch(0 0 0 / 25%)' }} />
              <div className="text-center mt-1">
                <span className="text-[7px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.08 160)' }}>Evidence FOR</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 mt-2">
                <AnimatePresence>
                  {leftOrbs.map((idx) => {
                    const m = positiveMetrics[idx];
                    const weighted = (m.value * m.weight).toFixed(3);
                    return (
                      <motion.div
                        key={`left-${idx}`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                        style={{
                          background: `${m.color}15`,
                          border: `1px solid ${m.color}35`,
                          boxShadow: `0 0 12px ${m.color}15`,
                        }}
                        initial={{ opacity: 0, y: -50, scale: 0.3 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                      >
                        <span className="text-sm">{m.icon}</span>
                        <div>
                          <div className="text-[7px] font-mono text-muted-foreground">{m.label}</div>
                          <div className="text-[9px] font-mono font-bold" style={{ color: m.color }}>
                            {m.value} × {m.weight} = +{weighted}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* RIGHT PAN — Evidence AGAINST */}
            <motion.div
              className="absolute"
              style={{ right: 20, width: 200, zIndex: 6 }}
              animate={{ top: 186 + rightPanY }}
              transition={{ type: 'spring', stiffness: 60, damping: 12 }}
            >
              <div className="w-full h-3 rounded-b-full" style={{ background: 'oklch(0.3 0.06 250)', boxShadow: '0 2px 8px oklch(0 0 0 / 25%)' }} />
              <div className="text-center mt-1">
                <span className="text-[7px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.08 15)' }}>Evidence AGAINST</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 mt-2">
                <AnimatePresence>
                  {rightOrbs.map((idx) => {
                    const m = negativeMetrics[idx];
                    const weighted = (m.value * m.weight).toFixed(3);
                    return (
                      <motion.div
                        key={`right-${idx}`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                        style={{
                          background: `${m.color}15`,
                          border: `1px solid ${m.color}35`,
                          boxShadow: `0 0 12px ${m.color}15`,
                        }}
                        initial={{ opacity: 0, y: -50, scale: 0.3 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                      >
                        <span className="text-sm">{m.icon}</span>
                        <div>
                          <div className="text-[7px] font-mono text-muted-foreground">{m.label}</div>
                          <div className="text-[9px] font-mono font-bold" style={{ color: m.color }}>
                            {m.value} × {m.weight} = −{weighted}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Threshold line */}
            {showThresholdLine && (
              <motion.div
                className="absolute left-8 right-8 flex items-center gap-2"
                style={{ top: 125, zIndex: 15 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex-1 h-px border-t border-dashed" style={{ borderColor: 'oklch(0.9 0 0 / 40%)' }} />
                <span className="text-[7px] font-mono shrink-0" style={{ color: 'oklch(0.7 0.04 0)' }}>threshold {THRESHOLD}</span>
                <div className="flex-1 h-px border-t border-dashed" style={{ borderColor: 'oklch(0.9 0 0 / 40%)' }} />
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Verdict */
          <motion.div
            key="verdict"
            className="flex flex-col items-center gap-4 relative"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12 }}
          >
            {/* Confetti */}
            {showConfetti && Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: ['oklch(0.7 0.17 160)', 'oklch(0.8 0.16 80)', 'oklch(0.62 0.19 250)', 'oklch(0.7 0.15 195)'][i % 4],
                }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 350,
                  y: (Math.random() - 0.5) * 250,
                  opacity: 0, scale: 0,
                }}
                transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.3 }}
              />
            ))}

            <motion.div
              className="rounded-2xl px-10 py-6 text-center"
              style={{
                background: VERDICT === 'approve' ? 'oklch(0.7 0.17 160 / 12%)' : VERDICT === 'deny' ? 'oklch(0.65 0.2 15 / 12%)' : 'oklch(0.8 0.16 80 / 12%)',
                border: `2px solid ${VERDICT === 'approve' ? 'oklch(0.7 0.17 160 / 40%)' : VERDICT === 'deny' ? 'oklch(0.65 0.2 15 / 40%)' : 'oklch(0.8 0.16 80 / 40%)'}`,
                boxShadow: `0 0 50px ${VERDICT === 'approve' ? 'oklch(0.7 0.17 160 / 15%)' : VERDICT === 'deny' ? 'oklch(0.65 0.2 15 / 15%)' : 'oklch(0.8 0.16 80 / 15%)'}`,
              }}
            >
              <motion.div className="text-3xl mb-2" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.2 }}>
                {VERDICT === 'approve' ? '✅' : VERDICT === 'deny' ? '❌' : '⚠️'}
              </motion.div>
              <div className="text-lg font-bold" style={{ color: VERDICT === 'approve' ? 'oklch(0.7 0.17 160)' : VERDICT === 'deny' ? 'oklch(0.65 0.2 15)' : 'oklch(0.8 0.16 80)' }}>
                CLAIM {VERDICT === 'approve' ? 'APPROVED' : VERDICT === 'deny' ? 'DENIED' : 'ESCALATED'}
              </div>
              <div className="text-2xl font-bold font-mono mt-1" style={{ color: 'oklch(0.7 0.17 160)' }}>
                {APPROVED_AMOUNT}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-2">
                G = {G_SCORE.toFixed(2)} | Threshold: {THRESHOLD.toFixed(2)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option A — Scales of Justice
      </div>
    </div>
  );
}
