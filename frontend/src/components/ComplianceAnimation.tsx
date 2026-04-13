"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry } from '@/lib/claim-data';

interface ComplianceAnimationProps {
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
}

const RECEIPT_AMOUNTS = ['$127.50', '$89.00', '$45.80', '$225.00'];
const SCAN_NAMES = ['A. JOHNSON', 'M. RODRIGUEZ', 'K. TANAKA', 'S. PATEL', 'J. SMITH', 'L. CHEN', 'R. MÜLLER', 'D. OKAFOR'];

export function ComplianceAnimation({ addLog, onComplete }: ComplianceAnimationProps) {
  const [sanctionPhase, setSanctionPhase] = useState<'scanning' | 'clear' | 'hit'>('scanning');
  const [fraudPhase, setFraudPhase] = useState<'idle' | 'scanning' | 'clear' | 'flagged'>('idle');
  const [scanLinePos, setScanLinePos] = useState(0);
  const [highlightedReceipt, setHighlightedReceipt] = useState(-1);
  const [showComplianceCard, setShowComplianceCard] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    addLog({ icon: '🛡️', text: 'Running compliance checks...' });
    addLog({ icon: '🔍', text: 'Sanctions screening: "John Smith"...' });

    // Sanctions scan line animation
    const scanInterval = setInterval(() => {
      setScanLinePos(p => (p + 1) % 100);
    }, 30);

    // Sanctions result
    const t1 = setTimeout(() => {
      clearInterval(scanInterval);
      setSanctionPhase('clear');
      addLog({ icon: '✅', text: 'No OFAC match (conf: 0.95)' });
    }, 2500);

    // Start fraud detection
    const t2 = setTimeout(() => {
      setFraudPhase('scanning');
      addLog({ icon: '🔍', text: 'Fraud analysis: checking receipt amounts...' });
      addLog({ icon: '→', text: RECEIPT_AMOUNTS.join(', ') });
    }, 1200);

    // Highlight receipts one by one
    const receiptTimers: ReturnType<typeof setTimeout>[] = [];
    RECEIPT_AMOUNTS.forEach((_, i) => {
      receiptTimers.push(setTimeout(() => {
        setHighlightedReceipt(i);
      }, 1800 + i * 500));
    });

    // Fraud result
    const t3 = setTimeout(() => {
      setFraudPhase('clear');
      setHighlightedReceipt(-1);
      addLog({ icon: '✅', text: 'No duplicates detected' });
      addLog({ icon: '📊', text: 'Fraud risk score: 0.20 (Low)' });
    }, 3500);

    // Show compliance card
    const t4 = setTimeout(() => {
      setShowComplianceCard(true);
    }, 4200);

    const t5 = setTimeout(onComplete, 5500);

    return () => {
      clearInterval(scanInterval);
      [t1, t2, t3, t4, t5, ...receiptTimers].forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-6">
      <div className="flex gap-8 w-full max-w-3xl">

        {/* ── LEFT: Sanctions Screening ── */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Sanctions Screening (OFAC)
          </div>

          <div className="relative w-full max-w-[240px]">
            {/* Shield scanner frame */}
            <motion.div
              className="relative w-full h-48 rounded-xl overflow-hidden flex flex-col items-center justify-center"
              style={{
                background: 'oklch(0.16 0.02 256)',
                border: `2px solid ${sanctionPhase === 'clear' ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.65 0.2 15 / 40%)'}`,
                boxShadow: sanctionPhase === 'scanning'
                  ? '0 0 30px oklch(0.65 0.2 15 / 20%)'
                  : sanctionPhase === 'clear'
                  ? '0 0 20px oklch(0.7 0.17 160 / 15%)'
                  : 'none',
              }}
            >
              {/* Matrix-rain name wall */}
              <div className="absolute inset-0 overflow-hidden opacity-20">
                {SCAN_NAMES.map((name, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-[7px] font-mono whitespace-nowrap"
                    style={{
                      color: sanctionPhase === 'clear' ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)',
                      left: `${(i % 3) * 35 + 5}%`,
                    }}
                    animate={{
                      y: [-20, 200],
                      opacity: [0, 0.6, 0],
                    }}
                    transition={{
                      duration: 2 + (i % 3) * 0.5,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'linear',
                    }}
                  >
                    {name}
                  </motion.div>
                ))}
              </div>

              {/* Scan beam */}
              {sanctionPhase === 'scanning' && (
                <motion.div
                  className="absolute inset-x-0 h-0.5"
                  style={{
                    background: 'oklch(0.65 0.2 15)',
                    boxShadow: '0 0 15px oklch(0.65 0.2 15)',
                    top: `${scanLinePos}%`,
                  }}
                />
              )}

              {/* Person silhouette */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <motion.div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    background: 'oklch(0.22 0.02 256)',
                    border: `2px solid ${sanctionPhase === 'clear' ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.4 0.02 256)'}`,
                  }}
                  animate={sanctionPhase === 'scanning' ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  👤
                </motion.div>
                <span className="text-[10px] font-mono font-bold text-foreground">John Smith</span>
              </div>

              {/* Result badge */}
              <AnimatePresence>
                {sanctionPhase === 'clear' && (
                  <motion.div
                    className="absolute bottom-3 px-3 py-1 rounded-full text-[9px] font-bold"
                    style={{
                      background: 'oklch(0.7 0.17 160 / 15%)',
                      border: '1px solid oklch(0.7 0.17 160 / 40%)',
                      color: 'oklch(0.7 0.17 160)',
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    ✅ NO MATCH — 0.95
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT: Fraud Detection ── */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Fraud Detection
          </div>

          <div
            className="relative w-full max-w-[240px] h-48 rounded-xl overflow-hidden flex flex-col items-center justify-center gap-3"
            style={{
              background: 'oklch(0.16 0.02 256)',
              border: `2px solid ${fraudPhase === 'clear' ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.35 0.02 256)'}`,
              boxShadow: fraudPhase === 'clear' ? '0 0 20px oklch(0.7 0.17 160 / 15%)' : 'none',
            }}
          >
            {/* Receipt columns */}
            <div className="flex gap-3 items-end justify-center">
              {RECEIPT_AMOUNTS.map((amt, i) => {
                const height = 30 + parseFloat(amt.replace('$', '')) / 5;
                const isHighlighted = highlightedReceipt === i;
                const isDone = fraudPhase === 'clear';
                return (
                  <motion.div
                    key={amt}
                    className="flex flex-col items-center gap-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <motion.div
                      className="w-10 rounded-md flex items-center justify-center"
                      style={{
                        height: `${height}px`,
                        background: isDone
                          ? 'oklch(0.7 0.17 160 / 15%)'
                          : isHighlighted
                          ? 'oklch(0.8 0.16 80 / 25%)'
                          : 'oklch(0.25 0.02 256)',
                        border: `1px solid ${isDone ? 'oklch(0.7 0.17 160 / 40%)' : isHighlighted ? 'oklch(0.8 0.16 80 / 60%)' : 'oklch(0.35 0.02 256)'}`,
                        boxShadow: isHighlighted ? '0 0 15px oklch(0.8 0.16 80 / 30%)' : 'none',
                      }}
                      animate={isHighlighted ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="text-[7px] font-mono font-bold text-foreground">{amt}</span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Magnifying glass sweep */}
            {fraudPhase === 'scanning' && (
              <motion.div
                className="absolute text-xl"
                animate={{ x: [-80, 80] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ top: '35%' }}
              >
                🔍
              </motion.div>
            )}

            {/* Fraud result */}
            <AnimatePresence>
              {fraudPhase === 'clear' && (
                <motion.div
                  className="px-3 py-1 rounded-full text-[9px] font-bold"
                  style={{
                    background: 'oklch(0.7 0.17 160 / 15%)',
                    border: '1px solid oklch(0.7 0.17 160 / 40%)',
                    color: 'oklch(0.7 0.17 160)',
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  ✅ Low Risk: 0.20
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Compliance Summary Card ── */}
      <AnimatePresence>
        {showComplianceCard && (
          <motion.div
            className="rounded-xl px-6 py-3 flex items-center gap-6"
            style={{
              background: 'oklch(0.16 0.02 256 / 80%)',
              border: '1px solid oklch(0.7 0.17 160 / 30%)',
              boxShadow: '0 0 25px oklch(0.7 0.17 160 / 10%)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0, y: 20, scaleX: 0.8 }}
            animate={{ opacity: 1, y: 0, scaleX: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🛡️</span>
              <span className="text-[9px] font-mono">Sanctions:</span>
              <span className="text-[9px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>CLEAR (0.95)</span>
            </div>
            <div className="w-px h-4" style={{ background: 'oklch(0.4 0.02 256)' }} />
            <div className="flex items-center gap-2">
              <span className="text-sm">🔍</span>
              <span className="text-[9px] font-mono">Fraud Risk:</span>
              <span className="text-[9px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>LOW (0.20)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
