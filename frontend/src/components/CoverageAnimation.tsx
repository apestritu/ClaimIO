"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry } from '@/lib/claim-data';
import type { CoverageAgentData } from '@/lib/agent-data-mapper';

interface CoverageAnimationProps {
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
  agentData?: CoverageAgentData;
}

interface ReasoningQuestion {
  icon: string;
  text: string;
  result: '✅' | '⚠️';
}

const MERGED_FACTS = [
  { label: 'Policy', value: '01/01/2024 → 12/31/2024', icon: '📋', color: 'oklch(0.62 0.19 250)' },
  { label: 'Trip', value: '03/12 → 03/20', icon: '✈️', color: 'oklch(0.7 0.15 195)' },
  { label: 'Incident', value: '03/15', icon: '📅', color: 'oklch(0.62 0.19 250)' },
  { label: 'Bag delay', value: '48h', icon: '🧳', color: 'oklch(0.8 0.16 80)' },
  { label: 'Total receipts', value: '$487.30', icon: '💰', color: 'oklch(0.7 0.17 160)' },
  { label: 'Limits', value: '$200/day travel, $200 baggage', icon: '🛡️', color: 'oklch(0.8 0.16 80)' },
];

const QUESTIONS: ReasoningQuestion[] = [
  { icon: '📅', text: 'Incident in trip window?', result: '✅' },
  { icon: '📋', text: 'Incident in policy window?', result: '✅' },
  { icon: '🧳', text: 'Bag delay ≥ 24h?', result: '✅' },
  { icon: '💰', text: 'Receipts ≤ limits?', result: '✅' },
];

type Stage = 'merge' | 'reasoning' | 'guardrails' | 'result';

