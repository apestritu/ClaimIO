"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVAL_ROWS, MEAN_CONFIDENCE, TOTAL_AMOUNT } from './eval-data';

interface LabDashboardProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

export function LabDashboard({ onComplete, autoPlay = true }: LabDashboardProps) {
  const [activePanels, setActivePanels] = useState<number[]>([]);
  const [factsVisible, setFactsVisible] = useState<number[]>([]);
  const [summaryVisible, setSummaryVisible] = useState<number[]>([]);
  const [impactFill, setImpactFill] = useState<number[]>([]);
  const [confFill, setConfFill] = useState<number[]>([]);
  const [showMerge, setShowMerge] = useState(false);
  const [showTotal, setShowTotal] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    EVAL_ROWS.forEach((_, i) => {
      const start = 400 + i * 2000;

      // CRT flicker on
      timers.push(setTimeout(() => setActivePanels(prev => [...prev, i]), start));

      // Stream facts
      timers.push(setTimeout(() => setFactsVisible(prev => [...prev, i]), start + 400));

      // AI summary
      timers.push(setTimeout(() => setSummaryVisible(prev => [...prev, i]), start + 800));

      // Impact bar fill
      timers.push(setTimeout(() => setImpactFill(prev => [...prev, i]), start + 1100));

      // Confidence dial
      timers.push(setTimeout(() => setConfFill(prev => [...prev, i]), start + 1400));
    });

    const totalTime = 400 + EVAL_ROWS.length * 2000 + 400;
    timers.push(setTimeout(() => setShowMerge(true), totalTime));
    timers.push(setTimeout(() => setShowTotal(true), totalTime + 600));
    timers.push(setTimeout(() => setShowPrint(true), totalTime + 1200));
    timers.push(setTimeout(() => setShowPdf(true), totalTime + 2000));
    timers.push(setTimeout(() => onComplete?.(), totalTime + 3200));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const impactWeight = (conf: number) => Math.round(conf * 100);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden px-6 gap-4">
      {/* Monitor frame */}
      <motion.div
        className="relative rounded-xl overflow-hidden"
        style={{
          width: 720,
          background: 'oklch(0.12 0.02 256)',
          border: '2px solid oklch(0.25 0.03 256)',
          boxShadow: '0 0 40px oklch(0 0 0 / 50%), inset 0 0 30px oklch(0 0 0 / 30%)',
        }}
        animate={showMerge ? { height: 'auto' } : {}}
      >
        {/* Monitor header */}
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{
            background: 'oklch(0.15 0.02 256)',
            borderBottom: '1px solid oklch(0.25 0.03 256)',
          }}
        >
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(0.65 0.2 25)' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(0.8 0.16 80)' }} />
            <div className="w-2 h-2 rounded-full" style={{ background: 'oklch(0.7 0.17 160)' }} />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground tracking-wider">EVIDENCE ANALYSIS LAB</span>
          <div className="flex-1" />
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: 'oklch(0.7 0.17 160)' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[8px] font-mono text-muted-foreground">LIVE</span>
        </div>

        {/* Panels grid */}
        <div className="p-3 grid grid-cols-5 gap-2">
          {EVAL_ROWS.map((row, i) => {
            const isActive = activePanels.includes(i);
            return (
              <motion.div
                key={i}
                className="relative rounded-lg overflow-hidden"
                style={{
                  height: 260,
                  background: isActive ? 'oklch(0.14 0.02 256)' : 'oklch(0.08 0.01 256)',
                  border: `1px solid ${isActive ? 'oklch(0.3 0.04 256)' : 'oklch(0.15 0.02 256)'}`,
                }}
              >
                {/* CRT flicker effect */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.5, 1] }}
                      transition={{ duration: 0.3, times: [0, 0.1, 0.2, 0.3] }}
                    >
                      {/* Scanline overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-5"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0 0 0 / 30%) 2px, oklch(0 0 0 / 30%) 4px)',
                        }}
                      />

                      <div className="p-2 h-full flex flex-col">
                        {/* Panel header */}
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-sm">{row.icon}</span>
                          <div className="min-w-0">
                            <div className="text-[8px] font-bold text-foreground truncate">{row.doc}</div>
                            <div className="text-[6px] font-mono text-muted-foreground">{row.type}</div>
                          </div>
                        </div>

                        {/* Facts data feed */}
                        <AnimatePresence>
                          {factsVisible.includes(i) && (
                            <motion.div
                              className="mb-2 space-y-0.5"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {row.keyFacts.split(', ').map((fact, fi) => (
                                <motion.div
                                  key={fi}
                                  className="flex items-center gap-1"
                                  initial={{ opacity: 0, x: -5 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: fi * 0.12 }}
                                >
                                  <div className="w-1 h-1 rounded-full shrink-0" style={{ background: 'oklch(0.7 0.15 195)' }} />
                                  <span className="text-[6px] font-mono text-cyan truncate">{fact}</span>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* AI Summary */}
                        <AnimatePresence>
                          {summaryVisible.includes(i) && (
                            <motion.p
                              className="text-[7px] italic text-muted-foreground mb-2 leading-relaxed"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              &quot;{row.summary}&quot;
                            </motion.p>
                          )}
                        </AnimatePresence>

                        <div className="mt-auto space-y-2">
                          {/* Impact meter */}
                          <div>
                            <div className="text-[5px] font-mono text-muted-foreground uppercase tracking-wider mb-0.5">Impact</div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.2 0.02 256)' }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: row.impactColor }}
                                initial={{ width: 0 }}
                                animate={{ width: impactFill.includes(i) ? `${impactWeight(row.conf)}%` : 0 }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                              />
                            </div>
                            {impactFill.includes(i) && (
                              <motion.div
                                className="text-[6px] font-bold mt-0.5 truncate"
                                style={{ color: row.impactColor }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                {row.impact}
                              </motion.div>
                            )}
                          </div>

                          {/* Confidence dial */}
                          <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8">
                              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle
                                  cx="18" cy="18" r="14"
                                  fill="none"
                                  stroke="oklch(0.2 0.02 256)"
                                  strokeWidth="3"
                                />
                                <motion.circle
                                  cx="18" cy="18" r="14"
                                  fill="none"
                                  stroke={row.conf >= 0.9 ? 'oklch(0.7 0.17 160)' : 'oklch(0.8 0.16 80)'}
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 14}`}
                                  initial={{ strokeDashoffset: 2 * Math.PI * 14 }}
                                  animate={{
                                    strokeDashoffset: confFill.includes(i)
                                      ? 2 * Math.PI * 14 * (1 - row.conf)
                                      : 2 * Math.PI * 14,
                                  }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                />
                              </svg>
                              {confFill.includes(i) && (
                                <motion.div
                                  className="absolute inset-0 flex items-center justify-center"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.5 }}
                                >
                                  <span className="text-[7px] font-bold text-foreground">{row.conf.toFixed(2)}</span>
                                </motion.div>
                              )}
                            </div>
                            <span className="text-[5px] font-mono text-muted-foreground uppercase">Conf</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Inactive screen */}
                {!isActive && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-[8px] font-mono text-muted-foreground/30">STANDBY</div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom total row */}
        <AnimatePresence>
          {showTotal && (
            <motion.div
              className="mx-3 mb-3 px-4 py-2 rounded-lg flex items-center justify-between"
              style={{
                background: 'oklch(0.7 0.17 160 / 8%)',
                border: '1px solid oklch(0.7 0.17 160 / 20%)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-[10px] font-bold text-foreground">TOTAL</span>
              <span className="text-[11px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>{TOTAL_AMOUNT}</span>
              <div
                className="px-2 py-0.5 rounded-full text-[8px] font-bold"
                style={{
                  background: 'oklch(0.55 0.2 270 / 15%)',
                  color: 'oklch(0.7 0.2 270)',
                  border: '1px solid oklch(0.55 0.2 270 / 30%)',
                }}
              >
                📊 Mean: {MEAN_CONFIDENCE}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Print button auto-click */}
        <AnimatePresence>
          {showPrint && !showPdf && (
            <motion.div
              className="flex justify-center pb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="px-4 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1.5"
                style={{
                  background: 'oklch(0.55 0.2 270)',
                  color: 'white',
                }}
                animate={{ scale: [1, 0.95, 1] }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                🖨️ Printing...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* PDF flying to tray */}
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
              <span className="text-lg">📄</span>
              <span className="text-[6px] font-bold text-white">LAB</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option D — Lab Dashboard
      </div>
    </div>
  );
}
