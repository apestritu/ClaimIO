"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MERGED_FACTS, REASONING_CHECKS, GUARDRAIL_RULES, COVERAGE_RESULT } from './coverage-data';

interface WarRoomProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'merge' | 'reasoning' | 'guardrails' | 'result';

// Positions for fact cards on the strategy table
const FACT_POSITIONS = [
  { x: 30, y: 30 },   // Policy — top left
  { x: 30, y: 100 },  // Trip — left
  { x: 30, y: 170 },  // Incident — left
  { x: 30, y: 240 },  // Bag delay — left
  { x: 380, y: 80 },  // Receipts — right
  { x: 380, y: 170 }, // Limits — right
];

// Connection pairs for laser scan lines
const CONNECTIONS = [
  { from: 2, to: 1, label: 'In trip window', pass: true },   // Incident → Trip
  { from: 2, to: 0, label: 'In policy window', pass: true },  // Incident → Policy
  { from: 3, to: 3, label: 'Delay ≥ 24h', pass: true, selfCheck: true },
  { from: 4, to: 5, label: 'Within limits', pass: true },     // Receipts → Limits
];

export function WarRoom({ onComplete, autoPlay = true }: WarRoomProps) {
  const [stage, setStage] = useState<Stage>('merge');
  const [visibleFacts, setVisibleFacts] = useState<number[]>([]);
  const [activeConnections, setActiveConnections] = useState<number[]>([]);
  const [resolvedConnections, setResolvedConnections] = useState<number[]>([]);
  const [shieldActive, setShieldActive] = useState(false);
  const [guardrailChecks, setGuardrailChecks] = useState<number[]>([]);
  const [shieldPass, setShieldPass] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [confValue, setConfValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Fact Merge — cards slide onto table
    MERGED_FACTS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleFacts(prev => [...prev, i]);
      }, 300 + i * 400));
    });

    // Phase 2: AI Reasoning — laser connections
    const reasoningStart = 300 + MERGED_FACTS.length * 400 + 600;
    timers.push(setTimeout(() => setStage('reasoning'), reasoningStart));

    CONNECTIONS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setActiveConnections(prev => [...prev, i]);
      }, reasoningStart + 400 + i * 1200));

      timers.push(setTimeout(() => {
        setResolvedConnections(prev => [...prev, i]);
      }, reasoningStart + 400 + i * 1200 + 700));
    });

    // Phase 3: Guard-rails — shield dome
    const guardrailStart = reasoningStart + 400 + CONNECTIONS.length * 1200 + 600;
    timers.push(setTimeout(() => {
      setStage('guardrails');
      setShieldActive(true);
    }, guardrailStart));

    GUARDRAIL_RULES.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setGuardrailChecks(prev => [...prev, i]);
      }, guardrailStart + 500 + i * 500));
    });

    timers.push(setTimeout(() => {
      setShieldPass(true);
    }, guardrailStart + 500 + GUARDRAIL_RULES.length * 500 + 400));

    // Phase 4: Result
    const resultStart = guardrailStart + 500 + GUARDRAIL_RULES.length * 500 + 1200;
    timers.push(setTimeout(() => {
      setStage('result');
      setShowResult(true);
    }, resultStart));

    timers.push(setTimeout(() => setConfValue(COVERAGE_RESULT.confidence), resultStart + 500));
    timers.push(setTimeout(() => onComplete?.(), resultStart + 3000));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Holographic table */}
      <AnimatePresence mode="wait">
        {stage !== 'result' && (
          <motion.div
            className="relative"
            style={{
              width: 600,
              height: 360,
              borderRadius: 16,
              background: 'oklch(0.1 0.02 250)',
              border: '1px solid oklch(0.25 0.08 250 / 40%)',
              boxShadow: '0 0 60px oklch(0.4 0.1 250 / 15%), inset 0 0 40px oklch(0.3 0.08 250 / 10%)',
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.08 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={360} stroke="oklch(0.6 0.1 250)" strokeWidth={0.5} />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={`h${i}`} x1={0} y1={i * 50} x2={600} y2={i * 50} stroke="oklch(0.6 0.1 250)" strokeWidth={0.5} />
              ))}
            </svg>

            {/* Ambient glow */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 40%, oklch(0.5 0.12 250 / 8%), transparent 70%)',
              }}
            />

            {/* Title */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
                ⚡ Strategy Table — Coverage Analysis
              </span>
            </div>

            {/* Column labels */}
            <div className="absolute top-6 left-8 text-[7px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.08 250 / 60%)' }}>
              Timeline & Events
            </div>
            <div className="absolute top-6 right-8 text-[7px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.08 250 / 60%)' }}>
              Financial Data
            </div>

            {/* Divider line */}
            <div
              className="absolute top-6 bottom-4 left-1/2 -translate-x-1/2 w-px"
              style={{ background: 'oklch(0.3 0.08 250 / 30%)' }}
            />

            {/* SVG connection layer */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5 }}>
              {activeConnections.map((idx) => {
                const conn = CONNECTIONS[idx];
                const isResolved = resolvedConnections.includes(idx);

                if (conn.selfCheck) {
                  // Self-check: circle around the fact
                  const pos = FACT_POSITIONS[conn.from];
                  return (
                    <g key={`conn-${idx}`}>
                      <motion.circle
                        cx={pos.x + 80}
                        cy={pos.y + 18}
                        r={25}
                        fill="none"
                        stroke={isResolved ? 'oklch(0.7 0.17 160)' : 'oklch(0.7 0.15 195)'}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.8 }}
                        transition={{ duration: 0.5 }}
                      />
                      {isResolved && (
                        <motion.text
                          x={pos.x + 80}
                          y={pos.y + 50}
                          textAnchor="middle"
                          fill="oklch(0.7 0.17 160)"
                          fontSize={7}
                          fontFamily="monospace"
                          fontWeight="bold"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          ✅ {conn.label}
                        </motion.text>
                      )}
                    </g>
                  );
                }

                const from = FACT_POSITIONS[conn.from];
                const to = FACT_POSITIONS[conn.to];
                const fromX = from.x + 160;
                const fromY = from.y + 18;
                const toX = to.x + (to.x > 300 ? 0 : 160);
                const toY = to.y + 18;

                return (
                  <g key={`conn-${idx}`}>
                    <motion.line
                      x1={fromX}
                      y1={fromY}
                      x2={toX}
                      y2={toY}
                      stroke={isResolved
                        ? (conn.pass ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)')
                        : 'oklch(0.7 0.15 195)'}
                      strokeWidth={isResolved ? 2 : 1}
                      strokeDasharray={isResolved ? 'none' : '6 4'}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: isResolved ? 0.9 : 0.5 }}
                      transition={{ duration: 0.6 }}
                    />
                    {isResolved && (
                      <motion.text
                        x={(fromX + toX) / 2}
                        y={(fromY + toY) / 2 - 8}
                        textAnchor="middle"
                        fill={conn.pass ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)'}
                        fontSize={7}
                        fontFamily="monospace"
                        fontWeight="bold"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {conn.pass ? '✅' : '❌'} {conn.label}
                      </motion.text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Fact cards */}
            <AnimatePresence>
              {visibleFacts.map((idx) => {
                const fact = MERGED_FACTS[idx];
                const pos = FACT_POSITIONS[idx];
                const fromLeft = pos.x < 300;
                return (
                  <motion.div
                    key={`fact-${idx}`}
                    className="absolute flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: 170,
                      background: `${fact.color}10`,
                      border: `1px solid ${fact.color}30`,
                      zIndex: 10,
                    }}
                    initial={{ opacity: 0, x: fromLeft ? -80 : 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                  >
                    <span className="text-sm">{fact.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[7px] font-mono text-muted-foreground">{fact.label}</div>
                      <div className="text-[9px] font-mono font-bold truncate" style={{ color: fact.color }}>{fact.value}</div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* AI Core orb (center, during reasoning) */}
            {stage === 'reasoning' && (
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle, oklch(0.6 0.15 250 / 30%), transparent)',
                  border: '2px solid oklch(0.6 0.15 250 / 50%)',
                  boxShadow: '0 0 40px oklch(0.6 0.15 250 / 25%)',
                  zIndex: 15,
                }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <motion.span
                  className="text-xl"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🧠
                </motion.span>
              </motion.div>
            )}

            {/* Shield dome (during guardrails) */}
            {stage === 'guardrails' && shieldActive && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  border: `2px solid ${shieldPass ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.5 0.1 250 / 30%)'}`,
                  boxShadow: shieldPass
                    ? 'inset 0 0 40px oklch(0.7 0.17 160 / 15%)'
                    : 'inset 0 0 30px oklch(0.5 0.1 250 / 10%)',
                  zIndex: 20,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Sweep lines */}
                {!shieldPass && (
                  <motion.div
                    className="absolute left-0 right-0 h-0.5"
                    style={{
                      background: 'linear-gradient(90deg, transparent, oklch(0.8 0.16 80), transparent)',
                    }}
                    animate={{ top: ['5%', '95%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                {/* Rule checks appearing */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
                  {guardrailChecks.map((idx) => (
                    <motion.div
                      key={idx}
                      className="px-2 py-0.5 rounded text-[7px] font-mono"
                      style={{
                        background: shieldPass ? 'oklch(0.7 0.17 160 / 15%)' : 'oklch(0.3 0.05 250 / 40%)',
                        color: shieldPass ? 'oklch(0.7 0.17 160)' : 'oklch(0.6 0.08 250)',
                        border: `1px solid ${shieldPass ? 'oklch(0.7 0.17 160 / 30%)' : 'oklch(0.35 0.05 250)'}`,
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      {shieldPass ? '✅' : '🔍'} {GUARDRAIL_RULES[idx]}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result card */}
      <AnimatePresence>
        {showResult && stage === 'result' && (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          >
            <motion.div
              className="rounded-2xl p-6 w-80"
              style={{
                background: 'oklch(0.14 0.02 256 / 95%)',
                border: '1px solid oklch(0.7 0.17 160 / 30%)',
                boxShadow: '0 0 50px oklch(0.7 0.17 160 / 15%), 0 12px 40px oklch(0 0 0 / 40%)',
              }}
            >
              <div className="text-center mb-4">
                <motion.div
                  className="text-3xl mb-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ delay: 0.2 }}
                >
                  ✅
                </motion.div>
                <div className="text-xs font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>COVERAGE APPROVED</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-2 py-1.5 rounded-lg" style={{ background: 'oklch(0.2 0.02 256)' }}>
                  <span className="text-[9px] font-mono text-muted-foreground">Amount</span>
                  <span className="text-sm font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>{COVERAGE_RESULT.amount}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1.5 rounded-lg" style={{ background: 'oklch(0.2 0.02 256)' }}>
                  <span className="text-[9px] font-mono text-muted-foreground">Confidence</span>
                  <span className="text-sm font-bold" style={{ color: 'oklch(0.7 0.15 195)' }}>{COVERAGE_RESULT.confidence}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-1.5 rounded-lg" style={{ background: 'oklch(0.2 0.02 256)' }}>
                  <span className="text-[9px] font-mono text-muted-foreground">Issues</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{COVERAGE_RESULT.issues}</span>
                </div>
              </div>
            </motion.div>

            {/* Confidence gauge */}
            <motion.div
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="relative w-32 h-16 overflow-hidden">
                <svg viewBox="0 0 120 65" className="w-full h-full">
                  <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="oklch(0.3 0.02 256)" strokeWidth="8" strokeLinecap="round" />
                  <motion.path
                    d="M 10 58 A 50 50 0 0 1 110 58"
                    fill="none"
                    stroke="oklch(0.7 0.17 160)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="157"
                    initial={{ strokeDashoffset: 157 }}
                    animate={{ strokeDashoffset: 157 * (1 - confValue) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
              </div>
              <span className="text-[9px] font-mono" style={{ color: 'oklch(0.7 0.17 160)' }}>
                {(confValue * 100).toFixed(0)}% confident
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option A — War Room / Strategy Table
      </div>
    </div>
  );
}
