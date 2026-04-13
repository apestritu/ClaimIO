"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIM_ID, DECISION, AMOUNT, CONFIDENCE, EMAIL_LINES, ATTACHMENTS } from './closenotify-data';

interface GrandEnvelopeProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'compose' | 'attachments' | 'seal' | 'wax' | 'launch' | 'stamp' | 'summary' | 'done';

export function GrandEnvelope({ onComplete, autoPlay = true }: GrandEnvelopeProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [visibleLines, setVisibleLines] = useState(0);
  const [attachedPdfs, setAttachedPdfs] = useState<number[]>([]);
  const [flapClosed, setFlapClosed] = useState(false);
  const [showWax, setShowWax] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setStage('compose'), 400));

    // Typewriter lines
    EMAIL_LINES.forEach((_, i) => {
      t.push(setTimeout(() => setVisibleLines(i + 1), 800 + i * 1000));
    });

    // Attachments
    t.push(setTimeout(() => setStage('attachments'), 4200));
    ATTACHMENTS.forEach((_, i) => {
      t.push(setTimeout(() => setAttachedPdfs(prev => [...prev, i]), 4600 + i * 700));
    });

    // Seal
    t.push(setTimeout(() => { setStage('seal'); setFlapClosed(true); }, 7000));
    t.push(setTimeout(() => { setStage('wax'); setShowWax(true); }, 8000));

    // Launch
    t.push(setTimeout(() => setStage('launch'), 9200));

    // Stamp
    t.push(setTimeout(() => { setStage('stamp'); setShowStamp(true); }, 10400));

    // Summary
    t.push(setTimeout(() => { setStage('summary'); setShowSummary(true); }, 11800));
    t.push(setTimeout(() => setStage('done'), 13000));
    t.push(setTimeout(() => onComplete?.(), 14500));

    return () => t.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          ✉️ Grand Envelope — Close & Notify
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Phase 1-4: Envelope composition */}
        {(stage !== 'stamp' && stage !== 'summary' && stage !== 'done') && (
          <motion.div
            key="envelope"
            className="relative flex flex-col items-center"
            exit={stage === 'launch' ? { x: 400, y: -200, opacity: 0, rotate: 15, scale: 0.5 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, ease: 'easeIn' }}
          >
            {/* Envelope body */}
            <div
              className="relative rounded-xl overflow-visible"
              style={{
                width: 340,
                height: 220,
                background: 'linear-gradient(180deg, oklch(0.2 0.04 40), oklch(0.16 0.03 30))',
                border: '2px solid oklch(0.35 0.06 40 / 50%)',
                boxShadow: '0 8px 30px oklch(0 0 0 / 40%)',
              }}
            >
              {/* Flap */}
              <motion.div
                className="absolute -top-1 left-0 right-0 overflow-hidden"
                style={{
                  height: 60,
                  transformOrigin: 'top center',
                  zIndex: flapClosed ? 10 : 0,
                }}
                animate={flapClosed ? { rotateX: 180, y: 58 } : {}}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '170px solid transparent',
                  borderRight: '170px solid transparent',
                  borderTop: '60px solid oklch(0.22 0.04 40)',
                }} />
              </motion.div>

              {/* Letter inside */}
              <div className="absolute inset-3 top-8 rounded-lg px-4 py-3 overflow-hidden" style={{
                background: 'oklch(0.92 0.01 80)',
              }}>
                {/* Typed lines */}
                <div className="space-y-1.5">
                  {EMAIL_LINES.slice(0, visibleLines).map((line, i) => (
                    <motion.div
                      key={i}
                      className="text-[8px] font-mono"
                      style={{
                        color: line.includes('APPROVED') ? 'oklch(0.35 0.12 160)' : 'oklch(0.3 0.03 256)',
                        fontWeight: line.includes('Decision') || line.includes('Amount') ? 700 : 400,
                      }}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: '100%' }}
                      transition={{ duration: 0.6 }}
                    >
                      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{line}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Attachment slots */}
                {attachedPdfs.length > 0 && (
                  <div className="mt-3 flex gap-1.5">
                    {attachedPdfs.map(idx => (
                      <motion.div
                        key={idx}
                        className="flex items-center gap-1 px-2 py-1 rounded"
                        style={{
                          background: `${ATTACHMENTS[idx].color}15`,
                          border: `1px solid ${ATTACHMENTS[idx].color}30`,
                        }}
                        initial={{ x: 80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <span className="text-[8px]">{ATTACHMENTS[idx].icon}</span>
                        <span className="text-[5px] font-mono" style={{ color: ATTACHMENTS[idx].color }}>
                          {ATTACHMENTS[idx].name.replace('.pdf', '')}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Wax seal */}
              {showWax && (
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, oklch(0.45 0.2 20), oklch(0.35 0.18 15))',
                    border: '2px solid oklch(0.5 0.2 25 / 50%)',
                    boxShadow: '0 2px 10px oklch(0.4 0.2 15 / 40%), inset 0 -2px 4px oklch(0.3 0.15 15 / 30%)',
                    zIndex: 20,
                  }}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <span className="text-[8px] font-bold" style={{ color: 'oklch(0.8 0.05 40)' }}>AI</span>
                </motion.div>
              )}
            </div>

            {/* Particle trail during launch */}
            {stage === 'launch' && Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ background: 'oklch(0.8 0.16 80)', left: '50%', top: '50%' }}
                initial={{ x: 0, y: 0, opacity: 0.8 }}
                animate={{ x: -(i * 15 + Math.random() * 30), y: i * 10 + Math.random() * 20, opacity: 0 }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              />
            ))}
          </motion.div>
        )}

        {/* Phase 5: CASE CLOSED stamp + summary */}
        {(stage === 'stamp' || stage === 'summary' || stage === 'done') && (
          <motion.div
            key="closed"
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Stamp */}
            {showStamp && (
              <motion.div
                className="relative"
                initial={{ scale: 3, opacity: 0, y: -50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <div
                  className="px-8 py-4 rounded-lg text-center"
                  style={{
                    border: '4px solid oklch(0.65 0.2 15 / 60%)',
                    background: 'oklch(0.65 0.2 15 / 8%)',
                    transform: 'rotate(-5deg)',
                  }}
                >
                  <div className="text-xs font-mono text-muted-foreground">📋</div>
                  <div className="text-lg font-black font-mono tracking-wider" style={{ color: 'oklch(0.65 0.2 15)' }}>
                    CASE CLOSED
                  </div>
                </div>
              </motion.div>
            )}

            {/* Summary card */}
            {showSummary && (
              <motion.div
                className="rounded-xl px-6 py-4 text-center"
                style={{
                  background: 'oklch(0.15 0.025 256)',
                  border: '1px solid oklch(0.3 0.05 250 / 30%)',
                  boxShadow: '0 4px 20px oklch(0 0 0 / 30%)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="space-y-1 text-[9px] font-mono">
                  <div><span className="text-muted-foreground">Claim:</span> <span className="text-foreground font-bold">{CLAIM_ID}</span></div>
                  <div><span className="text-muted-foreground">Decision:</span> <span className="font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>{DECISION} — {AMOUNT}</span></div>
                  <div><span className="text-muted-foreground">Confidence:</span> <span className="text-foreground">{CONFIDENCE}</span></div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option A — Grand Envelope Sealing
      </div>
    </div>
  );
}
