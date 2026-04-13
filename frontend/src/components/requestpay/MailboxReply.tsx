"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PAYMENT_METHOD, ACCOUNT_DISPLAY } from './requestpay-data';

interface MailboxReplyProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'compose' | 'send' | 'waiting' | 'reply' | 'open' | 'done';

export function MailboxReply({ onComplete, autoPlay = true }: MailboxReplyProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [dots, setDots] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setStage('compose'), 400));
    timers.push(setTimeout(() => setStage('send'), 2000));
    timers.push(setTimeout(() => setStage('waiting'), 3200));

    // Dots animation during waiting
    let dotInterval: ReturnType<typeof setInterval>;
    timers.push(setTimeout(() => {
      dotInterval = setInterval(() => setDots(d => (d + 1) % 4), 500);
    }, 3200));
    timers.push(setTimeout(() => { if (dotInterval) clearInterval(dotInterval); }, 5500));

    timers.push(setTimeout(() => setStage('reply'), 5500));
    timers.push(setTimeout(() => setStage('open'), 6800));
    timers.push(setTimeout(() => setStage('done'), 8200));
    timers.push(setTimeout(() => onComplete?.(), 10000));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [autoPlay, onComplete]);

  const flagUp = stage === 'compose' || stage === 'send';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          📬 Mailbox & Reply — Request Payment Info
        </span>
      </div>

      <div className="relative flex items-center gap-8" style={{ width: 550, height: 300 }}>
        {/* Mailbox */}
        <div className="relative flex flex-col items-center" style={{ width: 160 }}>
          <div
            className="relative w-32 h-24 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, oklch(0.22 0.04 250), oklch(0.16 0.03 256))',
              border: '2px solid oklch(0.35 0.06 250 / 50%)',
              boxShadow: '0 6px 25px oklch(0 0 0 / 40%)',
            }}
          >
            {/* Mail slot */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 rounded" style={{ background: 'oklch(0.1 0.02 256)' }} />

            {/* Flag */}
            <motion.div
              className="absolute -right-3 top-2"
              animate={{ rotate: flagUp ? -45 : 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="w-1.5 h-10 rounded" style={{ background: 'oklch(0.4 0.06 250)' }} />
              <motion.div
                className="absolute top-0 left-1.5 w-4 h-3 rounded-sm"
                style={{ background: flagUp ? 'oklch(0.65 0.2 15)' : 'oklch(0.4 0.06 250)' }}
              />
            </motion.div>

            {/* Label */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] font-mono text-muted-foreground">
              OUTBOX
            </div>
          </div>

          {/* Post */}
          <div className="w-3 h-12 rounded-b" style={{ background: 'oklch(0.25 0.04 250)' }} />
        </div>

        {/* Center area — letters flying, waiting, etc */}
        <div className="flex-1 relative flex items-center justify-center" style={{ height: 200 }}>
          {/* Letter flying OUT */}
          <AnimatePresence>
            {stage === 'send' && (
              <motion.div
                className="absolute flex flex-col items-center gap-1"
                initial={{ x: -80, opacity: 1, rotate: 0 }}
                animate={{ x: 150, opacity: 0, rotate: 5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: 'easeIn' }}
              >
                <div className="w-20 h-14 rounded-lg flex items-center justify-center" style={{
                  background: 'oklch(0.7 0.15 195 / 15%)',
                  border: '1px solid oklch(0.7 0.15 195 / 40%)',
                }}>
                  <span className="text-xl">✉️</span>
                </div>
                <span className="text-[6px] font-mono text-muted-foreground">Payment request</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Composing letter inside mailbox */}
          <AnimatePresence>
            {stage === 'compose' && (
              <motion.div
                className="absolute left-0 flex flex-col gap-1 px-3 py-2 rounded-lg w-40"
                style={{
                  background: 'oklch(0.15 0.025 256)',
                  border: '1px solid oklch(0.3 0.05 250 / 30%)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-[7px] font-mono text-muted-foreground">Composing...</div>
                <motion.div
                  className="text-[7px] font-mono"
                  style={{ color: 'oklch(0.7 0.15 195)' }}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2 }}
                >
                  <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    Please provide your payment method...
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waiting */}
          {stage === 'waiting' && (
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="text-2xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⏳
              </motion.div>
              <span className="text-[9px] font-mono" style={{ color: 'oklch(0.6 0.08 80)' }}>
                Awaiting response{'.'.repeat(dots)}
              </span>
            </motion.div>
          )}

          {/* Reply letter flying BACK */}
          <AnimatePresence>
            {stage === 'reply' && (
              <motion.div
                className="absolute flex flex-col items-center gap-1"
                initial={{ x: 150, opacity: 0, rotate: -5 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              >
                <div className="w-20 h-14 rounded-lg flex items-center justify-center" style={{
                  background: 'oklch(0.7 0.17 160 / 15%)',
                  border: '1px solid oklch(0.7 0.17 160 / 40%)',
                }}>
                  <span className="text-xl">📩</span>
                </div>
                <span className="text-[6px] font-mono text-muted-foreground">Response received</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Opened letter — payment card */}
          <AnimatePresence>
            {(stage === 'open' || stage === 'done') && (
              <motion.div
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {/* Letter opened */}
                <div className="w-44 rounded-xl overflow-hidden" style={{
                  background: 'oklch(0.15 0.025 256)',
                  border: '1px solid oklch(0.3 0.05 250 / 30%)',
                }}>
                  <div className="px-3 py-2 text-center" style={{ background: 'oklch(0.18 0.03 250)', borderBottom: '1px solid oklch(0.25 0.04 250)' }}>
                    <span className="text-[7px] font-mono text-muted-foreground">📨 Reply from claimant</span>
                  </div>

                  {/* Payment card popping out */}
                  <motion.div
                    className="mx-2 my-2 px-3 py-2 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.22 0.04 195), oklch(0.18 0.03 250))',
                      border: '1px solid oklch(0.7 0.15 195 / 30%)',
                    }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏦</span>
                      <div>
                        <div className="text-[8px] font-mono font-bold text-foreground">{PAYMENT_METHOD}</div>
                        <div className="text-[7px] font-mono text-muted-foreground">{ACCOUNT_DISPLAY}</div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Stamp */}
                {stage === 'done' && (
                  <motion.div
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                    style={{
                      background: 'oklch(0.7 0.17 160 / 12%)',
                      border: '1px solid oklch(0.7 0.17 160 / 40%)',
                    }}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  >
                    <span className="text-sm">✅</span>
                    <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>
                      Ready for Payment Agent
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option A — Mailbox & Reply
      </div>
    </div>
  );
}
