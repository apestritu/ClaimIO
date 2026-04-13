"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { METRICS, G_SCORE, THRESHOLD, APPROVED_AMOUNT, VERDICT } from './decision-data';

interface CircuitBoardProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'pulses' | 'gates' | 'summing' | 'comparator' | 'routing' | 'verdict';

export function CircuitBoard({ onComplete, autoPlay = true }: CircuitBoardProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [activePulses, setActivePulses] = useState<number[]>([]);
  const [gateOutputs, setGateOutputs] = useState<number[]>([]);
  const [showSumNode, setShowSumNode] = useState(false);
  const [showComparator, setShowComparator] = useState(false);
  const [routeColor, setRouteColor] = useState<string | null>(null);
  const [showLED, setShowLED] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const startedRef = useRef(false);

  const isAbove = G_SCORE >= THRESHOLD;

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Input pulses enter from left
    timers.push(setTimeout(() => setStage('pulses'), 400));
    METRICS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setActivePulses(prev => [...prev, i]);
      }, 600 + i * 700));
    });

    // Phase 2: Pass through multiplier gates
    const gateStart = 600 + METRICS.length * 700 + 500;
    timers.push(setTimeout(() => setStage('gates'), gateStart));
    METRICS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setGateOutputs(prev => [...prev, i]);
      }, gateStart + 300 + i * 500));
    });

    // Phase 3: Summing node
    const sumStart = gateStart + 300 + METRICS.length * 500 + 600;
    timers.push(setTimeout(() => {
      setStage('summing');
      setShowSumNode(true);
    }, sumStart));

    // Phase 4: Comparator
    timers.push(setTimeout(() => {
      setStage('comparator');
      setShowComparator(true);
    }, sumStart + 1200));

    // Phase 5: Routing
    timers.push(setTimeout(() => {
      setStage('routing');
      setRouteColor(isAbove ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)');
    }, sumStart + 2200));

    // Phase 6: LED verdict
    timers.push(setTimeout(() => {
      setStage('verdict');
      setShowLED(true);
      if (VERDICT === 'approve') setShowConfetti(true);
    }, sumStart + 3200));

    timers.push(setTimeout(() => onComplete?.(), sumStart + 6000));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete, isAbove]);

  // Layout: 4 input rows, each with input → gate → wire to sum → comparator → output terminals
  const rowHeight = 60;
  const totalHeight = METRICS.length * rowHeight + 80;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* PCB background texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'oklch(0.11 0.025 160)',
        backgroundImage: `
          radial-gradient(oklch(0.15 0.03 160) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        opacity: 0.5,
      }} />

      <motion.div
        className="relative"
        style={{ width: 720, height: totalHeight }}
      >
        {/* Title */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
          <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: 'oklch(0.55 0.1 160)' }}>
            🔌 Logic Gate — Decision Circuit
          </span>
        </div>

        {/* SVG wiring layer */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {METRICS.map((m, i) => {
            const y = 40 + i * rowHeight;
            const isPulseActive = activePulses.includes(i);
            const isGateActive = gateOutputs.includes(i);
            const wireColor = m.subtract ? m.color : m.color;

            return (
              <g key={`wire-${i}`}>
                {/* Input wire (left edge to gate) */}
                <motion.line
                  x1={0} y1={y} x2={160} y2={y}
                  stroke={isPulseActive ? wireColor : 'oklch(0.25 0.04 160)'}
                  strokeWidth={isPulseActive ? 2 : 1}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: isPulseActive ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                />

                {/* Gate to sum wire */}
                <motion.line
                  x1={220} y1={y} x2={360} y2={totalHeight / 2}
                  stroke={isGateActive ? wireColor : 'oklch(0.25 0.04 160)'}
                  strokeWidth={isGateActive ? 2 : 1}
                  strokeDasharray={isGateActive ? 'none' : '4 4'}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: isGateActive ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Pulse dot traveling along wire */}
                {isPulseActive && !isGateActive && (
                  <motion.circle
                    r={4}
                    fill={wireColor}
                    filter={`drop-shadow(0 0 6px ${wireColor})`}
                    initial={{ cx: 0, cy: y }}
                    animate={{ cx: 160, cy: y }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                )}

                {isGateActive && !showSumNode && (
                  <motion.circle
                    r={3}
                    fill={wireColor}
                    filter={`drop-shadow(0 0 4px ${wireColor})`}
                    initial={{ cx: 220, cy: y }}
                    animate={{ cx: 360, cy: totalHeight / 2 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                )}
              </g>
            );
          })}

          {/* Sum node to comparator wire */}
          {showSumNode && (
            <motion.line
              x1={390} y1={totalHeight / 2} x2={480} y2={totalHeight / 2}
              stroke={showComparator ? 'oklch(0.9 0.05 80)' : 'oklch(0.25 0.04 160)'}
              strokeWidth={showComparator ? 2 : 1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4 }}
            />
          )}

          {/* Comparator to output routing */}
          {routeColor && (
            <>
              {/* Main output wire */}
              <motion.line
                x1={530} y1={totalHeight / 2} x2={650} y2={totalHeight / 2}
                stroke={routeColor}
                strokeWidth={2.5}
                filter={`drop-shadow(0 0 6px ${routeColor})`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />

              {/* Pulse traveling to LED */}
              {!showLED && (
                <motion.circle
                  r={5}
                  fill={routeColor}
                  filter={`drop-shadow(0 0 8px ${routeColor})`}
                  initial={{ cx: 530, cy: totalHeight / 2 }}
                  animate={{ cx: 650, cy: totalHeight / 2 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </>
          )}
        </svg>

        {/* Input signal labels (left edge) */}
        {METRICS.map((m, i) => {
          const y = 40 + i * rowHeight;
          const isActive = activePulses.includes(i);

          return (
            <motion.div
              key={`input-${i}`}
              className="absolute flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{
                left: -5,
                top: y - 14,
                background: isActive ? `${m.color}12` : 'oklch(0.14 0.02 256)',
                border: `1px solid ${isActive ? `${m.color}35` : 'oklch(0.22 0.03 256)'}`,
                zIndex: 5,
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isActive ? 1 : 0.3, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-xs">{m.icon}</span>
              <div>
                <div className="text-[6px] font-mono text-muted-foreground">{m.label}</div>
                <div className="text-[8px] font-mono font-bold" style={{ color: isActive ? m.color : 'oklch(0.4 0.03 256)' }}>
                  {m.value.toFixed(2)}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Multiplier gates */}
        {METRICS.map((m, i) => {
          const y = 40 + i * rowHeight;
          const isActive = gateOutputs.includes(i);
          const output = m.subtract ? -(m.value * m.weight) : m.value * m.weight;

          return (
            <motion.div
              key={`gate-${i}`}
              className="absolute flex flex-col items-center justify-center rounded-md"
              style={{
                left: 165,
                top: y - 16,
                width: 50,
                height: 32,
                background: isActive ? `${m.color}15` : 'oklch(0.14 0.02 256)',
                border: `1px solid ${isActive ? `${m.color}40` : 'oklch(0.25 0.03 256)'}`,
                zIndex: 5,
              }}
              animate={{ boxShadow: isActive ? `0 0 10px ${m.color}20` : 'none' }}
            >
              <div className="text-[7px] font-mono font-bold" style={{ color: isActive ? m.color : 'oklch(0.4 0.03 256)' }}>
                ×{m.weight}
              </div>
              {isActive && (
                <motion.div
                  className="text-[6px] font-mono"
                  style={{ color: m.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {m.subtract ? '−' : '+'}{Math.abs(output).toFixed(3)}
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Summation node */}
        <AnimatePresence>
          {showSumNode && (
            <motion.div
              className="absolute flex items-center justify-center rounded-full"
              style={{
                left: 352,
                top: totalHeight / 2 - 24,
                width: 48,
                height: 48,
                background: 'oklch(0.15 0.03 256)',
                border: '2px solid oklch(0.9 0.05 80 / 50%)',
                boxShadow: '0 0 20px oklch(0.9 0.05 80 / 20%)',
                zIndex: 10,
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="text-center">
                <div className="text-[6px] font-mono text-muted-foreground">Σ</div>
                <div className="text-[10px] font-mono font-bold" style={{ color: 'oklch(0.9 0.05 80)' }}>
                  {G_SCORE.toFixed(2)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparator gate */}
        <AnimatePresence>
          {showComparator && (
            <motion.div
              className="absolute flex flex-col items-center justify-center rounded-lg"
              style={{
                left: 483,
                top: totalHeight / 2 - 22,
                width: 52,
                height: 44,
                background: 'oklch(0.14 0.02 256)',
                border: `2px solid ${routeColor || 'oklch(0.35 0.05 256)'}`,
                boxShadow: routeColor ? `0 0 15px ${routeColor}20` : 'none',
                zIndex: 10,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="text-[6px] font-mono text-muted-foreground">≥ {THRESHOLD}</div>
              <div className="text-[8px] font-mono font-bold" style={{ color: routeColor || 'oklch(0.5 0.05 256)' }}>
                {routeColor ? (isAbove ? 'TRUE' : 'FALSE') : '...'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Output LED terminal */}
        <AnimatePresence>
          {showLED && (
            <motion.div
              className="absolute flex flex-col items-center gap-2"
              style={{
                right: 10,
                top: totalHeight / 2 - 40,
                zIndex: 15,
              }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {/* LED bulb */}
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, ${isAbove ? 'oklch(0.7 0.17 160 / 60%)' : 'oklch(0.65 0.2 15 / 60%)'}, ${isAbove ? 'oklch(0.7 0.17 160 / 10%)' : 'oklch(0.65 0.2 15 / 10%)'})`,
                  border: `2px solid ${isAbove ? 'oklch(0.7 0.17 160 / 60%)' : 'oklch(0.65 0.2 15 / 60%)'}`,
                  boxShadow: `0 0 30px ${isAbove ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.65 0.2 15 / 40%)'}`,
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: 2 }}
              >
                <span className="text-xl">
                  {VERDICT === 'approve' ? '✅' : VERDICT === 'deny' ? '❌' : '⚠️'}
                </span>
              </motion.div>

              {/* Verdict label */}
              <div className="text-center">
                <div className="text-xs font-bold" style={{ color: isAbove ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)' }}>
                  {VERDICT === 'approve' ? 'APPROVED' : VERDICT === 'deny' ? 'DENIED' : 'ESCALATED'}
                </div>
                <div className="text-sm font-bold font-mono" style={{ color: 'oklch(0.7 0.17 160)' }}>
                  {APPROVED_AMOUNT}
                </div>
                <div className="text-[7px] font-mono text-muted-foreground">
                  G={G_SCORE.toFixed(2)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Output terminal labels (right side) */}
        {!showLED && (
          <div className="absolute flex flex-col gap-2" style={{ right: 15, top: totalHeight / 2 - 40, zIndex: 5 }}>
            {['APPROVE', 'DENY', 'ESCALATE'].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'oklch(0.2 0.02 256)', border: '1px solid oklch(0.3 0.03 256)' }}
                />
                <span className="text-[7px] font-mono" style={{ color: 'oklch(0.4 0.03 256)' }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Confetti */}
      {showConfetti && Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: ['oklch(0.7 0.17 160)', 'oklch(0.8 0.16 80)', 'oklch(0.62 0.19 250)', 'oklch(0.7 0.15 195)'][i % 4],
            left: '75%', top: '40%',
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 250, opacity: 0, scale: 0 }}
          transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.3 }}
        />
      ))}

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option E — Circuit Board / Logic Gate
      </div>
    </div>
  );
}