export function CoverageAnimation({ addLog, onComplete, agentData }: CoverageAnimationProps) {
  const mergedFacts = agentData?.mergedFacts ?? MERGED_FACTS;
  const questions = agentData?.questions ?? QUESTIONS;
  const covConfidence = agentData?.coverageConfidence ?? 0.82;
  const approvedAmt = agentData ? `$${agentData.approvedAmount.toFixed(2)}` : '$487.30';
  const [stage, setStage] = useState<Stage>('merge');
  const [mergedVisible, setMergedVisible] = useState(0);
  const [showMergedCard, setShowMergedCard] = useState(false);
  const [resolvedQuestions, setResolvedQuestions] = useState(0);
  const [showShield, setShowShield] = useState(false);
  const [shieldPass, setShieldPass] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [confidenceValue, setConfidenceValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    addLog({ icon: '🔀', text: `Merging facts from ${mergedFacts.length} sources...` });

    // Part A — Fact Merge (3s)
    const mergeTimers: ReturnType<typeof setTimeout>[] = [];
    mergedFacts.forEach((fact, i) => {
      mergeTimers.push(setTimeout(() => {
        setMergedVisible(i + 1);
        if (i < 3) addLog({ icon: '📋', text: `${fact.label}: ${fact.value}` });
      }, 250 + i * 180));
    });

    const t1 = setTimeout(() => {
      setShowMergedCard(true);
    }, 250 + mergedFacts.length * 180 + 150);

    // Part B — GPT Reasoning (4s)
    const t2 = setTimeout(() => {
      setStage('reasoning');
      addLog({ icon: '🧠', text: 'GPT-4.1 coverage reasoning...' });
    }, 1500);

    const questionTimers: ReturnType<typeof setTimeout>[] = [];
    questions.forEach((q, i) => {
      questionTimers.push(setTimeout(() => {
        setResolvedQuestions(i + 1);
        addLog({ icon: q.result, text: q.text.replace('?', '') });
      }, 1900 + i * 500));
    });

    // Part C — Guard-Rails (2s)
    const t3 = setTimeout(() => {
      setStage('guardrails');
      setShowShield(true);
      addLog({ icon: '🛡️', text: 'Running guard-rails...' });
    }, 1900 + questions.length * 500 + 250);

    const t4 = setTimeout(() => {
      setShieldPass(true);
      addLog({ icon: '✅', text: 'All rules passed' });
    }, 1900 + questions.length * 500 + 1000);

    // Part D — Result (2s)
    const t5 = setTimeout(() => {
      setStage('result');
      setShowResult(true);
      addLog({ icon: '📊', text: `Coverage confidence: ${covConfidence.toFixed(2)} | Approved: ${approvedAmt}` });
    }, 1900 + questions.length * 500 + 1500);

    const t6 = setTimeout(() => {
      setConfidenceValue(covConfidence);
    }, 1900 + questions.length * 500 + 1800);

    const t7 = setTimeout(onComplete, 1900 + questions.length * 500 + 3000);

    return () => {
      mergeTimers.forEach(clearTimeout);
      questionTimers.forEach(clearTimeout);
      [t1, t2, t3, t4, t5, t6, t7].forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-6">

      {/* ── PART A: FACT MERGE ── */}
      {stage === 'merge' && (
        <motion.div
          className="flex flex-col items-center gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Scattered bubbles → merged card */}
          {!showMergedCard ? (
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {mergedFacts.slice(0, mergedVisible).map((fact, i) => (
                <motion.div
                  key={fact.label}
                  className="px-2.5 py-1 rounded-full text-[9px] font-mono"
                  style={{
                    background: `${fact.color}15`,
                    border: `1px solid ${fact.color}40`,
                    color: fact.color,
                  }}
                  initial={{ opacity: 0, scale: 0.3, x: (i % 2 === 0 ? -50 : 50), y: -30 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  {fact.icon} <span className="font-bold">{fact.value}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="rounded-xl p-4 w-72"
              style={{
                background: 'oklch(0.18 0.02 256 / 80%)',
                border: '1px solid oklch(0.8 0.16 80 / 30%)',
                boxShadow: '0 8px 30px oklch(0 0 0 / 30%)',
                backdropFilter: 'blur(12px)',
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="text-[10px] font-bold text-amber mb-2">📋 Merged Facts</div>
              {mergedFacts.map((fact) => (
                <div key={fact.label} className="flex items-center gap-2 py-0.5">
                  <span className="text-xs">{fact.icon}</span>
                  <span className="text-[8px] font-mono text-muted-foreground">{fact.label}:</span>
                  <span className="text-[8px] font-mono font-bold text-foreground">{fact.value}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ── PART B: GPT REASONING ── */}
      {stage === 'reasoning' && (
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Merged card (left) */}
          <motion.div
            className="rounded-xl p-3 w-56 shrink-0"
            style={{
              background: 'oklch(0.18 0.02 256 / 80%)',
              border: '1px solid oklch(0.8 0.16 80 / 30%)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ x: 50 }}
            animate={{ x: 0 }}
          >
            <div className="text-[9px] font-bold text-amber mb-1.5">📋 Merged Facts</div>
            {mergedFacts.map((fact) => (
              <div key={fact.label} className="flex items-center gap-1.5 py-0.5">
                <span className="text-[10px]">{fact.icon}</span>
                <span className="text-[7px] font-mono text-muted-foreground">{fact.label}:</span>
                <span className="text-[7px] font-mono font-bold text-foreground">{fact.value}</span>
              </div>
            ))}
          </motion.div>

          {/* AI Thinking visualization (center) */}
          <div className="relative flex items-center justify-center" style={{ width: 420, height: 400, minWidth: 420 }}>
            {/* Central brain */}
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center z-10"
              style={{
                background: 'radial-gradient(circle, oklch(0.8 0.16 80 / 30%), oklch(0.8 0.16 80 / 5%))',
                border: '2px solid oklch(0.8 0.16 80 / 50%)',
                boxShadow: '0 0 30px oklch(0.8 0.16 80 / 20%)',
              }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-3xl">⚖️</span>
            </motion.div>

            {/* Orbiting questions */}
            {questions.map((q, i) => {
              const angle = (i / questions.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 160;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isResolved = i < resolvedQuestions;

              return (
                <motion.div
                  key={q.text}
                  className="absolute flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-mono whitespace-nowrap"
                  style={{
                    background: isResolved
                      ? (q.result === '✅' ? 'oklch(0.7 0.17 160 / 15%)' : 'oklch(0.8 0.16 80 / 15%)')
                      : 'oklch(0.25 0.02 256 / 60%)',
                    border: `1px solid ${isResolved
                      ? (q.result === '✅' ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.8 0.16 80 / 40%)')
                      : 'oklch(0.35 0.02 256)'}`,
                    color: isResolved
                      ? (q.result === '✅' ? 'oklch(0.7 0.17 160)' : 'oklch(0.8 0.16 80)')
                      : 'oklch(0.5 0.02 256)',
                  }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    x,
                    y,
                    scale: isResolved ? 1.05 : 1,
                  }}
                  transition={{
                    delay: i * 0.15,
                    type: 'spring',
                    stiffness: 150,
                    damping: 15,
                  }}
                >
                  <span>{isResolved ? q.result : q.icon}</span>
                  <span>{q.text}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Policy card (right) */}
          <motion.div
            className="rounded-xl p-3 w-40 shrink-0 flex flex-col items-center gap-2"
            style={{
              background: 'oklch(0.18 0.02 256 / 80%)',
              border: '1px solid oklch(0.62 0.19 250 / 30%)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-2xl">📋</span>
            <span className="text-[9px] font-bold" style={{ color: 'oklch(0.62 0.19 250)' }}>Policy Document</span>
            <span className="text-[7px] font-mono text-muted-foreground">TRV-2024-8841</span>
          </motion.div>
        </motion.div>
      )}

      {/* ── PART C: GUARD-RAILS ── */}
      {stage === 'guardrails' && (
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {showShield && (
              <motion.div
                className="relative w-24 h-24 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {/* Shield icon */}
                <motion.div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                  style={{
                    background: shieldPass
                      ? 'radial-gradient(circle, oklch(0.7 0.17 160 / 20%), transparent)'
                      : 'radial-gradient(circle, oklch(0.5 0.02 256 / 20%), transparent)',
                    border: `2px solid ${shieldPass ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.5 0.02 256 / 30%)'}`,
                    boxShadow: shieldPass ? '0 0 30px oklch(0.7 0.17 160 / 25%)' : 'none',
                  }}
                  animate={shieldPass ? {} : { scale: [1, 1.03, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {shieldPass ? '✅' : '🛡️'}
                </motion.div>

                {/* Scanning line */}
                {!shieldPass && (
                  <motion.div
                    className="absolute inset-x-0 h-0.5 rounded-full"
                    style={{
                      background: 'oklch(0.8 0.16 80)',
                      boxShadow: '0 0 10px oklch(0.8 0.16 80)',
                    }}
                    animate={{ top: ['10%', '90%'] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            className="text-[10px] font-mono"
            style={{ color: shieldPass ? 'oklch(0.7 0.17 160)' : 'oklch(0.5 0.02 256)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {shieldPass ? '✅ All deterministic rules passed' : '🛡️ Running guard-rail checks...'}
          </motion.p>
        </motion.div>
      )}

      {/* ── PART D: RESULT ── */}
      {stage === 'result' && showResult && (
        <motion.div
          className="flex flex-col items-center gap-5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        >
          {/* Result card */}
          <motion.div
            className="rounded-2xl p-6 w-80"
            style={{
              background: 'oklch(0.16 0.02 256 / 90%)',
              border: '1px solid oklch(0.7 0.17 160 / 30%)',
              boxShadow: '0 12px 50px oklch(0 0 0 / 40%), 0 0 30px oklch(0.7 0.17 160 / 10%)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground">Meets Thresholds</div>
                  <div className="text-sm font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>YES</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground">Approved Amount</div>
                  <div className="text-sm font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>$487.30</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground">Coverage Confidence</div>
                  <div className="text-sm font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>0.82</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground">Issues</div>
                  <div className="text-xs font-mono text-muted-foreground">none</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Confidence gauge */}
          <motion.div
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="relative w-36 h-18 overflow-hidden">
              <svg viewBox="0 0 120 65" className="w-full h-full">
                <path
                  d="M 10 58 A 50 50 0 0 1 110 58"
                  fill="none"
                  stroke="oklch(0.3 0.02 256)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <motion.path
                  d="M 10 58 A 50 50 0 0 1 110 58"
                  fill="none"
                  stroke={confidenceValue >= 0.8 ? 'oklch(0.7 0.17 160)' : confidenceValue >= 0.6 ? 'oklch(0.8 0.16 80)' : 'oklch(0.65 0.2 15)'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="157"
                  initial={{ strokeDashoffset: 157 }}
                  animate={{ strokeDashoffset: 157 * (1 - confidenceValue) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">
              Coverage: <span className="font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>{(confidenceValue * 100).toFixed(0)}%</span>
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
