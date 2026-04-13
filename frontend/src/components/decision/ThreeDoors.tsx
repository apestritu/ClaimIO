"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { METRICS, G_SCORE, THRESHOLD, APPROVED_AMOUNT, VERDICT, DOORS } from './decision-data';

interface ThreeDoorsProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'scoreboard' | 'drumroll' | 'spotlight' | 'open' | 'reveal';

export function ThreeDoors({ onComplete, autoPlay = true }: ThreeDoorsProps) {
  const [stage, setStage] = useState<Stage>('scoreboard');
  const [visibleTerms, setVisibleTerms] = useState<number[]>([]);
  const [showTotal, setShowTotal] = useState(false);
  const [spotlightDoor, setSpotlightDoor] = useState(-1);
  const [selectedDoor, setSelectedDoor] = useState(-1);
  const [doorOpen, setDoorOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const startedRef = useRef(false);

  const verdictDoorIdx = VERDICT === 'approve' ? 0 : VERDICT === 'deny' ? 1 : 2;

  // Build the math terms
  const terms = METRICS.map(m => ({
    label: m.label,
    value: m.subtract ? -(m.value * m.weight) : m.value * m.weight,
    color: m.color,
    icon: m.icon,
  }));

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Scoreboard: terms fly in
    terms.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleTerms(prev => [...prev, i]);
      }, 500 + i * 700));
    });

    // Show total
    const totalTime = 500 + terms.length * 700 + 600;
    timers.push(setTimeout(() => setShowTotal(true), totalTime));

    // Drumroll
    timers.push(setTimeout(() => setStage('drumroll'), totalTime + 1200));

    // Spotlight sweep
    const sweepStart = totalTime + 2400;
    timers.push(setTimeout(() => setStage('spotlight'), sweepStart));

    // Sweep across doors
    const sweepSequence = [0, 1, 2, 0, 2, 1, 2, 0, verdictDoorIdx];
    sweepSequence.forEach((door, i) => {
      timers.push(setTimeout(() => setSpotlightDoor(door), sweepStart + 200 + i * 300));
    });

    // Lock onto verdict door
    const lockTime = sweepStart + 200 + sweepSequence.length * 300 + 400;
    timers.push(setTimeout(() => {
      setStage('open');
      setSelectedDoor(verdictDoorIdx);
      setSpotlightDoor(verdictDoorIdx);
    }, lockTime));

    // Open door
    timers.push(setTimeout(() => {
      setDoorOpen(true);
      setStage('reveal');
      if (VERDICT === 'approve') setShowConfetti(true);
    }, lockTime + 1000));

    timers.push(setTimeout(() => onComplete?.(), lockTime + 4000));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete, terms, verdictDoorIdx]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden gap-6">
      {/* Stage spotlights */}
      <div className="absolute top-0 left-0 right-0 h-4 flex justify-center gap-40">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-[200px] h-[300px]"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${spotlightDoor === i ? 'oklch(0.9 0.05 80 / 8%)' : 'transparent'} 0%, transparent 70%)`,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Scoreboard */}
      <AnimatePresence>
        {(stage === 'scoreboard' || stage === 'drumroll') && (
          <motion.div
            className="flex flex-col items-center gap-3"
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
              🎰 Confidence Scoreboard
            </span>

            {/* Math terms */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {terms.map((term, i) => (
                <AnimatePresence key={i}>
                  {visibleTerms.includes(i) && (
                    <motion.div
                      className="flex items-center gap-1"
                      initial={{ opacity: 0, y: -20, scale: 0.5 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      {i > 0 && (
                        <span className="text-[10px] font-mono text-muted-foreground mx-0.5">
                          {term.value >= 0 ? '+' : '−'}
                        </span>
                      )}
                      <div
                        className="px-2.5 py-1.5 rounded-lg text-center"
                        style={{
                          background: `${term.color}12`,
                          border: `1px solid ${term.color}30`,
                        }}
                      >
                        <div className="text-[7px] font-mono text-muted-foreground">{term.icon} {term.label}</div>
                        <div className="text-xs font-mono font-bold" style={{ color: term.color }}>
                          {Math.abs(term.value).toFixed(3)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}
            </div>

            {/* Total G score */}
            <AnimatePresence>
              {showTotal && (
                <motion.div
                  className="flex items-center gap-3 px-5 py-2 rounded-xl"
                  style={{
                    background: 'oklch(0.15 0.02 256)',
                    border: `2px solid ${G_SCORE >= THRESHOLD ? 'oklch(0.7 0.17 160 / 40%)' : 'oklch(0.65 0.2 15 / 40%)'}`,
                    boxShadow: `0 0 20px ${G_SCORE >= THRESHOLD ? 'oklch(0.7 0.17 160 / 15%)' : 'oklch(0.65 0.2 15 / 15%)'}`,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: stage === 'drumroll' ? [1, 1.05, 1] : 1 }}
                  transition={stage === 'drumroll' ? { duration: 0.4, repeat: Infinity } : { type: 'spring', stiffness: 200 }}
                >
                  <span className="text-[10px] font-mono text-muted-foreground">=</span>
                  <span className="text-lg font-bold font-mono" style={{ color: G_SCORE >= THRESHOLD ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)' }}>
                    G = {G_SCORE.toFixed(2)}
                  </span>
                  <span className="text-[8px] font-mono text-muted-foreground">
                    (threshold: {THRESHOLD})
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Three Doors */}
      <div className="flex gap-6">
        {DOORS.map((door, i) => {
          const isSpotlit = spotlightDoor === i;
          const isSelected = selectedDoor === i;
          const isDimmed = selectedDoor >= 0 && selectedDoor !== i;
          const isOpen = doorOpen && isSelected;

          return (
            <motion.div
              key={door.label}
              className="relative"
              animate={{
                scale: isSelected ? 1.08 : isDimmed ? 0.85 : 1,
                opacity: isDimmed ? 0.25 : 1,
              }}
              transition={{ type: 'spring', stiffness: 150, damping: 15 }}
            >
              {/* Door frame */}
              <div
                className="relative w-36 h-52 rounded-xl overflow-hidden"
                style={{
                  background: 'oklch(0.14 0.02 256)',
                  border: `2px solid ${isSelected ? door.color : isSpotlit ? `${door.color}60` : 'oklch(0.25 0.03 256)'}`,
                  boxShadow: isSelected
                    ? `0 0 40px ${door.color}30`
                    : isSpotlit
                      ? `0 0 20px ${door.color}15`
                      : 'none',
                }}
              >
                {/* Door surface */}
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                  style={{
                    background: isOpen ? door.bg : 'oklch(0.16 0.02 256)',
                    transformOrigin: 'left center',
                  }}
                  animate={isOpen ? { rotateY: -75, opacity: 0.3 } : {}}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                >
                  {/* Door handle */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-6 rounded-full"
                    style={{ background: 'oklch(0.35 0.05 250)' }} />

                  <span className="text-3xl">{door.icon}</span>
                  <span className="text-xs font-bold font-mono" style={{ color: door.color }}>
                    {door.label}
                  </span>

                  {/* Door number */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: `${door.color}20`, border: `1px solid ${door.color}30` }}>
                    <span className="text-[10px] font-bold" style={{ color: door.color }}>{i + 1}</span>
                  </div>
                </motion.div>

                {/* Reveal behind door */}
                {isOpen && (
                  <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3"
                    style={{
                      background: i === 0
                        ? 'linear-gradient(135deg, oklch(0.15 0.04 160), oklch(0.12 0.02 256))'
                        : i === 1
                          ? 'linear-gradient(135deg, oklch(0.15 0.04 15), oklch(0.12 0.02 256))'
                          : 'linear-gradient(135deg, oklch(0.18 0.04 80), oklch(0.12 0.02 256))',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {i === 0 && (
                      <>
                        <motion.div className="text-2xl" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.6 }}>✅</motion.div>
                        <div className="text-xs font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>APPROVED</div>
                        <div className="text-lg font-bold font-mono" style={{ color: 'oklch(0.7 0.17 160)' }}>{APPROVED_AMOUNT}</div>
                      </>
                    )}
                    {i === 1 && (
                      <>
                        <motion.div className="text-2xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }}>❌</motion.div>
                        <div className="text-xs font-bold" style={{ color: 'oklch(0.65 0.2 15)' }}>DENIED</div>
                      </>
                    )}
                    {i === 2 && (
                      <>
                        <motion.div className="text-2xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }}>👤</motion.div>
                        <div className="text-[9px] font-bold text-center" style={{ color: 'oklch(0.8 0.16 80)' }}>AWAITING HUMAN REVIEW</div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Selection glow ring */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ border: `2px solid ${door.color}` }}
                    animate={{ scale: [1, 1.06], opacity: [0.5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* G score compact (during door phase) */}
      {(stage === 'spotlight' || stage === 'open' || stage === 'reveal') && (
        <motion.div
          className="px-4 py-1.5 rounded-full"
          style={{
            background: 'oklch(0.15 0.02 256)',
            border: `1px solid ${G_SCORE >= THRESHOLD ? 'oklch(0.7 0.17 160 / 30%)' : 'oklch(0.65 0.2 15 / 30%)'}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-[10px] font-mono font-bold" style={{ color: G_SCORE >= THRESHOLD ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)' }}>
            G = {G_SCORE.toFixed(2)}
          </span>
        </motion.div>
      )}

      {/* Confetti */}
      {showConfetti && Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: ['oklch(0.7 0.17 160)', 'oklch(0.8 0.16 80)', 'oklch(0.62 0.19 250)', 'oklch(0.7 0.15 195)', 'oklch(0.9 0.05 80)'][i % 5],
            left: '50%', top: '50%',
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 400,
            opacity: 0, scale: 0,
          }}
          transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
        />
      ))}

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option C — Three Doors Game Show
      </div>
    </div>
  );
}
