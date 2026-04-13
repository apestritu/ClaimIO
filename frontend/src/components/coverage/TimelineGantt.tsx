"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REASONING_CHECKS, GUARDRAIL_RULES, COVERAGE_RESULT } from './coverage-data';

interface TimelineGanttProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

// Timeline spans Jan 1 – Dec 31, 2024 = 366 days
const TOTAL_DAYS = 366;
const toPercent = (month: number, day: number) => {
  const daysInMonths = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
  return ((daysInMonths[month - 1] + day) / TOTAL_DAYS) * 100;
};

// Bar definitions
const POLICY_BAR = { start: toPercent(1, 1), end: toPercent(12, 31), label: 'Policy Window', color: 'oklch(0.62 0.19 250)' };
const TRIP_BAR = { start: toPercent(3, 12), end: toPercent(3, 20), label: 'Trip Dates', color: 'oklch(0.7 0.15 195)' };
const INCIDENT_PIN = { pos: toPercent(3, 15), label: 'Incident 03/15', color: 'oklch(0.65 0.2 15)' };
const DELAY_BAR = { start: toPercent(3, 15), end: toPercent(3, 17), label: 'Bag Delay 48h', color: 'oklch(0.8 0.16 80)' };

type Stage = 'bars' | 'checks' | 'guardrails' | 'result';

