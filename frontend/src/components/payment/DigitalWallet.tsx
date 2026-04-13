"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PAYMENT_AMOUNT, ACCOUNT_DISPLAY } from './payment-data';

interface DigitalWalletProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'locked' | 'notification' | 'unlock' | 'confirm' | 'tapping' | 'transferring' | 'done';

export function DigitalWallet({ onComplete, autoPlay = true }: DigitalWalletProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [ringProgress, setRingProgress] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setStage('locked'), 400));
    timers.push(setTimeout(() => setStage('notification'), 1800));
    timers.push(setTimeout(() => setStage('unlock'), 3200));
    timers.push(setTimeout(() => setStage('confirm'), 4400));
    timers.push(setTimeout(() => setStage('tapping'), 5600));
    timers.push(setTimeout(() => setStage('transferring'), 6800));

    // Ring progress
    timers.push(setTimeout(() => {
      const interval = setInterval(() => {
        setRingProgress(prev => {
          if (prev >= 100) { clearInterval(interval); return 100; }
          return prev + 4;
        });
      }, 50);
      timers.push(setTimeout(() => clearInterval(interval), 2000) as unknown as ReturnType<typeof setTimeout>);
    }, 7000));

    timers.push(setTimeout(() => setStage('done'), 9200));
    timers.push(setTimeout(() => onComplete?.(), 11000));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const phoneWidth = 150;
  const phoneHeight = 280;
  const screenInset = 8;
  const cornerRadius = 20;

  const isTapping = stage === 'tapping' || stage === 'transferring' || stage === 'done';

  const PhoneShell = ({ children, side }: { children: React.ReactNode; side: 'left' | 'right' }) => {
    const tiltDeg = isTapping ? (side === 'left' ? 8 : -8) : 0;
    const isDone = stage === 'done';
    return (
      <motion.div
        className="relative shrink-0"
        style={{ width: phoneWidth, height: phoneHeight }}
        animate={{ rotate: tiltDeg, x: isTapping ? (side === 'left' ? 20 : -20) : 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 12 }}
      >
        {/* Phone body */}
        <div
          className="absolute inset-0 rounded-[20px] overflow-hidden"
          style={{
            background: 'oklch(0.12 0.02 256)',
            border: `2px solid ${isDone ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.3 0.05 250 / 40%)'}`,
            boxShadow: isDone
              ? '0 0 25px oklch(0.7 0.17 160 / 15%), 0 8px 30px oklch(0 0 0 / 40%)'
              : '0 8px 30px oklch(0 0 0 / 40%)',
          }}
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 rounded-b-xl" style={{ background: 'oklch(0.08 0.01 256)' }} />

          {/* Screen area */}
          <div
            className="absolute rounded-[12px] overflow-hidden"
            style={{
              top: screenInset,
              left: screenInset,
              right: screenInset,
              bottom: screenInset,
              background: 'oklch(0.09 0.015 256)',
            }}
          >
            {children}
          </div>

          {/* Home bar */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full" style={{ background: 'oklch(0.3 0.03 256)' }} />
        </div>
      </motion.div>
    );
  };

  const stageOrder: Stage[] = ['idle', 'locked', 'notification', 'unlock', 'confirm', 'tapping', 'transferring', 'done'];
  const stageIdx = stageOrder.indexOf(stage);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Title */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          📱 Digital Wallet — Phone Payment
        </span>
      </div>

      <div className="flex items-center gap-8">
        {/* LEFT PHONE — Insurance App */}
        <PhoneShell side="left">
          <div className="h-full flex flex-col items-center justify-center px-3 gap-2">
            {/* Status bar */}
            <div className="absolute top-5 left-3 right-3 flex items-center justify-between">
              <span className="text-[5px] font-mono" style={{ color: 'oklch(0.5 0.04 256)' }}>ClaimFlow</span>
              <span className="text-[5px] font-mono" style={{ color: 'oklch(0.5 0.04 256)' }}>9:41</span>
            </div>

            <span className="text-2xl mb-1">🏢</span>
            <div className="text-[8px] font-mono text-muted-foreground text-center">Insurance App</div>
            <div className="text-center mt-2">
              <div className="text-[7px] font-mono text-muted-foreground">Claim Approved</div>
              <div className="text-sm font-bold font-mono mt-0.5" style={{ color: 'oklch(0.7 0.17 160)' }}>{PAYMENT_AMOUNT}</div>
            </div>

            {/* Send button */}
            <motion.div
              className="px-4 py-1.5 rounded-full mt-2"
              style={{
                background: stageIdx >= 4 ? 'oklch(0.7 0.17 160 / 20%)' : 'oklch(0.55 0.15 250 / 15%)',
                border: `1px solid ${stageIdx >= 4 ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.55 0.15 250 / 30%)'}`,
              }}
              animate={stageIdx < 4 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-[8px] font-mono font-bold" style={{ color: stageIdx >= 4 ? 'oklch(0.7 0.17 160)' : 'oklch(0.55 0.15 250)' }}>
                {stageIdx >= 4 ? 'Sending...' : 'Send Payment'}
              </span>
            </motion.div>

            {/* Sent status */}
            {stage === 'done' && (
              <motion.div
                className="flex items-center gap-1 mt-2"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <span className="text-sm">✅</span>
                <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>Sent</span>
              </motion.div>
            )}
          </div>
        </PhoneShell>

        {/* NFC / Connection zone between phones */}
        <div className="relative flex flex-col items-center gap-3" style={{ width: 80 }}>
          {/* NFC waves */}
          {isTapping && (
            <>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: 30 + i * 20,
                    height: 30 + i * 20,
                    border: `1px solid ${stage === 'done' ? 'oklch(0.7 0.17 160 / 30%)' : 'oklch(0.55 0.15 250 / 25%)'}`,
                  }}
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </>
          )}

          {/* Progress ring */}
          {(stage === 'transferring' || stage === 'done') && (
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(0.2 0.02 256)" strokeWidth="2" />
                <motion.circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke={stage === 'done' ? 'oklch(0.7 0.17 160)' : 'oklch(0.55 0.15 250)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 15}
                  animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - ringProgress / 100) }}
                  transition={{ duration: 0.1 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {stage === 'done' ? (
                  <motion.span className="text-lg" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}>✅</motion.span>
                ) : (
                  <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.55 0.15 250)' }}>{Math.round(ringProgress)}%</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PHONE — Claimant */}
        <PhoneShell side="right">
          <div className="h-full flex flex-col items-center justify-center px-3 gap-2 relative">
            {/* Status bar */}
            <div className="absolute top-5 left-3 right-3 flex items-center justify-between">
              <span className="text-[5px] font-mono" style={{ color: 'oklch(0.5 0.04 256)' }}>Banking</span>
              <span className="text-[5px] font-mono" style={{ color: 'oklch(0.5 0.04 256)' }}>9:41</span>
            </div>

            {/* Lock screen */}
            {(stage === 'locked' || stage === 'notification') && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">🔒</span>
                <span className="text-[8px] font-mono text-muted-foreground">Awaiting details</span>

                {/* Notification banner */}
                {stage === 'notification' && (
                  <motion.div
                    className="absolute top-10 left-2 right-2 px-2 py-1.5 rounded-lg"
                    style={{
                      background: 'oklch(0.2 0.03 256)',
                      border: '1px solid oklch(0.35 0.04 256)',
                    }}
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <div className="text-[6px] font-mono text-muted-foreground">📧 New notification</div>
                    <div className="text-[7px] font-mono text-foreground mt-0.5">Payment details requested</div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Unlocked — payment method selection */}
            {(stage === 'unlock' || stage === 'confirm') && (
              <motion.div
                className="flex flex-col items-center gap-2 w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-lg">🔓</span>
                <div className="text-[7px] font-mono text-muted-foreground">Select payment method</div>

                {/* ACH option */}
                <div
                  className="w-full px-2 py-1.5 rounded-lg flex items-center gap-2"
                  style={{
                    background: 'oklch(0.55 0.15 250 / 12%)',
                    border: '1px solid oklch(0.55 0.15 250 / 30%)',
                  }}
                >
                  <span className="text-xs">🏦</span>
                  <div>
                    <div className="text-[7px] font-mono font-bold text-foreground">ACH Transfer</div>
                    <div className="text-[6px] font-mono text-muted-foreground">{ACCOUNT_DISPLAY}</div>
                  </div>
                  <span className="ml-auto text-[8px]">✓</span>
                </div>

                {/* Confirm button */}
                {stage === 'confirm' && (
                  <motion.div
                    className="px-4 py-1.5 rounded-full"
                    style={{
                      background: 'oklch(0.55 0.15 250 / 20%)',
                      border: '1px solid oklch(0.55 0.15 250 / 40%)',
                    }}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 0.95, 1] }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                  >
                    <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.55 0.15 250)' }}>Confirm ✓</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Tapping / Transferring */}
            {(stage === 'tapping' || stage === 'transferring') && (
              <div className="flex flex-col items-center gap-2">
                <motion.span
                  className="text-2xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  📲
                </motion.span>
                <span className="text-[8px] font-mono" style={{ color: 'oklch(0.55 0.15 250)' }}>
                  {stage === 'tapping' ? 'Connecting...' : 'Receiving...'}
                </span>
              </div>
            )}

            {/* Done */}
            {stage === 'done' && (
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <span className="text-2xl">✅</span>
                <div className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>Received</div>
                <div className="text-sm font-bold font-mono" style={{ color: 'oklch(0.7 0.17 160)' }}>{PAYMENT_AMOUNT}</div>
              </motion.div>
            )}
          </div>
        </PhoneShell>
      </div>

    </div>
  );
}
