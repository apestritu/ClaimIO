"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { METRICS, G_SCORE, THRESHOLD, APPROVED_AMOUNT, VERDICT } from './decision-data';

interface PowerMeterProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'charging' | 'draining' | 'threshold' | 'verdict';

export function PowerMeter({ onComplete, autoPlay = true }: PowerMeterProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [chargedStreams, setChargedStreams] = useState<number[]>([]);
  const [drainedStreams, setDrainedStreams] = useState<number[]>([]);
  const [fillLevel, setFillLevel] = useState(0);
  const [showThreshold, setShowThreshold] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const startedRef = useRef(false);

  const positiveMetrics = METRICS.filter(m => !m.subtract);
  const negativeMetrics = METRICS.filter(m => m.subtract);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setStage('charging'), 500));

    // Charge positive streams
    let runningFill = 0;
    positiveMetrics.forEach((m, i) => {
      const contrib = m.value * m.weight;
      timers.push(setTimeout(() => {
        setChargedStreams(prev => [...prev, i]);
        runningFill += contrib;
        setFillLevel(runningFill);
      }, 800 + i * 1200));
    });

    // Drain negative streams
    const drainStart = 800 + positiveMetrics.length * 1200 + 600;
    timers.push(setTimeout(() => setStage('draining'), drainStart));

    negativeMetrics.forEach((m, i) => {
      const drain = m.value * m.weight;
      timers.push(setTimeout(() => {
        setDrainedStreams(prev => [...prev, i]);
        runningFill -= drain;
        setFillLevel(runningFill);
      }, drainStart + 400 + i * 1000));
    });

    // Threshold reveal
    const thresholdTime = drainStart + 400 + negativeMetrics.length * 1000 + 800;
    timers.push(setTimeout(() => {
      setStage('threshold');
      setShowThreshold(true);
    }, thresholdTime));

    // Verdict
    timers.push(setTimeout(() => {
      setStage('verdict');
      setShowVerdict(true);
      if (VERDICT === 'approve') setShowConfetti(true);
    }, thresholdTime + 1800));

    timers.push(setTimeout(() => onComplete?.(), thresholdTime + 4500));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete, positiveMetrics, negativeMetrics]);

  // Normalized fill (0-1 scale, G_SCORE max around 0.8 so scale to ~85%)
  const fillPercent = Math.min(fillLevel * 100, 95);
  const thresholdPercent = THRESHOLD * 100;
  const isAbove = fillLevel >= THRESHOLD;

  const coreColor = stage === 'verdict'
    ? (isAbove ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)')
    : 'oklch(0.55 0.15 250)';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!showVerdict ? (
          <motion.div
            key="core"
            className="relative flex items-center gap-10"
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* Stream labels — left side */}
            <div className="flex flex-col gap-3 w-44">
              {positiveMetrics.map((m, i) => {
                const isCharged = chargedStreams.includes(i);
                const contrib = (m.value * m.weight).toFixed(3);
                return (
                  <motion.div
                    key={m.label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: isCharged ? `${m.color}12` : 'oklch(0.15 0.02 256)',
                      border: `1px solid ${isCharged ? `${m.color}35` : 'oklch(0.25 0.03 256)'}`,
                    }}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: isCharged ? 1 : 0.3 }}
                  >
                    <span className="text-sm">{m.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[7px] font-mono text-muted-foreground">{m.label}</div>
                      <div className="text-[9px] font-mono font-bold" style={{ color: isCharged ? m.color : 'oklch(0.4 0.03 256)' }}>
                        +{contrib}
                      </div>
                    </div>
                    {/* Stream line to core */}
                    {isCharged && (
                      <motion.div
                        className="absolute right-0 h-[2px] w-8"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${m.color})`,
                          top: '50%',
                          transform: 'translateX(100%)',
                        }}
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 0.6, scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.div>
                );
              })}

              {/* Negative metrics below */}
              {negativeMetrics.map((m, i) => {
                const isDrained = drainedStreams.includes(i);
                const contrib = (m.value * m.weight).toFixed(3);
                return (
                  <motion.div
                    key={m.label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: isDrained ? `${m.color}12` : 'oklch(0.15 0.02 256)',
                      border: `1px solid ${isDrained ? `${m.color}35` : 'oklch(0.25 0.03 256)'}`,
                    }}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: isDrained ? 1 : 0.3 }}
                  >
                    <span className="text-sm">{m.icon}</span>
                    <div>
                      <div className="text-[7px] font-mono text-muted-foreground">{m.label}</div>
                      <div className="text-[9px] font-mono font-bold" style={{ color: isDrained ? m.color : 'oklch(0.4 0.03 256)' }}>
                        −{contrib}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Energy Core (vertical tube) */}
            <div className="relative flex flex-col items-center">
              <span className="text-[9px] font-mono uppercase tracking-[0.15em] mb-2" style={{ color: 'oklch(0.6 0.1 250)' }}>
                ⚡ Energy Core
              </span>

              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  width: 80,
                  height: 280,
                  background: 'oklch(0.1 0.02 256)',
                  border: `2px solid oklch(0.3 0.05 250 / 50%)`,
                  boxShadow: `0 0 30px ${coreColor}15, inset 0 0 20px oklch(0 0 0 / 30%)`,
                }}
              >
                {/* Glass reflection */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: 'linear-gradient(120deg, oklch(0.3 0.05 250 / 8%) 0%, transparent 40%)',
                }} />

                {/* Fill level */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    background: stage === 'draining'
                      ? `linear-gradient(0deg, oklch(0.65 0.2 15 / 40%), ${coreColor}30)`
                      : `linear-gradient(0deg, ${coreColor}50, ${coreColor}20)`,
                    boxShadow: `inset 0 0 20px ${coreColor}30`,
                  }}
                  animate={{ height: `${fillPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />

                {/* Particle effects when charging */}
                {(stage === 'charging' || stage === 'draining') && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                          background: coreColor,
                          left: 15 + Math.random() * 50,
                        }}
                        animate={{
                          y: [280 - (fillPercent / 100) * 280, 280 - (fillPercent / 100) * 280 - 30],
                          opacity: [0.6, 0],
                        }}
                        transition={{
                          duration: 0.8 + Math.random(),
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Threshold marker */}
                {showThreshold && (
                  <motion.div
                    className="absolute left-0 right-0 flex items-center"
                    style={{ bottom: `${thresholdPercent}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex-1 h-px border-t border-dashed" style={{ borderColor: 'oklch(0.9 0 0 / 60%)' }} />
                  </motion.div>
                )}

                {/* G value label on the tube */}
                {fillLevel > 0 && (
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 text-center"
                    style={{ bottom: `${Math.max(fillPercent - 8, 2)}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-[10px] font-mono font-bold" style={{ color: 'white', textShadow: `0 0 8px ${coreColor}` }}>
                      {fillLevel.toFixed(2)}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Scale labels */}
              <div className="absolute right-[-30px] top-0 bottom-0 flex flex-col justify-between py-2">
                <span className="text-[6px] font-mono text-muted-foreground">1.0</span>
                {showThreshold && (
                  <span className="text-[6px] font-mono" style={{ color: 'oklch(0.7 0.04 0)', position: 'absolute', right: 0, bottom: `${thresholdPercent}%` }}>
                    {THRESHOLD}
                  </span>
                )}
                <span className="text-[6px] font-mono text-muted-foreground">0</span>
              </div>
            </div>
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
            {showConfetti && Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ background: ['oklch(0.7 0.17 160)', 'oklch(0.8 0.16 80)', 'oklch(0.62 0.19 250)', 'oklch(0.7 0.15 195)'][i % 4] }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: (Math.random() - 0.5) * 350, y: (Math.random() - 0.5) * 250, opacity: 0, scale: 0 }}
                transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.3 }}
              />
            ))}

            {/* Flash ring */}
            <motion.div
              className="absolute w-40 h-40 rounded-full"
              style={{ border: `3px solid ${isAbove ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)'}` }}
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1 }}
            />

            <motion.div
              className="rounded-2xl px-10 py-6 text-center"
              style={{
                background: isAbove ? 'oklch(0.7 0.17 160 / 12%)' : 'oklch(0.65 0.2 15 / 12%)',
                border: `2px solid ${isAbove ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.65 0.2 15 / 40%)'}`,
                boxShadow: `0 0 50px ${isAbove ? 'oklch(0.7 0.17 160 / 15%)' : 'oklch(0.65 0.2 15 / 15%)'}`,
              }}
            >
              <motion.div className="text-3xl mb-2" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.2 }}>
                {VERDICT === 'approve' ? '✅' : VERDICT === 'deny' ? '❌' : '⚠️'}
              </motion.div>
              <div className="text-lg font-bold" style={{ color: isAbove ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)' }}>
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
        Option B — Power Meter / Energy Core
      </div>
    </div>
  );
}
