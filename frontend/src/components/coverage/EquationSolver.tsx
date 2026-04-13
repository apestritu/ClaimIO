"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COVERAGE_RESULT } from './coverage-data';

interface EquationSolverProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

interface ProofLine {
  type: 'given' | 'derivation' | 'result';
  text: string;
  check?: '✅' | '❌';
  verified?: boolean;
}

const PROOF_LINES: ProofLine[] = [
  { type: 'given', text: 'Given: Policy 01/01/2024 → 12/31/2024' },
  { type: 'given', text: 'Given: Trip 03/12 → 03/20' },
  { type: 'given', text: 'Given: Incident 03/15' },
  { type: 'given', text: 'Given: Bag delay 48h' },
  { type: 'given', text: 'Given: Receipts $487.30' },
  { type: 'given', text: 'Given: Limits $200/day × 9 + $200 = $2,000' },
  { type: 'derivation', text: '03/12 ≤ 03/15 ≤ 03/20 → Incident within trip', check: '✅' },
  { type: 'derivation', text: '01/01 ≤ 03/15 ≤ 12/31 → Incident within policy', check: '✅' },
  { type: 'derivation', text: '48h ≥ 24h → Bag delay qualifies', check: '✅' },
  { type: 'derivation', text: '$487.30 ≤ $2,000 → Within limits', check: '✅' },
  { type: 'result', text: '∴ APPROVED — $487.30  (conf: 0.82)' },
];

