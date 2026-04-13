"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIM_ID, DECISION, AMOUNT, CONFIDENCE, EMAIL_LINES, ATTACHMENTS } from './closenotify-data';

interface TimeCapsuleProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'scroll' | 'roll' | 'capsule' | 'seal' | 'copy' | 'descend' | 'plaque' | 'done';

export function TimeCapsule({ onComplete, autoPlay = true }: TimeCapsuleProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [scrollLines, setScrollLines] = useState(0);
  const [attachCount, setAttachCount] = useState(0);
  const [lidRotation, setLidRotation] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setStage('scroll'), 400));

    // Scroll text + attachments
    EMAIL_LINES.forEach((_, i) => {
      t.push(setTimeout(() => setScrollLines(i + 1), 800 + i * 700));
    });
    ATTACHMENTS.forEach((_, i) => {
      t.push(setTimeout(() => setAttachCount(i + 1), 3200 + i * 500));
    });

    // Roll up scroll
    t.push(setTimeout(() => setStage('roll'), 5000));

    // Place in capsule
    t.push(setTimeout(() => setStage('capsule'), 6000));

    // Seal lid
    t.push(setTimeout(() => {
      setStage('seal');
      const sealInterval = setInterval(() => {
        setLidRotation(prev => {
          if (prev >= 360) { clearInterval(sealInterval); return 360; }
          return prev + 15;
        });
      }, 30);
      t.push(setTimeout(() => clearInterval(sealInterval), 1200) as unknown as ReturnType<typeof setTimeout>);
    }, 7000));

    // Copy flies off (email sent)
    t.push(setTimeout(() => setStage('copy'), 8400));

    // Original descends into vault
    t.push(setTimeout(() => setStage('descend'), 9600));

    // Plaque
    t.push(setTimeout(() => setStage('plaque'), 10800));
    t.push(setTimeout(() => setStage('done'), 12000));
    t.push(setTimeout(() => onComplete?.(), 13500));

    return () => t.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const scrollVisible = stage === 'scroll' || stage === 'roll';
  const capsuleVisible = stage === 'capsule' || stage === 'seal' || stage === 'copy' || stage === 'descend';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          🕰️ Time Capsule — Close & Notify
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Scroll phase */}
        {scrollVisible && (
          <motion.div
            key="scroll"
            className="relative flex flex-col items-center"
            exit={{ scaleY: 0.1, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Scroll top rod */}
            <div className="w-48 h-3 rounded-full" style={{ background: 'oklch(0.35 0.06 40)', boxShadow: '0 2px 6px oklch(0 0 0 / 30%)' }} />

            {/* Scroll body */}
            <motion.div
              className="w-44 rounded-b-lg px-4 py-3 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, oklch(0.88 0.02 80), oklch(0.82 0.03 60))',
                boxShadow: '2px 2px 10px oklch(0 0 0 / 20%)',
              }}
              animate={stage === 'roll' ? { height: 0, paddingTop: 0, paddingBottom: 0 } : { height: 'auto' }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-1.5">
                {EMAIL_LINES.slice(0, scrollLines).map((line, i) => (
                  <motion.div
                    key={i}
                    className="text-[8px] font-mono"
                    style={{
                      color: line.includes('APPROVED') ? 'oklch(0.35 0.12 160)' : 'oklch(0.3 0.04 256)',
                      fontWeight: line.includes('Decision') || line.includes('Amount') ? 700 : 400,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {line}
                  </motion.div>
                ))}

                {/* Attachments placed inside */}
                {attachCount > 0 && (
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {ATTACHMENTS.slice(0, attachCount).map((att, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                        style={{ background: `${att.color}20`, border: `1px solid ${att.color}30` }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <span className="text-[7px]">{att.icon}</span>
                        <span className="text-[5px] font-mono" style={{ color: 'oklch(0.3 0.04 256)' }}>{att.name.replace('.pdf', '')}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Scroll bottom rod */}
            <div className="w-48 h-3 rounded-full" style={{ background: 'oklch(0.35 0.06 40)', boxShadow: '0 2px 6px oklch(0 0 0 / 30%)' }} />
          </motion.div>
        )}

        {/* Capsule phase */}
        {capsuleVisible && (
          <motion.div
            key="capsule"
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: stage === 'descend' ? 0 : 1,
              scale: stage === 'descend' ? 0.5 : 1,
              y: stage === 'descend' ? 200 : 0,
            }}
            transition={{ duration: stage === 'descend' ? 0.8 : 0.5, type: 'spring', stiffness: 150 }}
          >
            {/* Capsule body */}
            <div className="relative" style={{ width: 100, height: 160 }}>
              {/* Lid */}
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-8 rounded-t-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, oklch(0.4 0.06 250), oklch(0.3 0.05 256))',
                  border: '2px solid oklch(0.45 0.07 250 / 50%)',
                  zIndex: 5,
                }}
                animate={{ rotate: lidRotation > 0 ? [0, 5, -5, 0] : 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'oklch(0.5 0.08 250)', border: '1px solid oklch(0.6 0.1 250)' }}
                  animate={{ rotate: lidRotation }}
                  transition={{ duration: 0.03 }}
                />
              </motion.div>

              {/* Body cylinder */}
              <div
                className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-32 rounded-b-2xl flex flex-col items-center justify-center gap-1 overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, oklch(0.25 0.04 250), oklch(0.2 0.035 256))',
                  border: '2px solid oklch(0.4 0.06 250 / 40%)',
                  boxShadow: '0 4px 20px oklch(0 0 0 / 40%), inset 0 0 10px oklch(0.4 0.06 250 / 10%)',
                }}
              >
                {/* Engraved claim ID */}
                <span className="text-[6px] font-mono font-bold" style={{ color: 'oklch(0.5 0.07 250)' }}>{CLAIM_ID}</span>
                <span className="text-lg">📜</span>

                {/* Metallic bands */}
                <div className="absolute top-4 left-0 right-0 h-0.5" style={{ background: 'oklch(0.4 0.06 250 / 30%)' }} />
                <div className="absolute bottom-4 left-0 right-0 h-0.5" style={{ background: 'oklch(0.4 0.06 250 / 30%)' }} />
              </div>
            </div>

            {/* Sealed indicator */}
            {stage === 'seal' && lidRotation >= 360 && (
              <motion.span
                className="text-[8px] font-mono font-bold mt-2"
                style={{ color: 'oklch(0.7 0.17 160)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                🔒 Sealed
              </motion.span>
            )}

            {/* Copy flying off (email) */}
            {stage === 'copy' && (
              <motion.div
                className="absolute"
                initial={{ x: 0, y: 0, opacity: 0.8 }}
                animate={{ x: 300, y: -100, opacity: 0, scale: 0.5 }}
                transition={{ duration: 1 }}
              >
                <div className="w-12 h-16 rounded-lg flex items-center justify-center" style={{
                  background: 'oklch(0.25 0.04 250 / 80%)',
                  border: '1px solid oklch(0.4 0.06 250 / 40%)',
                }}>
                  <span className="text-xs">📧</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Vault / plaque phase */}
        {(stage === 'plaque' || stage === 'done') && (
          <motion.div
            key="plaque"
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Vault floor panel */}
            <div className="relative w-40 h-8 rounded-lg overflow-hidden" style={{
              background: 'oklch(0.18 0.03 250)',
              border: '2px solid oklch(0.3 0.05 250 / 40%)',
            }}>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'oklch(0.12 0.02 256)' }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
              <div className="relative flex items-center justify-center h-full">
                <span className="text-[7px] font-mono" style={{ color: 'oklch(0.4 0.06 250)' }}>🔒 ARCHIVED</span>
              </div>
            </div>

            {/* Plaque */}
            <motion.div
              className="px-8 py-5 rounded-xl text-center"
              style={{
                background: 'oklch(0.15 0.025 256)',
                border: '2px solid oklch(0.35 0.06 40 / 50%)',
                boxShadow: '0 4px 20px oklch(0 0 0 / 30%), inset 0 1px 0 oklch(0.4 0.06 40 / 15%)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            >
              <div className="text-[7px] font-mono text-muted-foreground mb-2">═══ CASE PLAQUE ═══</div>
              <div className="text-sm font-black font-mono" style={{ color: 'oklch(0.8 0.16 80)' }}>CASE CLOSED</div>
              <div className="text-[9px] font-mono text-foreground mt-1">{CLAIM_ID}</div>
              <div className="mt-2 space-y-0.5 text-[8px] font-mono">
                <div><span className="text-muted-foreground">Decision:</span> <span style={{ color: 'oklch(0.7 0.17 160)' }}>{DECISION} — {AMOUNT}</span></div>
                <div><span className="text-muted-foreground">Confidence:</span> <span className="text-foreground">{CONFIDENCE}</span></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option C — Time Capsule / Archive
      </div>
    </div>
  );
}
