"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PAYMENT_METHOD, ACCOUNT_DISPLAY } from './requestpay-data';

interface FormBuilderProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'title' | 'fields' | 'dropdown' | 'typing' | 'submit' | 'fold' | 'done';

export function FormBuilder({ onComplete, autoPlay = true }: FormBuilderProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [typedChars, setTypedChars] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSelected, setDropdownSelected] = useState(false);
  const startedRef = useRef(false);

  const accountStr = '****9876';

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setStage('title'), 400));
    timers.push(setTimeout(() => setStage('fields'), 1200));
    timers.push(setTimeout(() => setStage('dropdown'), 2200));
    timers.push(setTimeout(() => setDropdownOpen(true), 2600));
    timers.push(setTimeout(() => {
      setDropdownOpen(false);
      setDropdownSelected(true);
    }, 3600));

    // Type account digits
    timers.push(setTimeout(() => setStage('typing'), 4200));
    for (let i = 1; i <= accountStr.length; i++) {
      timers.push(setTimeout(() => setTypedChars(i), 4200 + i * 150));
    }

    // Submit
    timers.push(setTimeout(() => setStage('submit'), 5800));
    timers.push(setTimeout(() => setStage('fold'), 6800));
    timers.push(setTimeout(() => setStage('done'), 8000));
    timers.push(setTimeout(() => onComplete?.(), 9500));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          📝 Form Builder — Request Payment Info
        </span>
      </div>

      <AnimatePresence mode="wait">
        {stage !== 'done' ? (
          <motion.div
            key="form"
            className="relative rounded-2xl overflow-hidden"
            style={{
              width: 340,
              background: 'oklch(0.13 0.02 256)',
              border: '2px solid oklch(0.3 0.05 250 / 40%)',
              boxShadow: '0 8px 40px oklch(0 0 0 / 40%)',
            }}
            animate={stage === 'fold' ? {
              scaleY: 0.1, scaleX: 0.6, borderRadius: '50px', opacity: 0.5,
            } : {}}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            {/* Form header */}
            <AnimatePresence>
              {stage !== 'idle' && (
                <motion.div
                  className="px-5 py-3"
                  style={{ background: 'oklch(0.16 0.03 250)', borderBottom: '1px solid oklch(0.25 0.04 250)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="text-xs font-bold text-foreground">Payment Details Required</div>
                  <div className="text-[7px] font-mono text-muted-foreground mt-0.5">Please provide your payout information</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form body */}
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Payment Method field */}
              <AnimatePresence>
                {(stage === 'fields' || stage === 'dropdown' || stage === 'typing' || stage === 'submit' || stage === 'fold') && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <label className="text-[8px] font-mono text-muted-foreground mb-1 block">Payment Method</label>
                    <div className="relative">
                      <div
                        className="h-8 rounded-lg px-3 flex items-center justify-between"
                        style={{
                          background: 'oklch(0.18 0.03 250)',
                          border: `1px solid ${dropdownOpen ? 'oklch(0.55 0.15 250 / 50%)' : dropdownSelected ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.28 0.04 250)'}`,
                        }}
                      >
                        <span className="text-[9px] font-mono" style={{ color: dropdownSelected ? 'oklch(0.8 0.08 195)' : 'oklch(0.4 0.03 256)' }}>
                          {dropdownSelected ? '🏦 ACH Bank Transfer' : 'Select method...'}
                        </span>
                        <motion.span
                          className="text-[8px] text-muted-foreground"
                          animate={{ rotate: dropdownOpen ? 180 : 0 }}
                        >
                          ▼
                        </motion.span>
                      </div>

                      {/* Dropdown options */}
                      <AnimatePresence>
                        {dropdownOpen && (
                          <motion.div
                            className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10"
                            style={{
                              background: 'oklch(0.18 0.03 250)',
                              border: '1px solid oklch(0.35 0.05 250)',
                              boxShadow: '0 4px 15px oklch(0 0 0 / 30%)',
                            }}
                            initial={{ opacity: 0, y: -5, scaleY: 0.8 }}
                            animate={{ opacity: 1, y: 0, scaleY: 1 }}
                            exit={{ opacity: 0, y: -5, scaleY: 0.8 }}
                          >
                            <motion.div
                              className="px-3 py-1.5 flex items-center gap-2"
                              style={{ background: 'oklch(0.55 0.15 250 / 10%)' }}
                              animate={{ background: ['oklch(0.55 0.15 250 / 5%)', 'oklch(0.55 0.15 250 / 15%)', 'oklch(0.55 0.15 250 / 5%)'] }}
                              transition={{ duration: 0.8 }}
                            >
                              <span className="text-[9px]">🏦</span>
                              <span className="text-[8px] font-mono text-foreground">ACH Bank Transfer</span>
                            </motion.div>
                            <div className="px-3 py-1.5 flex items-center gap-2">
                              <span className="text-[9px]">💳</span>
                              <span className="text-[8px] font-mono text-muted-foreground">PayPal</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Account field */}
              <AnimatePresence>
                {(stage === 'fields' || stage === 'dropdown' || stage === 'typing' || stage === 'submit' || stage === 'fold') && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                  >
                    <label className="text-[8px] font-mono text-muted-foreground mb-1 block">Account Number</label>
                    <div
                      className="h-8 rounded-lg px-3 flex items-center"
                      style={{
                        background: 'oklch(0.18 0.03 250)',
                        border: `1px solid ${stage === 'typing' ? 'oklch(0.55 0.15 250 / 50%)' : typedChars > 0 ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.28 0.04 250)'}`,
                      }}
                    >
                      <span className="text-[9px] font-mono" style={{ color: typedChars > 0 ? 'oklch(0.8 0.08 195)' : 'oklch(0.4 0.03 256)' }}>
                        {typedChars > 0 ? accountStr.slice(0, typedChars) : 'Enter account...'}
                      </span>
                      {stage === 'typing' && (
                        <motion.span
                          className="text-[9px] font-mono ml-0.5"
                          style={{ color: 'oklch(0.55 0.15 250)' }}
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          ▌
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <AnimatePresence>
                {(stage === 'submit' || stage === 'fold') && (
                  <motion.div
                    className="flex justify-end"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <motion.div
                      className="px-5 py-2 rounded-lg flex items-center gap-2"
                      style={{
                        background: stage === 'fold' ? 'oklch(0.7 0.17 160 / 20%)' : 'oklch(0.55 0.15 250 / 20%)',
                        border: `1px solid ${stage === 'fold' ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.55 0.15 250 / 30%)'}`,
                      }}
                      animate={stage === 'submit' ? { scale: [1, 0.95, 1] } : {}}
                      transition={{ delay: 0.3, duration: 0.2 }}
                    >
                      <span className="text-[9px] font-mono font-bold" style={{
                        color: stage === 'fold' ? 'oklch(0.7 0.17 160)' : 'oklch(0.55 0.15 250)',
                      }}>
                        {stage === 'fold' ? '✅ Submitted' : 'Submit'}
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* Final payment card */
          <motion.div
            key="card"
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.div
              className="px-6 py-4 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, oklch(0.22 0.04 195), oklch(0.18 0.03 250))',
                border: '1px solid oklch(0.7 0.15 195 / 30%)',
                boxShadow: '0 4px 20px oklch(0 0 0 / 30%)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🏦</span>
                <div>
                  <div className="text-[9px] font-mono font-bold text-foreground">{PAYMENT_METHOD}</div>
                  <div className="text-[8px] font-mono text-muted-foreground">{ACCOUNT_DISPLAY}</div>
                </div>
                <motion.span
                  className="text-lg ml-2"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                  ✅
                </motion.span>
              </div>
            </motion.div>
            <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>
              Ready for Payment Agent
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
