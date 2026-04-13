"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVAL_ROWS, MEAN_CONFIDENCE, TOTAL_AMOUNT, type EvalRow } from './eval-data';

interface DetectiveWallProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

const PIN_POSITIONS = [
  { x: 60, y: 40 },
  { x: 340, y: 30 },
  { x: 60, y: 220 },
  { x: 340, y: 210 },
  { x: 200, y: 130 },
];

const IMPACT_TAGS = [
  { x: 620, y: 50 },
  { x: 620, y: 120 },
  { x: 620, y: 190 },
  { x: 620, y: 260 },
  { x: 620, y: 330 },
];

export function DetectiveWall({ onComplete, autoPlay = true }: DetectiveWallProps) {
  const [pinnedCards, setPinnedCards] = useState<number[]>([]);
  const [showStrings, setShowStrings] = useState<number[]>([]);
  const [showStamps, setShowStamps] = useState<number[]>([]);
  const [showZoomOut, setShowZoomOut] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    EVAL_ROWS.forEach((_, i) => {
      // Pin card
      timers.push(setTimeout(() => {
        setPinnedCards(prev => [...prev, i]);
      }, 800 + i * 1200));

      // Draw string
      timers.push(setTimeout(() => {
        setShowStrings(prev => [...prev, i]);
      }, 800 + i * 1200 + 600));

      // Stamp confidence
      timers.push(setTimeout(() => {
        setShowStamps(prev => [...prev, i]);
      }, 800 + i * 1200 + 900));
    });

    // Zoom out
    const totalCardTime = 800 + EVAL_ROWS.length * 1200 + 500;
    timers.push(setTimeout(() => setShowZoomOut(true), totalCardTime));
    timers.push(setTimeout(() => setShowPdf(true), totalCardTime + 1500));
    timers.push(setTimeout(() => onComplete?.(), totalCardTime + 3000));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const handleReplay = () => {
    setPinnedCards([]);
    setShowStrings([]);
    setShowStamps([]);
    setShowZoomOut(false);
    setShowPdf(false);
    startedRef.current = false;
    setTimeout(() => { startedRef.current = false; }, 50);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Cork board background */}
      <motion.div
        className="relative"
        style={{
          width: 760,
          height: 420,
          borderRadius: 16,
          background: 'linear-gradient(135deg, oklch(0.22 0.04 60), oklch(0.18 0.03 50))',
          border: '3px solid oklch(0.35 0.06 60)',
          boxShadow: 'inset 0 0 60px oklch(0 0 0 / 40%), 0 8px 40px oklch(0 0 0 / 50%)',
        }}
        animate={showZoomOut ? { scale: 0.6, opacity: 0.3 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      >
        {/* Cork texture overlay */}
        <div
          className="absolute inset-0 rounded-xl opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, oklch(0.4 0.06 60) 1px, transparent 1px),
                             radial-gradient(circle at 60% 70%, oklch(0.4 0.06 60) 1px, transparent 1px),
                             radial-gradient(circle at 80% 20%, oklch(0.35 0.05 55) 1px, transparent 1px)`,
            backgroundSize: '30px 30px, 25px 25px, 35px 35px',
          }}
        />

        {/* Warm spotlight */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, oklch(0.5 0.1 80 / 15%), transparent 70%)',
          }}
        />

        {/* SVG strings layer */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5 }}>
          {showStrings.map((idx) => {
            const from = PIN_POSITIONS[idx];
            const to = IMPACT_TAGS[idx];
            const midX = (from.x + 130 + to.x) / 2;
            const midY = (from.y + 60 + to.y + 15) / 2 - 20;
            return (
              <motion.path
                key={`string-${idx}`}
                d={`M ${from.x + 130} ${from.y + 60} Q ${midX} ${midY} ${to.x} ${to.y + 15}`}
                fill="none"
                stroke="oklch(0.6 0.2 25)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            );
          })}
        </svg>

        {/* Pinned cards */}
        <AnimatePresence>
          {pinnedCards.map((idx) => {
            const row = EVAL_ROWS[idx];
            const pos = PIN_POSITIONS[idx];
            return (
              <motion.div
                key={`card-${idx}`}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: 200,
                  zIndex: 10,
                }}
                initial={{ opacity: 0, scale: 0.3, y: -80, rotate: -15 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  rotate: (idx % 2 === 0 ? -2 : 2) + (idx % 3 === 0 ? 1 : -1),
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 12,
                }}
              >
                {/* Pin */}
                <motion.div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-20"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, oklch(0.7 0.2 25), oklch(0.5 0.2 25))',
                    boxShadow: '0 2px 4px oklch(0 0 0 / 40%)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5, 1] }}
                  transition={{ duration: 0.3 }}
                />

                {/* Card body */}
                <div
                  className="rounded-lg p-3 relative"
                  style={{
                    background: 'oklch(0.95 0.01 80)',
                    boxShadow: '2px 3px 8px oklch(0 0 0 / 30%)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-sm">{row.icon}</span>
                    <span className="text-[9px] font-bold text-gray-800 truncate">{row.doc}</span>
                  </div>
                  <div
                    className="text-[7px] font-mono px-1.5 py-0.5 rounded mb-1.5 inline-block"
                    style={{ background: 'oklch(0.9 0.02 250)', color: 'oklch(0.4 0.1 250)' }}
                  >
                    {row.type}
                  </div>

                  {/* Key facts */}
                  <p className="text-[7px] text-gray-600 font-mono mb-1">{row.keyFacts}</p>

                  {/* AI Summary */}
                  <p className="text-[8px] italic text-gray-700 border-l-2 border-amber-400 pl-1.5">
                    &quot;{row.summary}&quot;
                  </p>

                  {/* Confidence stamp */}
                  <AnimatePresence>
                    {showStamps.includes(idx) && (
                      <motion.div
                        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: row.conf >= 0.9
                            ? 'oklch(0.7 0.17 160 / 90%)'
                            : 'oklch(0.8 0.16 80 / 90%)',
                          border: '2px solid white',
                          boxShadow: '0 2px 6px oklch(0 0 0 / 30%)',
                        }}
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        <span className="text-[9px] font-black text-white">{row.conf.toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Impact tags on the right */}
        <AnimatePresence>
          {showStrings.map((idx) => {
            const row = EVAL_ROWS[idx];
            const tagPos = IMPACT_TAGS[idx];
            return (
              <motion.div
                key={`tag-${idx}`}
                className="absolute px-2.5 py-1.5 rounded-md text-[8px] font-bold"
                style={{
                  left: tagPos.x,
                  top: tagPos.y,
                  background: `${row.impactColor}20`,
                  color: row.impactColor,
                  border: `1px solid ${row.impactColor}40`,
                  zIndex: 10,
                }}
                initial={{ opacity: 0, x: 30, scale: 0.5 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {row.impact}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Board title */}
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded text-[10px] font-bold tracking-widest uppercase"
          style={{
            color: 'oklch(0.8 0.06 60)',
            background: 'oklch(0 0 0 / 30%)',
            zIndex: 15,
          }}
        >
          🕵️ Evidence Board
        </div>
      </motion.div>

      {/* PDF flying away */}
      <AnimatePresence>
        {showPdf && (
          <motion.div
            className="absolute flex flex-col items-center gap-2"
            initial={{ opacity: 1, scale: 0.8 }}
            animate={{ opacity: 0, scale: 0.2, x: 300, y: 200 }}
            transition={{ duration: 1.2, ease: 'easeIn' }}
          >
            <div
              className="w-14 h-18 rounded-lg flex flex-col items-center justify-center gap-1"
              style={{
                background: 'oklch(0.55 0.2 270)',
                boxShadow: '0 0 25px oklch(0.55 0.2 270 / 40%)',
              }}
            >
              <span className="text-lg">📄</span>
              <span className="text-[6px] font-bold text-white">EVAL</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay button */}
      {showPdf && (
        <motion.button
          className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg text-[10px] font-bold"
          style={{
            background: 'oklch(0.55 0.2 270 / 20%)',
            color: 'oklch(0.7 0.2 270)',
            border: '1px solid oklch(0.55 0.2 270 / 30%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReplay}
        >
          ↻ Replay
        </motion.button>
      )}
    </div>
  );
}
