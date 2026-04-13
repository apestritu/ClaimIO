"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIMANT_NAME, RECEIPT_AMOUNTS, WATCHLIST_NAMES, COMPLIANCE_RESULT } from './compliance-data';

interface AirportSecurityProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type SanctionStage = 'idle' | 'conveyor' | 'scanning' | 'clear' | 'hit';
type FraudStage = 'idle' | 'conveyor' | 'xray' | 'clear' | 'flagged';

export function AirportSecurity({ onComplete, autoPlay = true }: AirportSecurityProps) {
  const [sanctionStage, setSanctionStage] = useState<SanctionStage>('idle');
  const [fraudStage, setFraudStage] = useState<FraudStage>('idle');
  const [scrollIdx, setScrollIdx] = useState(0);
  const [scannedReceipts, setScannedReceipts] = useState<number[]>([]);
  const [clearedReceipts, setClearedReceipts] = useState<number[]>([]);
  const [showBadge, setShowBadge] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // LEFT LANE: Sanctions
    timers.push(setTimeout(() => setSanctionStage('conveyor'), 400));
    timers.push(setTimeout(() => setSanctionStage('scanning'), 1200));

    // Scroll watchlist names
    const scrollInterval = setInterval(() => {
      setScrollIdx(prev => prev + 1);
    }, 200);
    timers.push(setTimeout(() => clearInterval(scrollInterval), 3500) as unknown as ReturnType<typeof setTimeout>);

    timers.push(setTimeout(() => {
      clearInterval(scrollInterval);
      setSanctionStage(COMPLIANCE_RESULT.sanctionsClear ? 'clear' : 'hit');
    }, 3500));

    // RIGHT LANE: Fraud
    timers.push(setTimeout(() => setFraudStage('conveyor'), 800));
    timers.push(setTimeout(() => setFraudStage('xray'), 1600));

    RECEIPT_AMOUNTS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setScannedReceipts(prev => [...prev, i]);
      }, 2000 + i * 600));

      timers.push(setTimeout(() => {
        setClearedReceipts(prev => [...prev, i]);
      }, 2000 + i * 600 + 400));
    });

    timers.push(setTimeout(() => {
      setFraudStage(COMPLIANCE_RESULT.hasDuplicates ? 'flagged' : 'clear');
    }, 2000 + RECEIPT_AMOUNTS.length * 600 + 600));

    // Badge
    timers.push(setTimeout(() => setShowBadge(true), 4800));
    timers.push(setTimeout(() => onComplete?.(), 6500));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(scrollInterval);
    };
  }, [autoPlay, onComplete]);

  const sanctionColor = sanctionStage === 'clear' ? 'oklch(0.7 0.17 160)' : sanctionStage === 'hit' ? 'oklch(0.65 0.2 15)' : 'oklch(0.5 0.08 250)';
  const fraudColor = fraudStage === 'clear' ? 'oklch(0.7 0.17 160)' : fraudStage === 'flagged' ? 'oklch(0.65 0.2 15)' : 'oklch(0.5 0.08 250)';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden gap-6">
      {/* Title */}
      <motion.div
        className="text-[10px] font-mono uppercase tracking-[0.2em]"
        style={{ color: 'oklch(0.6 0.1 250)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        ✈️ Airport Security — Compliance Check
      </motion.div>

      <div className="flex gap-8 w-full max-w-3xl px-4">
        {/* ── LEFT LANE: Sanctions (Identity Check) ── */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.06 250 / 70%)' }}>
            🛂 Lane 1 — Identity Check
          </div>

          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{
              height: 280,
              background: 'oklch(0.12 0.02 256)',
              border: `1px solid oklch(0.25 0.04 256)`,
            }}
          >
            {/* Conveyor belt track */}
            <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'oklch(0.18 0.03 256)' }}>
              <motion.div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, oklch(0.25 0.03 256) 0px, oklch(0.25 0.03 256) 2px, transparent 2px, transparent 20px)',
                }}
                animate={{ x: [0, -20] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Passport card on conveyor */}
            <AnimatePresence>
              {sanctionStage !== 'idle' && (
                <motion.div
                  className="absolute bottom-10 flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
                  style={{
                    background: 'oklch(0.2 0.03 250)',
                    border: `1px solid ${sanctionColor}40`,
                    boxShadow: sanctionStage === 'clear' || sanctionStage === 'hit'
                      ? `0 0 20px ${sanctionColor}30`
                      : 'none',
                  }}
                  initial={{ x: -120, opacity: 0 }}
                  animate={{
                    x: sanctionStage === 'conveyor' ? 20
                      : sanctionStage === 'scanning' ? 80
                      : 140,
                    opacity: 1,
                  }}
                  transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                >
                  <span className="text-lg">🛂</span>
                  <span className="text-[8px] font-mono font-bold text-foreground">{CLAIMANT_NAME}</span>

                  {/* Stamp */}
                  {(sanctionStage === 'clear' || sanctionStage === 'hit') && (
                    <motion.div
                      className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[7px] font-bold"
                      style={{
                        background: sanctionStage === 'clear' ? 'oklch(0.7 0.17 160 / 25%)' : 'oklch(0.65 0.2 15 / 25%)',
                        color: sanctionColor,
                        border: `1px solid ${sanctionColor}50`,
                      }}
                      initial={{ scale: 2.5, opacity: 0, rotate: -15 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                    >
                      {sanctionStage === 'clear' ? '✅ CLEARED' : '🚨 FLAGGED'}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scanner tunnel */}
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 w-[70%] rounded-lg overflow-hidden"
              style={{
                height: 140,
                background: 'oklch(0.1 0.015 256)',
                border: `2px solid ${sanctionStage === 'scanning' ? 'oklch(0.65 0.2 15 / 50%)' : 'oklch(0.25 0.04 256)'}`,
                boxShadow: sanctionStage === 'scanning' ? '0 0 20px oklch(0.65 0.2 15 / 15%)' : 'none',
              }}
            >
              {/* Header */}
              <div className="px-2 py-1 flex items-center justify-between" style={{ borderBottom: '1px solid oklch(0.2 0.03 256)' }}>
                <span className="text-[6px] font-mono uppercase" style={{ color: 'oklch(0.5 0.06 250)' }}>OFAC Watchlist Scanner</span>
                {sanctionStage === 'scanning' && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'oklch(0.65 0.2 15)' }}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Scrolling watchlist */}
              <div className="px-2 py-1 overflow-hidden h-[100px] relative">
                {sanctionStage === 'scanning' && (
                  <motion.div
                    className="flex flex-col gap-0.5"
                    animate={{ y: -(scrollIdx % WATCHLIST_NAMES.length) * 12 }}
                    transition={{ duration: 0.15 }}
                  >
                    {[...WATCHLIST_NAMES, ...WATCHLIST_NAMES, ...WATCHLIST_NAMES].map((name, i) => (
                      <div
                        key={i}
                        className="text-[7px] font-mono px-1 py-0.5 rounded"
                        style={{
                          color: name === 'J. SMITH' ? 'oklch(0.8 0.16 80)' : 'oklch(0.45 0.04 256)',
                          background: name === 'J. SMITH' ? 'oklch(0.8 0.16 80 / 10%)' : 'transparent',
                        }}
                      >
                        {name}
                      </div>
                    ))}
                  </motion.div>
                )}
                {sanctionStage === 'clear' && (
                  <motion.div
                    className="flex items-center justify-center h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-[9px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>
                      ✅ No match in 12M+ records
                    </span>
                  </motion.div>
                )}

                {/* Scan sweep */}
                {sanctionStage === 'scanning' && (
                  <motion.div
                    className="absolute left-0 right-0 h-[1px]"
                    style={{ background: 'oklch(0.65 0.2 15)', boxShadow: '0 0 8px oklch(0.65 0.2 15)' }}
                    animate={{ top: ['10%', '90%'] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
            </div>

            {/* Traffic lights */}
            <div className="absolute top-4 right-3 flex flex-col gap-1">
              <div className="w-3 h-3 rounded-full" style={{
                background: sanctionStage === 'hit' ? 'oklch(0.65 0.2 15)' : 'oklch(0.2 0.02 256)',
                boxShadow: sanctionStage === 'hit' ? '0 0 8px oklch(0.65 0.2 15)' : 'none',
              }} />
              <div className="w-3 h-3 rounded-full" style={{
                background: sanctionStage === 'scanning' ? 'oklch(0.8 0.16 80)' : 'oklch(0.2 0.02 256)',
                boxShadow: sanctionStage === 'scanning' ? '0 0 8px oklch(0.8 0.16 80)' : 'none',
              }} />
              <div className="w-3 h-3 rounded-full" style={{
                background: sanctionStage === 'clear' ? 'oklch(0.7 0.17 160)' : 'oklch(0.2 0.02 256)',
                boxShadow: sanctionStage === 'clear' ? '0 0 8px oklch(0.7 0.17 160)' : 'none',
              }} />
            </div>
          </div>
        </div>

        {/* ── RIGHT LANE: Fraud (Baggage X-Ray) ── */}
        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.06 250 / 70%)' }}>
            🧳 Lane 2 — Baggage X-Ray
          </div>

          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{
              height: 280,
              background: 'oklch(0.12 0.02 256)',
              border: `1px solid oklch(0.25 0.04 256)`,
            }}
          >
            {/* Conveyor belt */}
            <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'oklch(0.18 0.03 256)' }}>
              <motion.div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, oklch(0.25 0.03 256) 0px, oklch(0.25 0.03 256) 2px, transparent 2px, transparent 20px)',
                }}
                animate={{ x: [0, -20] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* X-Ray scanner frame */}
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 w-[80%] rounded-lg overflow-hidden"
              style={{
                height: 160,
                background: 'oklch(0.08 0.02 250)',
                border: `2px solid ${fraudStage === 'xray' ? 'oklch(0.55 0.15 250 / 50%)' : 'oklch(0.25 0.04 256)'}`,
              }}
            >
              {/* X-ray header */}
              <div className="px-2 py-1 flex items-center justify-between" style={{ borderBottom: '1px solid oklch(0.15 0.02 256)' }}>
                <span className="text-[6px] font-mono uppercase" style={{ color: 'oklch(0.5 0.06 250)' }}>X-Ray Scanner</span>
                {fraudStage === 'xray' && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'oklch(0.55 0.15 250)' }}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Receipt packages inside X-ray */}
              <div className="flex items-end justify-center gap-2 p-3 h-[130px]">
                {RECEIPT_AMOUNTS.map((amt, i) => {
                  const isScanned = scannedReceipts.includes(i);
                  const isCleared = clearedReceipts.includes(i);
                  const height = 25 + parseFloat(amt.replace('$', '')) / 6;

                  return (
                    <motion.div
                      key={i}
                      className="relative flex flex-col items-center gap-0.5"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: isScanned ? 1 : 0.3 }}
                    >
                      <motion.div
                        className="rounded-sm flex items-center justify-center"
                        style={{
                          width: 40,
                          height,
                          background: isScanned
                            ? (isCleared
                              ? 'oklch(0.7 0.17 160 / 20%)'
                              : 'oklch(0.55 0.15 250 / 25%)')
                            : 'oklch(0.2 0.03 256)',
                          border: `1px solid ${isCleared
                            ? 'oklch(0.7 0.17 160 / 40%)'
                            : isScanned
                              ? 'oklch(0.55 0.15 250 / 40%)'
                              : 'oklch(0.25 0.03 256)'}`,
                          boxShadow: isScanned && !isCleared ? '0 0 12px oklch(0.55 0.15 250 / 25%)' : 'none',
                        }}
                        animate={isScanned && !isCleared ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="text-[7px] font-mono font-bold" style={{
                          color: isCleared ? 'oklch(0.7 0.17 160)' : isScanned ? 'oklch(0.7 0.12 250)' : 'oklch(0.4 0.03 256)',
                        }}>{amt}</span>
                      </motion.div>

                      {/* Green tag */}
                      {isCleared && (
                        <motion.div
                          className="text-[6px] font-mono font-bold"
                          style={{ color: 'oklch(0.7 0.17 160)' }}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          ✓
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Result badge */}
            <AnimatePresence>
              {(fraudStage === 'clear' || fraudStage === 'flagged') && (
                <motion.div
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[8px] font-bold"
                  style={{
                    background: `${fraudColor}15`,
                    border: `1px solid ${fraudColor}40`,
                    color: fraudColor,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {fraudStage === 'clear' ? '✅ No Duplicates' : '🚨 Duplicates Found'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Traffic lights */}
            <div className="absolute top-4 right-3 flex flex-col gap-1">
              <div className="w-3 h-3 rounded-full" style={{
                background: fraudStage === 'flagged' ? 'oklch(0.65 0.2 15)' : 'oklch(0.2 0.02 256)',
                boxShadow: fraudStage === 'flagged' ? '0 0 8px oklch(0.65 0.2 15)' : 'none',
              }} />
              <div className="w-3 h-3 rounded-full" style={{
                background: fraudStage === 'xray' ? 'oklch(0.8 0.16 80)' : 'oklch(0.2 0.02 256)',
                boxShadow: fraudStage === 'xray' ? '0 0 8px oklch(0.8 0.16 80)' : 'none',
              }} />
              <div className="w-3 h-3 rounded-full" style={{
                background: fraudStage === 'clear' ? 'oklch(0.7 0.17 160)' : 'oklch(0.2 0.02 256)',
                boxShadow: fraudStage === 'clear' ? '0 0 8px oklch(0.7 0.17 160)' : 'none',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Security clearance badge */}
      <AnimatePresence>
        {showBadge && (
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
            <motion.div
              className="text-2xl"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.2 }}
            >
              🛡️
            </motion.div>
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>SECURITY CLEARANCE: PASSED</div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-mono text-muted-foreground">
                  Sanctions: <span style={{ color: 'oklch(0.7 0.17 160)' }}>CLEAR ({COMPLIANCE_RESULT.sanctionsConf})</span>
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
        Option A — Airport Security Checkpoint
      </div>
    </div>
  );
}
