"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry } from '@/lib/claim-data';
import { FormBuilder } from './requestpay/FormBuilder';
import { DigitalWallet } from './payment/DigitalWallet';

interface PaymentAnimationProps {
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
}

type Phase = 'form' | 'transition' | 'wallet' | 'success';

export function PaymentAnimation({ addLog, onComplete }: PaymentAnimationProps) {
  const [phase, setPhase] = useState<Phase>('form');

  const handleFormComplete = useCallback(() => {
    addLog({ icon: '✅', text: 'Payment info received: ACH ****9876' });
    setPhase('transition');
  }, [addLog]);

  const handleNextStep = useCallback(() => {
    addLog({ icon: '💸', text: 'Sending $487.30 via ACH...' });
    setPhase('wallet');
  }, [addLog]);

  const [showReceipt, setShowReceipt] = useState(false);
  const successTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleWalletComplete = useCallback(() => {
    addLog({ icon: '✅', text: 'Payment successful' });
    setPhase('success');
  }, [addLog]);

  useEffect(() => {
    if (phase !== 'success') return;
    const t = successTimersRef.current;
    t.push(setTimeout(() => setShowReceipt(true), 800));
    t.push(setTimeout(() => onComplete(), 3000));
    return () => t.forEach(clearTimeout);
  }, [phase, onComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      {/* Step indicators */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {/* Step 1 */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
            style={{
              background: phase === 'form' ? 'oklch(0.55 0.2 270 / 25%)' : 'oklch(0.7 0.17 160 / 20%)',
              border: `2px solid ${phase === 'form' ? 'oklch(0.55 0.2 270 / 60%)' : 'oklch(0.7 0.17 160 / 50%)'}`,
              color: phase === 'form' ? 'oklch(0.75 0.15 270)' : 'oklch(0.7 0.17 160)',
            }}
          >
            {phase === 'form' ? '1' : '✓'}
          </div>
          <span
            className="text-[9px] font-mono"
            style={{ color: phase === 'form' ? 'oklch(0.75 0.15 270)' : 'oklch(0.5 0.03 256)' }}
          >
            Request Info
          </span>
        </div>

        <div className="w-6 h-px" style={{ background: 'oklch(0.3 0.03 256)' }} />

        {/* Step 2 */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
            style={{
              background: phase === 'wallet' ? 'oklch(0.7 0.15 195 / 25%)' : (phase === 'success' ? 'oklch(0.7 0.17 160 / 20%)' : 'oklch(0.2 0.02 256)'),
              border: `2px solid ${phase === 'wallet' ? 'oklch(0.7 0.15 195 / 60%)' : (phase === 'success' ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.3 0.03 256)')}`,
              color: phase === 'wallet' ? 'oklch(0.7 0.15 195)' : (phase === 'success' ? 'oklch(0.7 0.17 160)' : 'oklch(0.4 0.03 256)'),
            }}
          >
            {phase === 'success' ? '✓' : '2'}
          </div>
          <span
            className="text-[9px] font-mono"
            style={{ color: phase === 'wallet' ? 'oklch(0.7 0.15 195)' : 'oklch(0.4 0.03 256)' }}
          >
            Send Payment
          </span>
        </div>

        <div className="w-6 h-px" style={{ background: 'oklch(0.3 0.03 256)' }} />

        {/* Step 3 */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
            style={{
              background: phase === 'success' ? 'oklch(0.7 0.17 160 / 25%)' : 'oklch(0.2 0.02 256)',
              border: `2px solid ${phase === 'success' ? 'oklch(0.7 0.17 160 / 60%)' : 'oklch(0.3 0.03 256)'}`,
              color: phase === 'success' ? 'oklch(0.7 0.17 160)' : 'oklch(0.4 0.03 256)',
            }}
          >
            3
          </div>
          <span
            className="text-[9px] font-mono"
            style={{ color: phase === 'success' ? 'oklch(0.7 0.17 160)' : 'oklch(0.4 0.03 256)' }}
          >
            Confirmation
          </span>
        </div>
      </div>

      {/* Animation area */}
      <AnimatePresence mode="wait">
        {/* Step 1: Form Builder */}
        {phase === 'form' && (
          <motion.div
            key="form"
            className="w-full h-full pt-12"
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
          >
            <FormBuilder onComplete={handleFormComplete} autoPlay />
          </motion.div>
        )}

        {/* Transition: Next Step button */}
        {phase === 'transition' && (
          <motion.div
            key="transition"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            {/* Completion badge */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: 'oklch(0.7 0.17 160 / 12%)',
                  border: '2px solid oklch(0.7 0.17 160 / 40%)',
                  boxShadow: '0 0 25px oklch(0.7 0.17 160 / 15%)',
                }}
              >
                ✅
              </div>
              <span className="text-xs font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>
                Payment Info Collected
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">
                ACH Bank Transfer — ****9876
              </span>
            </motion.div>

            {/* Next Step button */}
            <motion.button
              className="px-8 py-3 rounded-xl flex items-center gap-3 cursor-pointer"
              style={{
                background: 'oklch(0.7 0.15 195 / 15%)',
                border: '2px solid oklch(0.7 0.15 195 / 40%)',
                boxShadow: '0 0 20px oklch(0.7 0.15 195 / 10%)',
              }}
              onClick={handleNextStep}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px oklch(0.7 0.15 195 / 20%)' }}
              whileTap={{ scale: 0.97 }}
              animate={{ boxShadow: ['0 0 15px oklch(0.7 0.15 195 / 8%)', '0 0 25px oklch(0.7 0.15 195 / 18%)', '0 0 15px oklch(0.7 0.15 195 / 8%)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-sm font-mono font-bold" style={{ color: 'oklch(0.7 0.15 195)' }}>
                Next Step
              </span>
              <motion.span
                className="text-sm"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>

            <span className="text-[8px] font-mono text-muted-foreground/50">
              Proceed to send payment via Digital Wallet
            </span>
          </motion.div>
        )}

        {/* Step 2: Digital Wallet */}
        {phase === 'wallet' && (
          <motion.div
            key="wallet"
            className="w-full h-full pt-12"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <DigitalWallet onComplete={handleWalletComplete} autoPlay />
          </motion.div>
        )}

        {/* Step 3: Success / Receipt */}
        {phase === 'success' && (
          <motion.div
            key="success"
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          >
            {/* Checkmark badge */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{
                  background: 'oklch(0.7 0.17 160 / 15%)',
                  border: '2px solid oklch(0.7 0.17 160 / 50%)',
                  boxShadow: '0 0 40px oklch(0.7 0.17 160 / 20%)',
                }}
              >
                ✅
              </motion.div>
              <div className="text-sm font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>
                PAYMENT SENT
              </div>
            </motion.div>

            {/* Floating dollar signs */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-sm"
                style={{ color: 'oklch(0.7 0.17 160 / 40%)' }}
                initial={{
                  x: (Math.random() - 0.5) * 100,
                  y: 50,
                  opacity: 0.6,
                }}
                animate={{
                  y: -150,
                  opacity: 0,
                }}
                transition={{ duration: 2 + Math.random(), delay: i * 0.15 }}
              >
                $
              </motion.div>
            ))}

            {/* Receipt stub */}
            <AnimatePresence>
              {showReceipt && (
                <motion.div
                  className="rounded-lg px-4 py-3 w-52"
                  style={{
                    background: 'oklch(0.18 0.02 256)',
                    border: '1px solid oklch(0.7 0.17 160 / 20%)',
                  }}
                  initial={{ opacity: 0, y: 20, scaleY: 0 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <div className="text-[8px] font-mono space-y-1">
                    <div className="text-muted-foreground/60 text-center">— RECEIPT —</div>
                    <div><span className="text-muted-foreground">Payment:</span> <span className="text-foreground font-bold">$487.30</span></div>
                    <div><span className="text-muted-foreground">Method:</span> <span className="text-foreground">ACH</span></div>
                    <div><span className="text-muted-foreground">Account:</span> <span className="text-foreground">****9876</span></div>
                    <div><span className="text-muted-foreground">Status:</span> <span className="font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>✅ SUCCESS</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