export function EquationSolver({ onComplete, autoPlay = true }: EquationSolverProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [verifiedLines, setVerifiedLines] = useState<number[]>([]);
  const [showFinalBox, setShowFinalBox] = useState(false);
  const [showResultCard, setShowResultCard] = useState(false);
  const [confValue, setConfValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: AI pen writes lines one by one
    PROOF_LINES.forEach((line, i) => {
      const delay = line.type === 'given' ? 500 : 800;
      const start = 600 + i * delay;
      timers.push(setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
      }, start));
    });

    // Phase 2: Red pen verifies derivations
    const verifyStart = 600 + PROOF_LINES.length * 600 + 800;
    const derivationIndices = PROOF_LINES
      .map((l, i) => l.type === 'derivation' ? i : -1)
      .filter(i => i >= 0);

    derivationIndices.forEach((lineIdx, i) => {
      timers.push(setTimeout(() => {
        setVerifiedLines(prev => [...prev, lineIdx]);
      }, verifyStart + i * 700));
    });

    // Phase 3: Box around result
    const boxStart = verifyStart + derivationIndices.length * 700 + 600;
    timers.push(setTimeout(() => setShowFinalBox(true), boxStart));

    // Phase 4: Fade to result card
    timers.push(setTimeout(() => setShowResultCard(true), boxStart + 1500));
    timers.push(setTimeout(() => setConfValue(COVERAGE_RESULT.confidence), boxStart + 2000));
    timers.push(setTimeout(() => onComplete?.(), boxStart + 4000));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {!showResultCard ? (
          <motion.div
            key="whiteboard"
            className="relative rounded-xl overflow-hidden"
            style={{
              width: 620,
              minHeight: 400,
              background: 'oklch(0.12 0.015 250)',
              border: '2px solid oklch(0.25 0.04 250 / 50%)',
              boxShadow: '0 8px 50px oklch(0 0 0 / 50%), inset 0 1px 0 oklch(0.2 0.03 250 / 30%)',
            }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.5 }}
          >
            {/* Glass whiteboard reflection */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, oklch(0.3 0.05 250 / 5%) 0%, transparent 50%)',
              }}
            />

            {/* Header strip */}
            <div
              className="px-4 py-2 flex items-center gap-2"
              style={{
                background: 'oklch(0.15 0.02 250)',
                borderBottom: '1px solid oklch(0.25 0.04 250 / 30%)',
              }}
            >
              <span className="text-sm">📐</span>
              <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: 'oklch(0.6 0.08 250)' }}>
                Coverage Reasoning — Mathematical Proof
              </span>
            </div>

            {/* Proof body */}
            <div className="px-6 py-4 space-y-1">
              {PROOF_LINES.map((line, i) => {
                if (!visibleLines.includes(i)) return null;

                const isGiven = line.type === 'given';
                const isDerivation = line.type === 'derivation';
                const isResult = line.type === 'result';
                const isVerified = verifiedLines.includes(i);

                return (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 py-1 relative"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Line number */}
                    <span className="text-[8px] font-mono w-4 text-right shrink-0" style={{ color: 'oklch(0.4 0.04 250)' }}>
                      {i + 1}.
                    </span>

                    {/* Content */}
                    <div className="flex-1 relative">
                      <span
                        className={`text-[11px] font-mono ${isResult ? 'font-bold' : ''}`}
                        style={{
                          color: isGiven
                            ? 'oklch(0.65 0.08 195)'
                            : isDerivation
                              ? 'oklch(0.75 0.12 80)'
                              : 'oklch(0.8 0.15 160)',
                        }}
                      >
                        {line.text}
                      </span>

                      {/* Verification underline */}
                      {isDerivation && isVerified && (
                        <motion.div
                          className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full"
                          style={{
                            background: line.check === '✅'
                              ? 'oklch(0.7 0.17 160)'
                              : 'oklch(0.65 0.2 15)',
                          }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          style-origin="left"
                        />
                      )}

                      {/* Final box */}
                      {isResult && showFinalBox && (
                        <motion.div
                          className="absolute -inset-x-2 -inset-y-1 rounded-md pointer-events-none"
                          style={{
                            border: '2px solid oklch(0.7 0.17 160)',
                            boxShadow: '0 0 15px oklch(0.7 0.17 160 / 25%)',
                          }}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                        />
                      )}
                    </div>

                    {/* Check mark */}
                    {isDerivation && line.check && (
                      <motion.span
                        className="text-sm shrink-0"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: isVerified ? 1 : 0.3,
                          scale: isVerified ? 1 : 0.8,
                        }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        {line.check}
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}

              {/* Writing cursor indicator */}
              {visibleLines.length < PROOF_LINES.length && (
                <motion.div
                  className="flex items-center gap-2 mt-1"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <span className="text-[8px] font-mono w-4" />
                  <div className="w-2 h-3 rounded-sm" style={{ background: 'oklch(0.7 0.15 195)' }} />
                </motion.div>
              )}

              {/* Verification indicator */}
              {visibleLines.length === PROOF_LINES.length && verifiedLines.length < 4 && (
                <motion.div
                  className="flex items-center gap-2 mt-3 pt-2"
                  style={{ borderTop: '1px solid oklch(0.25 0.03 256 / 40%)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'oklch(0.65 0.2 15)' }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                  <span className="text-[8px] font-mono" style={{ color: 'oklch(0.65 0.2 15)' }}>
                    Verifying derivations...
                  </span>
                </motion.div>
              )}
            </div>

            {/* Side decorations — mathematical symbols */}
            <div className="absolute top-12 right-3 flex flex-col gap-1 opacity-10">
              {['∀', '∃', '⊢', '⊨', '∧', '∨'].map((sym) => (
                <span key={sym} className="text-xs font-mono text-foreground">{sym}</span>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Result card */
          <motion.div
            key="result"
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
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
                <motion.div className="text-3xl mb-1" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.2 }}>
                  ✅
                </motion.div>
                <div className="text-xs font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>Q.E.D. — COVERAGE APPROVED</div>
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
                  <span className="text-[9px] font-mono text-muted-foreground">Checks Passed</span>
                  <span className="text-sm font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>4/4</span>
                </div>
              </div>
            </motion.div>

            <motion.div className="relative w-32 h-16 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option D — Equation Solver / Math Proof
      </div>
    </div>
  );
}
