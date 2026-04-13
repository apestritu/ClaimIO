"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIM_ID, DECISION, AMOUNT, CONFIDENCE, EMAIL_LINES, ATTACHMENTS } from './closenotify-data';

interface MissionControlProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'compose' | 'attachCheck' | 'transmit' | 'signal' | 'complete' | 'powerdown' | 'done';

export function MissionControl({ onComplete, autoPlay = true }: MissionControlProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [visibleLines, setVisibleLines] = useState(0);
  const [checkedAttachments, setCheckedAttachments] = useState<number[]>([]);
  const [signalRings, setSignalRings] = useState(0);
  const [poweredScreens, setPoweredScreens] = useState<boolean[]>([true, true, true]);
  const [showTicker, setShowTicker] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setStage('compose'), 400));

    EMAIL_LINES.forEach((_, i) => {
      t.push(setTimeout(() => setVisibleLines(i + 1), 800 + i * 800));
    });

    t.push(setTimeout(() => setStage('attachCheck'), 3400));
    ATTACHMENTS.forEach((_, i) => {
      t.push(setTimeout(() => setCheckedAttachments(prev => [...prev, i]), 3800 + i * 600));
    });

    t.push(setTimeout(() => setStage('transmit'), 5800));

    // Signal rings
    t.push(setTimeout(() => setSignalRings(1), 6200));
    t.push(setTimeout(() => setSignalRings(2), 6600));
    t.push(setTimeout(() => setSignalRings(3), 7000));

    t.push(setTimeout(() => setStage('signal'), 7400));
    t.push(setTimeout(() => setStage('complete'), 8400));
    t.push(setTimeout(() => setShowTicker(true), 8800));

    // Power down screens one by one
    t.push(setTimeout(() => setStage('powerdown'), 10000));
    t.push(setTimeout(() => setPoweredScreens([true, true, false]), 10400));
    t.push(setTimeout(() => setPoweredScreens([true, false, false]), 10800));

    t.push(setTimeout(() => setStage('done'), 11500));
    t.push(setTimeout(() => onComplete?.(), 13000));

    return () => t.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const isComplete = stage === 'complete' || stage === 'powerdown' || stage === 'done';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          🛰️ Mission Control — Close & Notify
        </span>
      </div>

      <div className="relative flex gap-4" style={{ width: 650, height: 320 }}>
        {/* LEFT SCREEN — Email composition */}
        <motion.div
          className="flex-1 rounded-xl overflow-hidden relative"
          style={{
            background: 'oklch(0.08 0.02 160)',
            border: `2px solid ${isComplete ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.25 0.04 160 / 40%)'}`,
            boxShadow: `inset 0 0 15px oklch(0 0 0 / 30%), 0 0 ${isComplete ? '15px oklch(0.7 0.17 160 / 10%)' : '8px oklch(0 0 0 / 20%)'}`,
            opacity: poweredScreens[0] ? 1 : 0.15,
            transition: 'opacity 0.4s',
          }}
        >
          {/* CRT scanline */}
          <motion.div className="absolute inset-0 pointer-events-none" style={{
            background: 'repeating-linear-gradient(0deg, oklch(0.5 0.1 160 / 3%) 0px, transparent 2px, transparent 4px)',
          }} />

          <div className="px-3 py-2" style={{ borderBottom: '1px solid oklch(0.2 0.03 160)' }}>
            <span className="text-[7px] font-mono" style={{ color: 'oklch(0.5 0.08 160)' }}>SCREEN 1 — EMAIL COMPOSER</span>
          </div>

          <div className="px-3 py-2 space-y-1">
            {isComplete ? (
              <motion.div className="text-center py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-xl mb-1">✅</div>
                <div className="text-[9px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>MISSION COMPLETE</div>
              </motion.div>
            ) : (
              EMAIL_LINES.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={i}
                  className="text-[8px] font-mono leading-relaxed"
                  style={{
                    color: line.includes('APPROVED') ? 'oklch(0.7 0.17 160)' : 'oklch(0.6 0.1 160)',
                    textShadow: '0 0 4px oklch(0.5 0.1 160 / 30%)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {line}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* CENTER SCREEN — Main console */}
        <motion.div
          className="flex-1 rounded-xl overflow-hidden relative"
          style={{
            background: 'oklch(0.08 0.02 160)',
            border: `2px solid ${isComplete ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.3 0.05 160 / 40%)'}`,
            boxShadow: `inset 0 0 15px oklch(0 0 0 / 30%), 0 0 ${isComplete ? '20px oklch(0.7 0.17 160 / 15%)' : '8px oklch(0 0 0 / 20%)'}`,
            opacity: poweredScreens[1] ? 1 : 0.15,
            transition: 'opacity 0.4s',
          }}
        >
          <div className="px-3 py-2" style={{ borderBottom: '1px solid oklch(0.2 0.03 160)' }}>
            <span className="text-[7px] font-mono" style={{ color: 'oklch(0.5 0.08 160)' }}>MAIN CONSOLE</span>
          </div>

          <div className="flex flex-col items-center justify-center h-[calc(100%-30px)] gap-3 px-3">
            {/* Transmit button */}
            {!isComplete && (
              <motion.div
                className="px-6 py-2 rounded-lg text-center"
                style={{
                  background: stage === 'transmit' || stage === 'signal'
                    ? 'oklch(0.7 0.17 160 / 20%)'
                    : 'oklch(0.55 0.15 250 / 15%)',
                  border: `2px solid ${stage === 'transmit' || stage === 'signal' ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.55 0.15 250 / 30%)'}`,
                }}
                animate={stage === 'transmit' ? { scale: [1, 0.95, 1] } : stage === 'signal' ? {} : { scale: [1, 1.02, 1] }}
                transition={{ duration: 1.5, repeat: stage === 'signal' ? 0 : Infinity }}
              >
                <span className="text-[9px] font-mono font-bold" style={{ color: stage === 'transmit' || stage === 'signal' ? 'oklch(0.7 0.17 160)' : 'oklch(0.55 0.15 250)' }}>
                  {stage === 'signal' ? '📡 TRANSMITTING...' : 'TRANSMIT'}
                </span>
              </motion.div>
            )}

            {/* Signal rings */}
            {signalRings > 0 && !isComplete && (
              <div className="relative w-20 h-20">
                {Array.from({ length: signalRings }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full"
                    style={{ border: '1px solid oklch(0.7 0.17 160 / 30%)' }}
                    initial={{ scale: 0.3, opacity: 0.6 }}
                    animate={{ scale: 1 + i * 0.4, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span className="text-lg" animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 1, repeat: Infinity }}>📡</motion.span>
                </div>
              </div>
            )}

            {/* Complete state */}
            {isComplete && (
              <motion.div className="text-center py-4" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                <div className="text-xl mb-1">✅</div>
                <div className="text-xs font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>MISSION COMPLETE</div>
                <div className="text-[8px] font-mono text-muted-foreground mt-1">Transmission confirmed</div>

                {/* Summary */}
                <div className="mt-3 space-y-0.5 text-[7px] font-mono text-left">
                  <div><span className="text-muted-foreground">Claim:</span> <span className="text-foreground">{CLAIM_ID}</span></div>
                  <div><span className="text-muted-foreground">Decision:</span> <span style={{ color: 'oklch(0.7 0.17 160)' }}>{DECISION} — {AMOUNT}</span></div>
                  <div><span className="text-muted-foreground">Confidence:</span> <span className="text-foreground">{CONFIDENCE}</span></div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* RIGHT SCREEN — Attachments checklist */}
        <motion.div
          className="flex-1 rounded-xl overflow-hidden relative"
          style={{
            background: 'oklch(0.08 0.02 160)',
            border: `2px solid ${isComplete ? 'oklch(0.7 0.17 160 / 50%)' : 'oklch(0.25 0.04 160 / 40%)'}`,
            boxShadow: `inset 0 0 15px oklch(0 0 0 / 30%), 0 0 8px oklch(0 0 0 / 20%)`,
            opacity: poweredScreens[2] ? 1 : 0.15,
            transition: 'opacity 0.4s',
          }}
        >
          <div className="px-3 py-2" style={{ borderBottom: '1px solid oklch(0.2 0.03 160)' }}>
            <span className="text-[7px] font-mono" style={{ color: 'oklch(0.5 0.08 160)' }}>SCREEN 3 — ATTACHMENTS</span>
          </div>

          <div className="px-3 py-2 space-y-2">
            {isComplete ? (
              <motion.div className="text-center py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-xl mb-1">✅</div>
                <div className="text-[9px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>MISSION COMPLETE</div>
              </motion.div>
            ) : (
              ATTACHMENTS.map((att, i) => {
                const isChecked = checkedAttachments.includes(i);
                return (
                  <motion.div
                    key={att.name}
                    className="flex items-center gap-2 px-2 py-1.5 rounded"
                    style={{
                      background: isChecked ? `${att.color}10` : 'oklch(0.12 0.02 256)',
                      border: `1px solid ${isChecked ? `${att.color}30` : 'oklch(0.2 0.03 256)'}`,
                    }}
                    animate={{ opacity: isChecked ? 1 : 0.4 }}
                  >
                    <span className="text-[9px]">{isChecked ? '✅' : '⬜'}</span>
                    <span className="text-[7px] font-mono" style={{ color: isChecked ? att.color : 'oklch(0.4 0.03 256)', textShadow: isChecked ? `0 0 4px ${att.color}30` : 'none' }}>
                      {att.name}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Ticker tape */}
      {showTicker && (
        <motion.div
          className="absolute bottom-12 left-0 right-0 h-6 flex items-center overflow-hidden"
          style={{
            background: 'oklch(0.1 0.02 160)',
            borderTop: '1px solid oklch(0.2 0.03 160)',
            borderBottom: '1px solid oklch(0.2 0.03 160)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="whitespace-nowrap text-[8px] font-mono"
            style={{ color: 'oklch(0.7 0.17 160)' }}
            animate={{ x: [600, -800] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          >
            ■ Claim {CLAIM_ID} — CLOSED — {DECISION} — {AMOUNT} — Confidence: {CONFIDENCE} ■ All documents transmitted ■ Case filed ■
          </motion.div>
        </motion.div>
      )}

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option B — Mission Control
      </div>
    </div>
  );
}
