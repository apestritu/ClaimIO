"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVAL_ROWS, MEAN_CONFIDENCE, TOTAL_AMOUNT } from './eval-data';

interface CourtroomEvidenceProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Phase = 'idle' | 'presenting' | 'verdict' | 'stacking' | 'done';

export function CourtroomEvidence({ onComplete, autoPlay = true }: CourtroomEvidenceProps) {
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [phase, setPhase] = useState<Phase>('idle');
  const [showFacts, setShowFacts] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [stackedCards, setStackedCards] = useState<number[]>([]);
  const [showFinalStack, setShowFinalStack] = useState(false);
  const [showMeanBadge, setShowMeanBadge] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let baseDelay = 600;

    EVAL_ROWS.forEach((_, i) => {
      const start = baseDelay + i * 3200;

      // Slide doc onto table
      timers.push(setTimeout(() => {
        setCurrentIdx(i);
        setPhase('presenting');
        setShowFacts(false);
        setShowSummary(false);
        setShowVerdict(false);
        setShowConf(false);
      }, start));

      // Show holographic facts
      timers.push(setTimeout(() => setShowFacts(true), start + 500));

      // Show AI summary speech bubble
      timers.push(setTimeout(() => setShowSummary(true), start + 1100));

      // Slam verdict
      timers.push(setTimeout(() => {
        setShowVerdict(true);
      }, start + 1700));

      // Brand confidence
      timers.push(setTimeout(() => setShowConf(true), start + 2100));

      // Stack to the right
      timers.push(setTimeout(() => {
        setPhase('stacking');
        setStackedCards(prev => [...prev, i]);
      }, start + 2700));
    });

    const totalTime = baseDelay + EVAL_ROWS.length * 3200 + 300;
    timers.push(setTimeout(() => {
      setCurrentIdx(-1);
      setShowFinalStack(true);
    }, totalTime));

    timers.push(setTimeout(() => setShowMeanBadge(true), totalTime + 800));
    timers.push(setTimeout(() => onComplete?.(), totalTime + 2500));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const currentRow = currentIdx >= 0 ? EVAL_ROWS[currentIdx] : null;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Spotlight beam */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-full pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, oklch(0.9 0.05 250 / 8%) 0%, transparent 60%)',
          clipPath: 'polygon(35% 0%, 65% 0%, 85% 100%, 15% 100%)',
        }}
      />

      {/* Evidence table surface */}
      <div
        className="absolute bottom-[35%] left-1/2 -translate-x-1/2"
        style={{
          width: 600,
          height: 8,
          borderRadius: 4,
          background: 'linear-gradient(90deg, transparent, oklch(0.4 0.05 250 / 40%), oklch(0.5 0.08 250 / 60%), oklch(0.4 0.05 250 / 40%), transparent)',
          boxShadow: '0 0 30px oklch(0.5 0.08 250 / 20%)',
        }}
      />

      {/* Current document on table */}
      <AnimatePresence mode="wait">
        {currentRow && phase === 'presenting' && (
          <motion.div
            key={`presenting-${currentIdx}`}
            className="absolute flex flex-col items-center"
            style={{ bottom: '37%' }}
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 250, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          >
            {/* Document card */}
            <div
              className="relative rounded-xl p-4"
              style={{
                width: 220,
                background: 'oklch(0.16 0.02 256)',
                border: '1px solid oklch(0.3 0.04 256)',
                boxShadow: `0 0 40px oklch(0.5 0.08 250 / 15%), 0 8px 30px oklch(0 0 0 / 40%)`,
              }}
            >
              {/* Spotlight glow on card */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 50% 0%, oklch(0.8 0.1 250 / 10%), transparent 70%)',
                }}
              />

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{currentRow.icon}</span>
                <div>
                  <div className="text-[10px] font-bold text-foreground">{currentRow.doc}</div>
                  <div className="text-[8px] font-mono text-muted-foreground">{currentRow.type}</div>
                </div>
              </div>

              {/* Holographic facts projecting upward */}
              <AnimatePresence>
                {showFacts && (
                  <motion.div
                    className="mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {currentRow.keyFacts.split(', ').map((fact, fi) => (
                      <motion.div
                        key={fi}
                        className="text-[8px] font-mono py-0.5 px-2 mb-0.5 rounded"
                        style={{
                          background: 'oklch(0.55 0.15 250 / 10%)',
                          color: 'oklch(0.75 0.12 250)',
                          borderLeft: '2px solid oklch(0.6 0.15 250 / 50%)',
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: fi * 0.15 }}
                      >
                        {fact}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Summary speech bubble */}
              <AnimatePresence>
                {showSummary && (
                  <motion.div
                    className="relative rounded-lg p-2 mb-2"
                    style={{
                      background: 'oklch(0.25 0.03 256)',
                      border: '1px solid oklch(0.4 0.05 256)',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <div className="text-[7px] text-muted-foreground mb-0.5">AI SUMMARY</div>
                    <div className="text-[9px] italic text-foreground">&quot;{currentRow.summary}&quot;</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Verdict stamp */}
              <AnimatePresence>
                {showVerdict && (
                  <motion.div
                    className="flex justify-center mb-2"
                    initial={{ opacity: 0, scale: 2.5, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  >
                    <div
                      className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider"
                      style={{
                        background: `${currentRow.impactColor}25`,
                        color: currentRow.impactColor,
                        border: `2px solid ${currentRow.impactColor}60`,
                        boxShadow: `0 0 15px ${currentRow.impactColor}30`,
                      }}
                    >
                      {currentRow.impact}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confidence brand */}
              <AnimatePresence>
                {showConf && (
                  <motion.div
                    className="flex justify-end"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                  >
                    <div
                      className="px-2 py-0.5 rounded-full text-[8px] font-bold"
                      style={{
                        background: currentRow.conf >= 0.9
                          ? 'oklch(0.7 0.17 160 / 20%)'
                          : 'oklch(0.8 0.16 80 / 20%)',
                        color: currentRow.conf >= 0.9
                          ? 'oklch(0.7 0.17 160)'
                          : 'oklch(0.8 0.16 80)',
                      }}
                    >
                      ⚡ {currentRow.conf.toFixed(2)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stacked evaluated pile on the right */}
      <div className="absolute right-12 bottom-[37%]">
        {stackedCards.map((idx, si) => (
          <motion.div
            key={`stack-${idx}`}
            className="absolute rounded-lg"
            style={{
              width: 60,
              height: 80,
              background: 'oklch(0.2 0.03 256)',
              border: '1px solid oklch(0.35 0.04 256)',
              bottom: si * 4,
              right: 0,
              zIndex: si,
            }}
            initial={{ opacity: 0, x: -200, scale: 0.5 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          >
            <div className="flex items-center justify-center h-full">
              <span className="text-lg">{EVAL_ROWS[idx].icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Final stack with mean confidence */}
      <AnimatePresence>
        {showFinalStack && (
          <motion.div
            className="absolute flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150 }}
          >
            <div
              className="w-20 h-28 rounded-lg flex flex-col items-center justify-center gap-1"
              style={{
                background: 'oklch(0.55 0.2 270)',
                boxShadow: '0 0 30px oklch(0.55 0.2 270 / 40%)',
              }}
            >
              <span className="text-2xl">📄</span>
              <span className="text-[7px] font-bold text-white">EVIDENCE</span>
              <span className="text-[7px] font-bold text-white">EVALUATION</span>
            </div>

            <AnimatePresence>
              {showMeanBadge && (
                <motion.div
                  className="px-3 py-1 rounded-full text-[9px] font-bold"
                  style={{
                    background: 'oklch(0.55 0.2 270 / 20%)',
                    color: 'oklch(0.7 0.2 270)',
                    border: '1px solid oklch(0.55 0.2 270 / 40%)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  📊 Mean: {MEAN_CONFIDENCE} · {TOTAL_AMOUNT}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      {currentIdx >= 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground">
            Evidence {currentIdx + 1} / {EVAL_ROWS.length}
          </span>
          <div className="flex gap-1">
            {EVAL_ROWS.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-colors duration-300"
                style={{
                  background: i <= currentIdx
                    ? 'oklch(0.7 0.15 195)'
                    : 'oklch(0.3 0.02 256)',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option B — Courtroom Evidence
      </div>
    </div>
  );
}