export function TimelineGantt({ onComplete, autoPlay = true }: TimelineGanttProps) {
  const [stage, setStage] = useState<Stage>('bars');
  const [showPolicy, setShowPolicy] = useState(false);
  const [showTrip, setShowTrip] = useState(false);
  const [showIncident, setShowIncident] = useState(false);
  const [showDelay, setShowDelay] = useState(false);
  const [checks, setChecks] = useState<number[]>([]);
  const [showFinancialBar, setShowFinancialBar] = useState(false);
  const [financialCheck, setFinancialCheck] = useState(false);
  const [guardrailIdx, setGuardrailIdx] = useState(-1);
  const [guardrailDone, setGuardrailDone] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [confValue, setConfValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Draw bars
    timers.push(setTimeout(() => setShowPolicy(true), 400));
    timers.push(setTimeout(() => setShowTrip(true), 1000));
    timers.push(setTimeout(() => setShowIncident(true), 1600));
    timers.push(setTimeout(() => setShowDelay(true), 2200));

    // Phase 2: Check overlaps
    const checkStart = 3200;
    timers.push(setTimeout(() => setStage('checks'), checkStart));

    // Check 0: Incident in trip window
    timers.push(setTimeout(() => setChecks(prev => [...prev, 0]), checkStart + 600));
    // Check 1: Incident in policy window
    timers.push(setTimeout(() => setChecks(prev => [...prev, 1]), checkStart + 1600));
    // Check 2: Delay ≥ 24h (ruler animation)
    timers.push(setTimeout(() => setChecks(prev => [...prev, 2]), checkStart + 2600));
    // Check 3: Financial bar chart
    timers.push(setTimeout(() => setShowFinancialBar(true), checkStart + 3400));
    timers.push(setTimeout(() => {
      setFinancialCheck(true);
      setChecks(prev => [...prev, 3]);
    }, checkStart + 4200));

    // Phase 3: Guardrails sweep
    const grStart = checkStart + 5000;
    timers.push(setTimeout(() => setStage('guardrails'), grStart));
    GUARDRAIL_RULES.forEach((_, i) => {
      timers.push(setTimeout(() => setGuardrailIdx(i), grStart + 400 + i * 600));
    });
    timers.push(setTimeout(() => setGuardrailDone(true), grStart + 400 + GUARDRAIL_RULES.length * 600 + 400));

    // Phase 4: Result
    const resStart = grStart + 400 + GUARDRAIL_RULES.length * 600 + 1200;
    timers.push(setTimeout(() => {
      setStage('result');
      setShowResult(true);
    }, resStart));
    timers.push(setTimeout(() => setConfValue(COVERAGE_RESULT.confidence), resStart + 500));
    timers.push(setTimeout(() => onComplete?.(), resStart + 3000));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  // Months for the timeline axis
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden px-8 gap-6">
      <AnimatePresence mode="wait">
        {stage !== 'result' ? (
          <motion.div
            key="timeline"
            className="w-full max-w-3xl"
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            {/* Title */}
            <div className="text-center mb-6">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
                📅 Coverage Timeline Analysis
              </span>
            </div>

            {/* Timeline container */}
            <div className="relative" style={{ height: 220 }}>
              {/* Month axis */}
              <div className="absolute bottom-0 left-0 right-0 h-8 flex">
                {months.map((m, i) => (
                  <div key={m} className="flex-1 text-center">
                    <div className="h-2 border-l" style={{ borderColor: 'oklch(0.3 0.03 256)' }} />
                    <span className="text-[7px] font-mono text-muted-foreground">{m}</span>
                  </div>
                ))}
              </div>

              {/* Timeline base line */}
              <div
                className="absolute left-0 right-0 h-px"
                style={{ bottom: 32, background: 'oklch(0.3 0.03 256)' }}
              />

              {/* Policy bar — row 0 (topmost) */}
              <AnimatePresence>
                {showPolicy && (
                  <motion.div
                    className="absolute h-6 rounded-md flex items-center justify-center"
                    style={{
                      left: `${POLICY_BAR.start}%`,
                      width: `${POLICY_BAR.end - POLICY_BAR.start}%`,
                      bottom: 120,
                      background: `${POLICY_BAR.color}20`,
                      border: `1px solid ${POLICY_BAR.color}40`,
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style-origin="left"
                  >
                    <span className="text-[7px] font-mono font-bold" style={{ color: POLICY_BAR.color }}>
                      {POLICY_BAR.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trip bar — row 1 */}
              <AnimatePresence>
                {showTrip && (
                  <motion.div
                    className="absolute h-6 rounded-md flex items-center justify-center"
                    style={{
                      left: `${TRIP_BAR.start}%`,
                      width: `${TRIP_BAR.end - TRIP_BAR.start}%`,
                      bottom: 88,
                      background: `${TRIP_BAR.color}25`,
                      border: `1px solid ${TRIP_BAR.color}50`,
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
                    <span className="text-[7px] font-mono font-bold" style={{ color: TRIP_BAR.color }}>
                      {TRIP_BAR.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Incident pin */}
              <AnimatePresence>
                {showIncident && (
                  <motion.div
                    className="absolute flex flex-col items-center"
                    style={{ left: `${INCIDENT_PIN.pos}%`, bottom: 32 }}
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                  >
                    <span className="text-[7px] font-mono font-bold mb-0.5" style={{ color: INCIDENT_PIN.color }}>
                      {INCIDENT_PIN.label}
                    </span>
                    <div className="w-px h-[54px]" style={{ background: `${INCIDENT_PIN.color}60` }} />
                    <div
                      className="w-3 h-3 rounded-full -mt-0.5"
                      style={{
                        background: INCIDENT_PIN.color,
                        boxShadow: `0 0 10px ${INCIDENT_PIN.color}60`,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Delay bar — row 2 */}
              <AnimatePresence>
                {showDelay && (
                  <motion.div
                    className="absolute h-5 rounded-md flex items-center justify-center"
                    style={{
                      left: `${DELAY_BAR.start}%`,
                      width: `${DELAY_BAR.end - DELAY_BAR.start}%`,
                      bottom: 56,
                      background: `${DELAY_BAR.color}25`,
                      border: `1px solid ${DELAY_BAR.color}50`,
                      minWidth: 60,
                    }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
                    <span className="text-[7px] font-mono font-bold" style={{ color: DELAY_BAR.color }}>
                      {DELAY_BAR.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Check brackets / highlights */}
              {checks.includes(0) && (
                <motion.div
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${TRIP_BAR.start}%`,
                    width: `${TRIP_BAR.end - TRIP_BAR.start}%`,
                    bottom: 145,
                    minWidth: 80,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <div className="px-2 py-0.5 rounded text-[7px] font-mono font-bold" style={{ background: 'oklch(0.7 0.17 160 / 15%)', color: 'oklch(0.7 0.17 160)', border: '1px solid oklch(0.7 0.17 160 / 30%)' }}>
                    ✅ In trip window
                  </div>
                </motion.div>
              )}

              {checks.includes(1) && (
                <motion.div
                  className="absolute flex items-center justify-center"
                  style={{ left: '50%', transform: 'translateX(-50%)', bottom: 168 }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <div className="px-2 py-0.5 rounded text-[7px] font-mono font-bold" style={{ background: 'oklch(0.7 0.17 160 / 15%)', color: 'oklch(0.7 0.17 160)', border: '1px solid oklch(0.7 0.17 160 / 30%)' }}>
                    ✅ In policy window
                  </div>
                </motion.div>
              )}

              {checks.includes(2) && (
                <motion.div
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${DELAY_BAR.start}%`,
                    width: `${DELAY_BAR.end - DELAY_BAR.start}%`,
                    bottom: 40,
                    minWidth: 80,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <div className="px-2 py-0.5 rounded text-[7px] font-mono font-bold" style={{ background: 'oklch(0.7 0.17 160 / 15%)', color: 'oklch(0.7 0.17 160)', border: '1px solid oklch(0.7 0.17 160 / 30%)' }}>
                    ✅ 48h ≥ 24h
                  </div>
                </motion.div>
              )}
            </div>

            {/* Financial bar chart (below timeline) */}
            <AnimatePresence>
              {showFinancialBar && (
                <motion.div
                  className="mt-6 flex items-end justify-center gap-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative w-16" style={{ height: 60 }}>
                      {/* Limit ceiling (dashed) */}
                      <div
                        className="absolute left-0 right-0 top-0 h-px border-t border-dashed"
                        style={{ borderColor: 'oklch(0.5 0.08 250)' }}
                      />
                      <span className="absolute -top-3 left-0 right-0 text-center text-[6px] font-mono" style={{ color: 'oklch(0.5 0.08 250)' }}>$2,000</span>

                      {/* Receipts bar */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 rounded-t-sm"
                        style={{
                          background: financialCheck ? 'oklch(0.7 0.17 160)' : 'oklch(0.7 0.17 160 / 60%)',
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: (487.3 / 2000) * 60 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="text-[7px] font-mono text-muted-foreground">$487.30</span>
                    <span className="text-[6px] font-mono text-muted-foreground">Receipts</span>
                  </div>

                  {financialCheck && (
                    <motion.div
                      className="px-2 py-0.5 rounded text-[7px] font-mono font-bold mb-4"
                      style={{ background: 'oklch(0.7 0.17 160 / 15%)', color: 'oklch(0.7 0.17 160)', border: '1px solid oklch(0.7 0.17 160 / 30%)' }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      ✅ Within limits
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Guardrails sweep */}
            {stage === 'guardrails' && (
              <motion.div
                className="mt-4 flex items-center justify-center gap-2 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-xs mr-2">🛡️</span>
                {GUARDRAIL_RULES.map((rule, i) => (
                  <motion.div
                    key={i}
                    className="px-2 py-0.5 rounded text-[7px] font-mono"
                    style={{
                      background: i <= guardrailIdx
                        ? (guardrailDone ? 'oklch(0.7 0.17 160 / 15%)' : 'oklch(0.8 0.16 80 / 15%)')
                        : 'oklch(0.2 0.02 256)',
                      color: i <= guardrailIdx
                        ? (guardrailDone ? 'oklch(0.7 0.17 160)' : 'oklch(0.8 0.16 80)')
                        : 'oklch(0.4 0.03 256)',
                      border: `1px solid ${i <= guardrailIdx
                        ? (guardrailDone ? 'oklch(0.7 0.17 160 / 30%)' : 'oklch(0.8 0.16 80 / 30%)')
                        : 'oklch(0.25 0.02 256)'}`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {i <= guardrailIdx ? (guardrailDone ? '✅' : '🔍') : '⏳'} {rule}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Result */
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
        Option B — Timeline / Gantt Chart
      </div>
    </div>
  );
}
