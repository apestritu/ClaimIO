"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry } from '@/lib/claim-data';

interface ValidateAnimationProps {
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
  scenario: 'happy' | 'missing';
  onSwitchScenario: () => void;
}

const REQUIRED_DOCS = [
  { type: 'Policy', present: true },
  { type: 'ClaimForm', present: true },
  { type: 'BagReport', present: true },
  { type: 'FlightTicket', present: true },
  { type: 'Receipt', present: true },
];

type EmailPhase = 'hidden' | 'composing' | 'typed' | 'sending' | 'sent';

export function ValidateAnimation({ addLog, onComplete, scenario, onSwitchScenario }: ValidateAnimationProps) {
  const [checkedIndex, setCheckedIndex] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [emailPhase, setEmailPhase] = useState<EmailPhase>('hidden');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const docs = REQUIRED_DOCS.map(d => ({
    ...d,
    present: scenario === 'missing'
      ? (d.type !== 'BagReport' && d.type !== 'Receipt')
      : true,
  }));

  useEffect(() => {
    // Clear all previous timers and reset state on scenario change
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setCheckedIndex(-1);
    setShowResult(false);
    setEmailPhase('hidden');

    const currentDocs = REQUIRED_DOCS.map(d => ({
      ...d,
      present: scenario === 'missing'
        ? (d.type !== 'BagReport' && d.type !== 'Receipt')
        : true,
    }));

    addLog({ icon: '📋', text: 'Checking required documents...' });

    // Schedule all checks upfront so every timer is tracked
    const CHECK_DELAY = 500;
    const INITIAL_DELAY = 500;

    currentDocs.forEach((doc, i) => {
      const t = setTimeout(() => {
        setCheckedIndex(i);
        addLog({
          icon: doc.present ? '✅' : '❌',
          text: `${doc.type} — ${doc.present ? 'found' : 'MISSING'}`,
        });
      }, INITIAL_DELAY + i * CHECK_DELAY);
      timersRef.current.push(t);
    });

    const afterAll = INITIAL_DELAY + currentDocs.length * CHECK_DELAY + 400;

    const tResult = setTimeout(() => {
      setShowResult(true);
      if (scenario === 'happy') {
        addLog({ icon: '✅', text: 'All required documents present' });
        const tDone = setTimeout(onComplete, 2000);
        timersRef.current.push(tDone);
      } else {
        addLog({ icon: '📧', text: 'Composing notification email...' });
        const t1 = setTimeout(() => setEmailPhase('composing'), 600);
        const t2 = setTimeout(() => {
          setEmailPhase('typed');
          addLog({ icon: '✏️', text: 'Email drafted — requesting BagReport, Receipt' });
        }, 2800);
        const t3 = setTimeout(() => {
          setEmailPhase('sending');
          addLog({ icon: '📤', text: 'Sending email to claimant...' });
        }, 4200);
        const t4 = setTimeout(() => {
          setEmailPhase('sent');
          addLog({ icon: '✅', text: 'Email delivered — Attempt 1/2' });
        }, 5800);
        timersRef.current.push(t1, t2, t3, t4);
      }
    }, afterAll);
    timersRef.current.push(tResult);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      {/* Scenario toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Demo:</span>
        <button
          onClick={onSwitchScenario}
          className="px-3 py-1 rounded-full text-[10px] font-medium glass-panel hover:bg-glass-border transition-colors"
        >
          {scenario === 'happy' ? 'Show Missing Docs' : 'Show All Present'}
        </button>
      </div>

      {/* Checklist */}
      <div className="w-72 space-y-3">
        {docs.map((doc, i) => {
          const isChecked = i <= checkedIndex;
          return (
            <motion.div
              key={doc.type}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg glass-panel"
              style={{
                borderColor: isChecked
                  ? doc.present
                    ? 'oklch(0.7 0.17 160 / 30%)'
                    : 'oklch(0.65 0.2 15 / 30%)'
                  : undefined,
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: 1,
                x: 0,
                boxShadow: isChecked && !doc.present
                  ? '0 0 15px oklch(0.65 0.2 15 / 20%)'
                  : 'none',
              }}
              transition={{ delay: i * 0.1 }}
            >
              {isChecked ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{
                    scale: 1,
                    x: doc.present ? 0 : [0, -3, 3, -3, 3, 0],
                  }}
                  transition={doc.present
                    ? { type: 'spring', stiffness: 300 }
                    : { type: 'tween', duration: 0.4 }
                  }
                  className="text-sm"
                >
                  {doc.present ? '✅' : '❌'}
                </motion.span>
              ) : (
                <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/30" />
              )}
              <span className="text-sm font-medium text-foreground">{doc.type}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Result */}
      {showResult && scenario === 'happy' && (
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.svg
            viewBox="0 0 52 52"
            className="w-16 h-16"
            initial="hidden"
            animate="visible"
          >
            <motion.circle
              cx="26" cy="26" r="24"
              fill="none"
              stroke="oklch(0.7 0.17 160)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
            <motion.path
              d="M14 27 L22 35 L38 19"
              fill="none"
              stroke="oklch(0.7 0.17 160)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            />
          </motion.svg>
          <p className="text-sm font-medium text-emerald">All required documents present</p>
        </motion.div>
      )}

      {/* Email animation for missing docs */}
      {emailPhase !== 'hidden' && scenario === 'missing' && (
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {/* Phase: composing / typed — show email card being written */}
            {(emailPhase === 'composing' || emailPhase === 'typed') && (
              <motion.div
                key="email-card"
                className="w-80 rounded-xl overflow-hidden"
                style={{
                  background: 'oklch(0.14 0.02 256)',
                  border: '1px solid oklch(0.25 0.02 256)',
                  boxShadow: '0 12px 40px oklch(0 0 0 / 40%)',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, y: -30 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {/* Email header bar */}
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'oklch(0.17 0.02 256)', borderBottom: '1px solid oklch(0.22 0.02 256)' }}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(0.65 0.2 15)' }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(0.8 0.16 80)' }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(0.7 0.17 160)' }} />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground ml-2">New Message</span>
                </div>

                {/* Email fields */}
                <div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid oklch(0.2 0.02 256)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground/60 w-8">To:</span>
                    <motion.span
                      className="text-[10px] font-mono"
                      style={{ color: 'oklch(0.62 0.19 250)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      claimant@email.com
                    </motion.span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground/60 w-8">Subj:</span>
                    <motion.span
                      className="text-[10px] font-medium text-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      Claim #CLM-2024-08-4721 — Missing Documents
                    </motion.span>
                  </div>
                </div>

                {/* Email body — typewriter */}
                <div className="px-4 py-3 space-y-2 min-h-[100px]">
                  {[
                    { text: 'Dear Claimant,', delay: 0.8 },
                    { text: 'We are processing your claim and have identified', delay: 1.1 },
                    { text: 'the following missing documents:', delay: 1.4 },
                  ].map((line, i) => (
                    <motion.p
                      key={i}
                      className="text-[10px] text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: line.delay }}
                    >
                      {line.text}
                    </motion.p>
                  ))}

                  {/* Missing doc badges */}
                  <div className="flex gap-2 mt-1">
                    {['BagReport', 'Receipt'].map((doc, i) => (
                      <motion.span
                        key={doc}
                        className="px-2.5 py-1 rounded-md text-[9px] font-bold"
                        style={{
                          background: 'oklch(0.65 0.2 15 / 15%)',
                          border: '1px solid oklch(0.65 0.2 15 / 30%)',
                          color: 'oklch(0.65 0.2 15)',
                        }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.7 + i * 0.2, type: 'spring', stiffness: 300 }}
                      >
                        ❌ {doc}
                      </motion.span>
                    ))}
                  </div>

                  <motion.p
                    className="text-[10px] text-muted-foreground mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: emailPhase === 'typed' ? 1 : 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Please upload at your earliest convenience.
                  </motion.p>
                </div>

                {/* Cursor blink while composing */}
                {emailPhase === 'composing' && (
                  <div className="px-4 pb-3">
                    <motion.div
                      className="w-px h-3 inline-block"
                      style={{ background: 'oklch(0.62 0.19 250)' }}
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Phase: sending — envelope flying animation */}
            {emailPhase === 'sending' && (
              <motion.div
                key="sending"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="relative"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <motion.span
                    className="text-5xl block"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✉️
                  </motion.span>
                  {/* Sending pulse rings */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full"
                      style={{ border: '1px solid oklch(0.62 0.19 250 / 30%)' }}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                    />
                  ))}
                </motion.div>
                <motion.p
                  className="text-xs text-muted-foreground font-mono"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Sending...
                </motion.p>
              </motion.div>
            )}

            {/* Phase: sent — success confirmation */}
            {emailPhase === 'sent' && (
              <motion.div
                key="sent"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {/* Success checkmark */}
                <motion.div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: 'oklch(0.7 0.17 160 / 15%)',
                    border: '2px solid oklch(0.7 0.17 160 / 40%)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <motion.span
                    className="text-2xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                  >
                    ✅
                  </motion.span>
                </motion.div>

                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: 'oklch(0.7 0.17 160)' }}>
                    Email Delivered
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Requesting: <span className="font-medium" style={{ color: 'oklch(0.65 0.2 15)' }}>BagReport</span>, <span className="font-medium" style={{ color: 'oklch(0.65 0.2 15)' }}>Receipt</span>
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono">
                    Attempt 1/2 · Retry in 48h
                  </p>
                </div>

                <button
                  className="mt-2 px-5 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{
                    background: 'oklch(0.8 0.16 80 / 15%)',
                    border: '1px solid oklch(0.8 0.16 80 / 30%)',
                    color: 'oklch(0.8 0.16 80)',
                  }}
                  onClick={onSwitchScenario}
                >
                  Simulate Doc Upload →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
