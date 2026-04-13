"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PAYMENT_AMOUNT, ACCOUNT_DISPLAY, RECEIPT_LINES } from './payment-data';

interface ATMMachineProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'request' | 'cardInsert' | 'accepted' | 'processing' | 'dispensing' | 'receipt' | 'done';

export function ATMMachine({ onComplete, autoPlay = true }: ATMMachineProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [screenText, setScreenText] = useState('');
  const [progress, setProgress] = useState(0);
  const [billCount, setBillCount] = useState(0);
  const [receiptScroll, setReceiptScroll] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      setStage('request');
      setScreenText('Please insert payment details...');
    }, 400));

    // Envelope flies out
    timers.push(setTimeout(() => setScreenText('📧 Requesting details...'), 1400));

    // Card slides in
    timers.push(setTimeout(() => {
      setStage('cardInsert');
      setScreenText('Reading card...');
    }, 2800));

    // Card accepted
    timers.push(setTimeout(() => {
      setStage('accepted');
      setScreenText(`ACH ${ACCOUNT_DISPLAY} — Accepted ✅`);
    }, 4000));

    // Processing phase
    timers.push(setTimeout(() => {
      setStage('processing');
      setScreenText('Processing payment...');
    }, 5200));

    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + 3;
      });
    }, 50);
    timers.push(setTimeout(() => clearInterval(progressInterval), 7000) as unknown as ReturnType<typeof setTimeout>);

    // Dispensing
    timers.push(setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setStage('dispensing');
      setScreenText(`Dispensing ${PAYMENT_AMOUNT}...`);
    }, 7000));

    // Bills fan out one by one
    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setBillCount(i), 7200 + i * 300));
    }

    // Receipt
    timers.push(setTimeout(() => {
      setStage('receipt');
      setScreenText('PAYMENT COMPLETE ✅');
    }, 8800));

    // Scroll receipt
    const receiptInterval = setInterval(() => {
      setReceiptScroll(prev => {
        if (prev >= 100) { clearInterval(receiptInterval); return 100; }
        return prev + 5;
      });
    }, 40);
    timers.push(setTimeout(() => clearInterval(receiptInterval), 10200) as unknown as ReturnType<typeof setTimeout>);

    timers.push(setTimeout(() => {
      setStage('done');
      onComplete?.();
    }, 11000));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearInterval(receiptInterval);
    };
  }, [autoPlay, onComplete]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          🏧 ATM — Payment Processing
        </span>
      </div>

      {/* ATM Machine body */}
      <div className="relative flex flex-col items-center">
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: 320,
            height: 420,
            background: 'linear-gradient(180deg, oklch(0.22 0.03 250), oklch(0.15 0.025 256))',
            border: '2px solid oklch(0.3 0.05 250 / 50%)',
            boxShadow: '0 12px 50px oklch(0 0 0 / 50%), inset 0 1px 0 oklch(0.4 0.06 250 / 15%)',
          }}
        >
          {/* Top bezel */}
          <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'oklch(0.18 0.03 250)', borderBottom: '1px solid oklch(0.25 0.04 250)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: stage === 'done' ? 'oklch(0.7 0.17 160)' : 'oklch(0.8 0.16 80)' }} />
              <span className="text-[7px] font-mono uppercase" style={{ color: 'oklch(0.5 0.06 250)' }}>ClaimFlow ATM</span>
            </div>
            <span className="text-[6px] font-mono" style={{ color: 'oklch(0.4 0.04 256)' }}>v2.1</span>
          </div>

          {/* Screen */}
          <div className="mx-4 mt-3 rounded-lg overflow-hidden" style={{
            height: 120,
            background: 'oklch(0.08 0.03 160)',
            border: '2px solid oklch(0.2 0.04 160)',
            boxShadow: 'inset 0 0 20px oklch(0 0 0 / 40%), 0 0 8px oklch(0.5 0.1 160 / 10%)',
          }}>
            <div className="h-full flex flex-col items-center justify-center px-4 gap-2">
              {/* Screen text */}
              <motion.div
                className="text-[10px] font-mono text-center leading-relaxed"
                style={{
                  color: stage === 'done' || stage === 'receipt'
                    ? 'oklch(0.7 0.17 160)'
                    : stage === 'accepted'
                      ? 'oklch(0.7 0.17 160)'
                      : 'oklch(0.7 0.15 160)',
                  textShadow: '0 0 6px oklch(0.7 0.15 160 / 30%)',
                }}
                key={screenText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {screenText}
                {stage === 'request' && (
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>▌</motion.span>
                )}
              </motion.div>

              {/* Progress bar on screen */}
              {stage === 'processing' && (
                <div className="w-full max-w-[200px] h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.15 0.03 160)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'oklch(0.7 0.17 160)', width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Spinning rings animation */}
              {stage === 'processing' && (
                <motion.div
                  className="text-lg"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  ⚙️
                </motion.div>
              )}
            </div>
          </div>

          {/* Card slot */}
          <div className="mx-4 mt-3 relative" style={{ height: 30 }}>
            <div className="absolute inset-0 rounded-md flex items-center justify-center" style={{
              background: 'oklch(0.1 0.02 256)',
              border: `1px solid ${stage === 'request' ? 'oklch(0.7 0.15 195 / 40%)' : stage === 'accepted' ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.25 0.03 256)'}`,
              boxShadow: stage === 'request' ? '0 0 10px oklch(0.7 0.15 195 / 15%)' : 'none',
            }}>
              {stage === 'request' && (
                <motion.div
                  className="text-[7px] font-mono"
                  style={{ color: 'oklch(0.5 0.08 195)' }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ▶ INSERT CARD ◀
                </motion.div>
              )}

              {/* Card sliding in */}
              {(stage === 'cardInsert' || stage === 'accepted') && (
                <motion.div
                  className="absolute flex items-center gap-1 px-2 py-0.5 rounded"
                  style={{
                    background: 'linear-gradient(90deg, oklch(0.25 0.04 195), oklch(0.22 0.03 250))',
                    border: '1px solid oklch(0.5 0.1 195 / 30%)',
                  }}
                  initial={{ x: 180, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                >
                  <span className="text-xs">💳</span>
                  <span className="text-[7px] font-mono text-foreground">ACH {ACCOUNT_DISPLAY}</span>
                  {stage === 'accepted' && <span className="text-[7px]">✅</span>}
                </motion.div>
              )}
            </div>
          </div>

          {/* Envelope flying out (during request) */}
          <AnimatePresence>
            {stage === 'request' && (
              <motion.div
                className="absolute text-lg"
                style={{ right: 30, top: 180 }}
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: 200, y: -30, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                ✉️
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mechanical internals (visible during processing) */}
          {stage === 'processing' && (
            <div className="mx-4 mt-2 rounded-lg overflow-hidden" style={{
              height: 80,
              background: 'oklch(0.1 0.015 256)',
              border: '1px dashed oklch(0.25 0.03 256)',
            }}>
              <div className="h-full flex items-center justify-center gap-2 px-3">
                {/* Gear animation */}
                <motion.div className="text-xl" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>⚙️</motion.div>
                {/* Money traveling through pipes */}
                <div className="flex-1 h-2 rounded-full overflow-hidden relative" style={{ background: 'oklch(0.15 0.02 256)' }}>
                  <motion.div
                    className="absolute h-full w-4 rounded-full"
                    style={{ background: 'oklch(0.7 0.17 160 / 50%)' }}
                    animate={{ left: ['0%', '100%'] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <motion.div className="text-xl" animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>⚙️</motion.div>
              </div>
            </div>
          )}

          {/* Cash dispenser (bottom) */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <div className="relative rounded-b-lg" style={{
              height: 60,
              background: 'oklch(0.1 0.02 256)',
              border: '1px solid oklch(0.25 0.03 256)',
              borderTop: 'none',
            }}>
              {/* Dispenser slot */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 rounded-b" style={{ background: 'oklch(0.06 0.01 256)' }} />

              {/* Bills fanning out */}
              <AnimatePresence>
                {stage === 'dispensing' && Array.from({ length: billCount }).map((_, i) => (
                  <motion.div
                    key={`bill-${i}`}
                    className="absolute left-1/2 flex items-center justify-center rounded-sm"
                    style={{
                      width: 60,
                      height: 28,
                      background: 'linear-gradient(135deg, oklch(0.25 0.06 160), oklch(0.2 0.04 160))',
                      border: '1px solid oklch(0.7 0.17 160 / 30%)',
                    }}
                    initial={{ x: '-50%', y: -5, opacity: 0, rotate: 0 }}
                    animate={{
                      x: `calc(-50% + ${(i - 2) * 15}px)`,
                      y: 10 + i * 3,
                      opacity: 1,
                      rotate: (i - 2) * 5,
                    }}
                    transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                  >
                    <span className="text-[7px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>$</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Amount label */}
              {(stage === 'dispensing' || stage === 'receipt' || stage === 'done') && (
                <motion.div
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold"
                  style={{ color: 'oklch(0.7 0.17 160)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {PAYMENT_AMOUNT}
                </motion.div>
              )}
            </div>
          </div>

          {/* Receipt printing from top */}
          <AnimatePresence>
            {(stage === 'receipt' || stage === 'done') && (
              <motion.div
                className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-b-lg px-3 py-2 w-48"
                style={{
                  background: 'oklch(0.92 0.01 80)',
                  border: '1px solid oklch(0.8 0.02 80)',
                  boxShadow: '0 4px 15px oklch(0 0 0 / 20%)',
                }}
                initial={{ y: 30, scaleY: 0, opacity: 0 }}
                animate={{ y: -80, scaleY: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 12 }}
              >
                <div className="text-center mb-1">
                  <div className="text-[7px] font-mono font-bold" style={{ color: 'oklch(0.3 0.04 256)' }}>═══ RECEIPT ═══</div>
                </div>
                {RECEIPT_LINES.map((line, i) => (
                  <div key={i} className="flex justify-between text-[6px] font-mono" style={{ color: 'oklch(0.35 0.03 256)' }}>
                    <span>{line.label}:</span>
                    <span className="font-bold">{line.value}</span>
                  </div>
                ))}
                <div className="text-[6px] font-mono text-center mt-1" style={{ color: 'oklch(0.5 0.03 256)' }}>
                  ─────────────────
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option A — ATM / Cash Machine
      </div>
    </div>
  );
}
