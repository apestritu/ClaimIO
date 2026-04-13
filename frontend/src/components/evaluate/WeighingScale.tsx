"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVAL_ROWS, MEAN_CONFIDENCE, TOTAL_AMOUNT } from './eval-data';

interface WeighingScaleProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

export function WeighingScale({ onComplete, autoPlay = true }: WeighingScaleProps) {
  const [addedDocs, setAddedDocs] = useState<number[]>([]);
  const [addedValues, setAddedValues] = useState<number[]>([]);
  const [showBalance, setShowBalance] = useState(false);
  const [showTotal, setShowTotal] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    EVAL_ROWS.forEach((_, i) => {
      const start = 800 + i * 1800;

      // Drop doc on left pan
      timers.push(setTimeout(() => {
        setAddedDocs(prev => [...prev, i]);
      }, start));

      // Show extracted value on right pan
      timers.push(setTimeout(() => {
        setAddedValues(prev => [...prev, i]);
      }, start + 800));
    });

    const totalTime = 800 + EVAL_ROWS.length * 1800 + 500;
    timers.push(setTimeout(() => setShowBalance(true), totalTime));
    timers.push(setTimeout(() => setShowTotal(true), totalTime + 800));
    timers.push(setTimeout(() => setShowPdf(true), totalTime + 2200));
    timers.push(setTimeout(() => onComplete?.(), totalTime + 3500));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  // Calculate tilt based on difference between docs added and values extracted
  const tilt = useMemo(() => {
    const docWeight = addedDocs.length;
    const valWeight = addedValues.reduce((sum, idx) => sum + EVAL_ROWS[idx].conf, 0);
    if (showBalance) return 0;
    const diff = docWeight - valWeight;
    return Math.max(-8, Math.min(8, diff * 3));
  }, [addedDocs, addedValues, showBalance]);

  const leftPanY = tilt * 2;
  const rightPanY = -tilt * 2;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Scale assembly */}
      <motion.div
        className="relative"
        style={{ width: 650, height: 400 }}
        animate={showPdf ? { scale: 0.3, opacity: 0 } : {}}
        transition={{ duration: 1.2 }}
      >
        {/* Fulcrum / base */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ width: 80, height: 100, zIndex: 10 }}
        >
          {/* Triangle fulcrum */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '30px solid transparent',
              borderRight: '30px solid transparent',
              borderBottom: '40px solid oklch(0.35 0.05 250)',
              filter: 'drop-shadow(0 2px 8px oklch(0 0 0 / 30%))',
            }}
          />
          {/* Base plate */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-md"
            style={{
              width: 100,
              height: 8,
              background: 'oklch(0.3 0.04 250)',
              boxShadow: '0 2px 10px oklch(0 0 0 / 30%)',
            }}
          />
        </div>

        {/* Beam */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: 550,
            height: 6,
            top: 140,
            borderRadius: 3,
            background: 'linear-gradient(90deg, oklch(0.4 0.06 250), oklch(0.5 0.08 250), oklch(0.4 0.06 250))',
            boxShadow: '0 2px 10px oklch(0 0 0 / 25%)',
            transformOrigin: 'center center',
            zIndex: 5,
          }}
          animate={{ rotate: tilt }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        />

        {/* Left chain */}
        <motion.div
          className="absolute"
          style={{ left: 52, top: 146, width: 2, zIndex: 4 }}
          animate={{ height: 60 + leftPanY, y: leftPanY }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        >
          <div className="w-full h-full" style={{ background: 'oklch(0.45 0.06 250)', borderRadius: 1 }} />
        </motion.div>

        {/* Right chain */}
        <motion.div
          className="absolute"
          style={{ right: 52, top: 146, width: 2, zIndex: 4 }}
          animate={{ height: 60 + rightPanY, y: rightPanY }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        >
          <div className="w-full h-full" style={{ background: 'oklch(0.45 0.06 250)', borderRadius: 1 }} />
        </motion.div>

        {/* Left pan — raw documents */}
        <motion.div
          className="absolute"
          style={{ left: 10, width: 180, zIndex: 6 }}
          animate={{ top: 206 + leftPanY }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        >
          {/* Pan dish */}
          <div
            className="w-full h-3 rounded-b-full"
            style={{
              background: 'oklch(0.3 0.05 250)',
              boxShadow: '0 2px 8px oklch(0 0 0 / 25%)',
            }}
          />

          {/* Label */}
          <div className="text-center mt-1">
            <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Raw Evidence</span>
          </div>

          {/* Stacked documents */}
          <div className="relative mt-1 flex flex-col items-center gap-1">
            <AnimatePresence>
              {addedDocs.map((idx) => {
                const row = EVAL_ROWS[idx];
                return (
                  <motion.div
                    key={`doc-${idx}`}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md"
                    style={{
                      background: 'oklch(0.18 0.02 256)',
                      border: '1px solid oklch(0.3 0.03 256)',
                      width: 160,
                    }}
                    initial={{ opacity: 0, y: -40, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <span className="text-xs">{row.icon}</span>
                    <span className="text-[7px] font-mono text-foreground truncate">{row.doc}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right pan — extracted values */}
        <motion.div
          className="absolute"
          style={{ right: 10, width: 200, zIndex: 6 }}
          animate={{ top: 206 + rightPanY }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        >
          {/* Pan dish */}
          <div
            className="w-full h-3 rounded-b-full"
            style={{
              background: 'oklch(0.3 0.05 250)',
              boxShadow: '0 2px 8px oklch(0 0 0 / 25%)',
            }}
          />

          {/* Label */}
          <div className="text-center mt-1">
            <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Extracted Value</span>
          </div>

          {/* Extracted fact items */}
          <div className="relative mt-1 flex flex-col items-center gap-1">
            <AnimatePresence>
              {addedValues.map((idx) => {
                const row = EVAL_ROWS[idx];
                return (
                  <motion.div
                    key={`val-${idx}`}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md"
                    style={{
                      background: `${row.impactColor}10`,
                      border: `1px solid ${row.impactColor}30`,
                      width: 180,
                    }}
                    initial={{ opacity: 0, y: -30, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[7px] font-bold truncate" style={{ color: row.impactColor }}>{row.impact}</div>
                      <div className="text-[6px] font-mono text-muted-foreground italic truncate">&quot;{row.summary}&quot;</div>
                    </div>
                    {/* Weight tag */}
                    <div
                      className="shrink-0 px-1.5 py-0.5 rounded text-[7px] font-bold"
                      style={{
                        background: row.conf >= 0.9
                          ? 'oklch(0.7 0.17 160 / 20%)'
                          : 'oklch(0.8 0.16 80 / 20%)',
                        color: row.conf >= 0.9
                          ? 'oklch(0.7 0.17 160)'
                          : 'oklch(0.8 0.16 80)',
                      }}
                    >
                      {row.conf.toFixed(2)}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Balance / total at fulcrum */}
        <AnimatePresence>
          {showTotal && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
              style={{ top: 70, zIndex: 20 }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <motion.div
                className="px-4 py-2 rounded-xl text-center"
                style={{
                  background: 'oklch(0.15 0.03 256)',
                  border: '2px solid oklch(0.55 0.2 270 / 40%)',
                  boxShadow: '0 0 30px oklch(0.55 0.2 270 / 20%)',
                }}
              >
                <div className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Balanced</div>
                <div className="text-sm font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>{TOTAL_AMOUNT}</div>
                <div className="text-[9px] font-mono mt-0.5" style={{ color: 'oklch(0.7 0.2 270)' }}>Mean: {MEAN_CONFIDENCE}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance indicator */}
        <AnimatePresence>
          {showBalance && !showTotal && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-28"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ zIndex: 15 }}
            >
              <motion.div
                className="text-lg"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5 }}
              >
                ⚖️
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* PDF flying out */}
      <AnimatePresence>
        {showPdf && (
          <motion.div
            className="absolute flex flex-col items-center gap-1"
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
              <span className="text-lg">⚖️</span>
              <span className="text-[6px] font-bold text-white">EVAL</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option E — Weighing Scale
      </div>
    </div>
  );
}
