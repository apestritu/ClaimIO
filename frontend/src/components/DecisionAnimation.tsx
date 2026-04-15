"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry } from '@/lib/claim-data';
import type { DecisionAgentData } from '@/lib/agent-data-mapper';

interface DecisionAnimationProps {
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
  agentData?: DecisionAgentData;
}

interface MetricCard {
  label: string;
  value: number;
  weight: number;
  icon: string;
  color: string;
  subtract?: boolean;
}

const METRICS: MetricCard[] = [
  { label: 'C_docs', value: 0.89, weight: 0.30, icon: '📄', color: 'oklch(0.62 0.19 250)' },
  { label: 'C_extract', value: 0.89, weight: 0.30, icon: '🧠', color: 'oklch(0.7 0.15 195)' },
  { label: 'C_coverage', value: 0.82, weight: 0.30, icon: '⚖️', color: 'oklch(0.8 0.16 80)' },
  { label: 'Fraud', value: 0.20, weight: 0.20, icon: '🔍', color: 'oklch(0.65 0.2 15)', subtract: true },
];

const G_SCORE = 0.74;
const THRESHOLD = 0.70;

type Stage = 'metrics' | 'merge' | 'doors' | 'verdict';

export function DecisionAnimation({ addLog, onComplete, agentData }: DecisionAnimationProps) {
  const metrics = agentData?.metrics ?? METRICS;
  const gScore = agentData?.globalConfidence ?? G_SCORE;
  const threshold = agentData?.threshold ?? THRESHOLD;
  const decisionStatus = agentData?.status ?? 'APPROVED';
  const decisionAmount = agentData?.amount ?? 487.30;
  const [stage, setStage] = useState<Stage>('metrics');
  const [visibleMetrics, setVisibleMetrics] = useState(0);
  const [showGScore, setShowGScore] = useState(false);
  const [showThreshold, setShowThreshold] = useState(false);
  const [orbDoor, setOrbDoor] = useState(-1);
  const [selectedDoor, setSelectedDoor] = useState(-1);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    addLog({ icon: '⚖️', text: 'Computing global confidence...' });

    // Show metrics one by one
    metrics.forEach((m, i) => {
      setTimeout(() => {
        setVisibleMetrics(i + 1);
        const contrib = m.subtract ? -(m.value * m.weight) : m.value * m.weight;
        addLog({
          icon: '→',
          text: `${m.label}: ${m.value.toFixed(2)} × ${m.weight.toFixed(2)} = ${m.subtract ? '' : ''}${contrib.toFixed(3)}`,
        });
      }, 300 + i * 300);
    });

    // Merge into G score
    const t1 = setTimeout(() => {
      setStage('merge');
      setShowGScore(true);
      addLog({ icon: '📊', text: `G = ${gScore.toFixed(2)} (threshold: ${threshold.toFixed(2)})` });
    }, 300 + metrics.length * 300 + 250);

    const t2 = setTimeout(() => {
      setShowThreshold(true);
      const aboveThreshold = gScore >= threshold;
      addLog({ icon: aboveThreshold ? '✅' : '⚠️', text: aboveThreshold ? 'Above automatic threshold' : 'Below automatic threshold' });
    }, 300 + metrics.length * 300 + 750);

    // Doors phase
    const t3 = setTimeout(() => {
      setStage('doors');
    }, 300 + metrics.length * 300 + 1250);

    // Orb bouncing between doors
    const orbTimers: ReturnType<typeof setTimeout>[] = [];
    [0, 1, 2, 0, 2, 1, 0].forEach((door, i) => {
      orbTimers.push(setTimeout(() => setOrbDoor(door), 300 + metrics.length * 300 + 1400 + i * 125));
    });

    // Select appropriate door based on decision
    const doorIndex = decisionStatus === 'APPROVED' ? 0 : decisionStatus === 'DENIED' ? 1 : 2;
    const t4 = setTimeout(() => {
      setSelectedDoor(doorIndex);
      setOrbDoor(-1);
    }, 300 + metrics.length * 300 + 2400);

    // Show verdict banner
    const verdictIcon = decisionStatus === 'APPROVED' ? '🟢' : decisionStatus === 'DENIED' ? '🔴' : '🟡';
    const t5 = setTimeout(() => {
      setShowVerdict(true);
      if (decisionStatus === 'APPROVED') setShowConfetti(true);
      addLog({ icon: verdictIcon, text: `Decision: ${decisionStatus} — $${decisionAmount.toFixed(2)}` });
    }, 300 + metrics.length * 300 + 2750);

    const t6 = setTimeout(() => onComplete(), 300 + metrics.length * 300 + 3750);

    return () => {
      [t1, t2, t3, t4, t5, t6, ...orbTimers].forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doors = [
    { label: 'APPROVE', icon: '🟢', color: 'oklch(0.7 0.17 160)', bg: 'oklch(0.7 0.17 160 / 10%)' },
    { label: 'DENY', icon: '🔴', color: 'oklch(0.65 0.2 15)', bg: 'oklch(0.65 0.2 15 / 10%)' },
    { label: 'ESCALATE', icon: '🟡', color: 'oklch(0.8 0.16 80)', bg: 'oklch(0.8 0.16 80 / 10%)' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-5">

      {/* ── PART A: Metric Cards ── */}
      {(stage === 'metrics' || stage === 'merge') && !showVerdict && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4 flex-wrap justify-center">
            {metrics.slice(0, visibleMetrics).map((m, i) => (
              <motion.div
                key={m.label}
                className="w-28 rounded-xl p-3 flex flex-col items-center gap-1"
                style={{
                  background: 'oklch(0.18 0.02 256)',
                  border: `1px solid ${m.color}40`,
                  boxShadow: `0 0 15px ${m.color}15`,
                }}
                initial={{
                  opacity: 0,
                  x: i === 0 ? -80 : i === 1 ? 80 : i === 2 ? -80 : 80,
                  y: i < 2 ? -40 : 40,
                }}
                animate={{
                  opacity: 1,
                  x: showGScore ? 0 : undefined,
                  y: showGScore ? 0 : undefined,
                  scale: showGScore ? 0.85 : 1,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              >
                <span className="text-lg">{m.icon}</span>
                <span className="text-[8px] font-mono text-muted-foreground">{m.label}</span>
                <span className="text-sm font-mono font-bold" style={{ color: m.color }}>
                  {m.subtract ? '−' : ''}{m.value.toFixed(2)}
                </span>
                <span className="text-[7px] font-mono text-muted-foreground/60">
                  ×{m.weight.toFixed(1)}
                </span>
              </motion.div>
            ))}
          </div>

          {/* G Score */}
          <AnimatePresence>
            {showGScore && (
              <motion.div
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {/* Glowing G orb */}
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, oklch(0.8 0.16 80 / 25%), oklch(0.62 0.19 250 / 8%))',
                    border: '2px solid oklch(0.8 0.16 80 / 50%)',
                    boxShadow: '0 0 40px oklch(0.8 0.16 80 / 20%)',
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-muted-foreground">G</div>
                    <div className="text-lg font-bold font-mono" style={{ color: 'oklch(0.8 0.16 80)' }}>
                      {gScore.toFixed(2)}
                    </div>
                  </div>
                </motion.div>

                {/* Threshold bar */}
                {showThreshold && (
                  <motion.div
                    className="w-72 relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div
                      className="h-3 rounded-full relative overflow-hidden"
                      style={{ background: 'oklch(0.2 0.02 256)' }}
                    >
                      {/* Gradient fill */}
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: '100%',
                          background: 'linear-gradient(90deg, oklch(0.65 0.2 15), oklch(0.8 0.16 80), oklch(0.7 0.17 160))',
                          opacity: 0.3,
                        }}
                      />
                      {/* Threshold line */}
                      <motion.div
                        className="absolute top-0 bottom-0 w-0.5"
                        style={{
                          left: `${threshold * 100}%`,
                          background: 'oklch(0.9 0 0)',
                          boxShadow: '0 0 6px oklch(0.9 0 0)',
                        }}
                      />
                      {/* G score pin */}
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                        style={{
                          background: gScore >= threshold ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)',
                          boxShadow: `0 0 10px ${gScore >= threshold ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)'}`,
                        }}
                        initial={{ left: '0%' }}
                        animate={{ left: `${gScore * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[7px] font-mono text-muted-foreground/50">
                      <span>0</span>
                      <span style={{ position: 'absolute', left: `${threshold * 100}%`, transform: 'translateX(-50%)' }}>
                        threshold: {threshold}
                      </span>
                      <span>1.0</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── PART B: Doors ── */}
      {stage === 'doors' && !showVerdict && (
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* G score compact */}
          <div className="text-center">
            <span className="text-sm font-mono font-bold" style={{ color: 'oklch(0.8 0.16 80)' }}>
              G = {gScore.toFixed(2)}
            </span>
          </div>

          {/* Three doors */}
          <div className="flex gap-5">
            {doors.map((door, i) => {
              const isSelected = selectedDoor === i;
              const isOrbHere = orbDoor === i;
              const isDimmed = selectedDoor >= 0 && selectedDoor !== i;

              return (
                <motion.div
                  key={door.label}
                  className="w-28 h-36 rounded-xl flex flex-col items-center justify-center gap-2 relative"
                  style={{
                    background: isSelected ? door.bg : 'oklch(0.16 0.02 256 / 60%)',
                    border: `2px solid ${isSelected ? door.color : isDimmed ? 'oklch(0.25 0.02 256)' : `${door.color}40`}`,
                    boxShadow: isSelected ? `0 0 30px ${door.color}40` : isOrbHere ? `0 0 15px ${door.color}30` : 'none',
                    opacity: isDimmed ? 0.3 : 1,
                  }}
                  animate={{
                    scale: isSelected ? 1.1 : isDimmed ? 0.9 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <span className="text-2xl">{door.icon}</span>
                  <span
                    className="text-[10px] font-bold font-mono"
                    style={{ color: isDimmed ? 'oklch(0.4 0.02 256)' : door.color }}
                  >
                    {door.label}
                  </span>

                  {/* Bouncing orb */}
                  {isOrbHere && (
                    <motion.div
                      className="absolute -top-3 w-4 h-4 rounded-full"
                      style={{
                        background: 'oklch(0.9 0.05 80)',
                        boxShadow: '0 0 15px oklch(0.9 0.05 80 / 60%)',
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    />
                  )}

                  {/* Selected glow ring */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{ border: `2px solid ${door.color}` }}
                      animate={{ scale: [1, 1.08], opacity: [0.6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── VERDICT BANNER ── */}
      <AnimatePresence>
        {showVerdict && (
          <motion.div
            className="flex flex-col items-center gap-4 relative"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12 }}
          >
            {/* Confetti particles */}
            {showConfetti && Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: [
                    'oklch(0.7 0.17 160)',
                    'oklch(0.8 0.16 80)',
                    'oklch(0.62 0.19 250)',
                    'oklch(0.7 0.15 195)',
                  ][i % 4],
                }}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 200,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.3 }}
              />
            ))}

            <motion.div
              className="rounded-2xl px-10 py-6 text-center"
              style={{
                background: 'oklch(0.7 0.17 160 / 12%)',
                border: '2px solid oklch(0.7 0.17 160 / 40%)',
                boxShadow: '0 0 50px oklch(0.7 0.17 160 / 15%)',
              }}
            >
              <div className="text-3xl mb-2">✅</div>
              <div className="text-lg font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>
                CLAIM APPROVED
              </div>
              <div className="text-2xl font-bold font-mono mt-1" style={{ color: 'oklch(0.7 0.17 160)' }}>
                ${decisionAmount.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-2">
                Global Confidence: {gScore.toFixed(2)} | Threshold: {threshold.toFixed(2)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
