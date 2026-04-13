"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXISTING_PDFS, NEW_PDF, FINAL_PACKET, COVERAGE_SUMMARY } from './coveragereport-data';

interface PuzzleAssemblyProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'floating' | 'building' | 'built' | 'snap1' | 'snap2' | 'snap3' | 'flash' | 'done';

export function PuzzleAssembly({ onComplete, autoPlay = true }: PuzzleAssemblyProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [buildLines, setBuildLines] = useState(0);
  const startedRef = useRef(false);

  const allPdfs = [...EXISTING_PDFS, NEW_PDF];

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setStage('floating'), 400));
    t.push(setTimeout(() => setStage('building'), 1800));

    // Build content lines for the 3rd piece
    for (let i = 1; i <= 5; i++) {
      t.push(setTimeout(() => setBuildLines(i), 1800 + i * 400));
    }

    t.push(setTimeout(() => setStage('built'), 4200));
    t.push(setTimeout(() => setStage('snap1'), 5000));
    t.push(setTimeout(() => setStage('snap2'), 5800));
    t.push(setTimeout(() => setStage('snap3'), 6600));
    t.push(setTimeout(() => setStage('flash'), 7400));
    t.push(setTimeout(() => setStage('done'), 8600));
    t.push(setTimeout(() => onComplete?.(), 10500));

    return () => t.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const snapped = stage === 'snap1' || stage === 'snap2' || stage === 'snap3' || stage === 'flash' || stage === 'done';
  const snap2 = stage === 'snap2' || stage === 'snap3' || stage === 'flash' || stage === 'done';
  const snap3 = stage === 'snap3' || stage === 'flash' || stage === 'done';

  // Starting positions for pieces floating in
  const piecePositions = [
    { x: -180, y: -60, rotate: -15 },
    { x: 180, y: -40, rotate: 20 },
    { x: 0, y: 120, rotate: -10 },
  ];

  // Snapped positions
  const snappedPositions = [
    { x: -70, y: 0, rotate: 0 },
    { x: 70, y: 0, rotate: 0 },
    { x: 0, y: 70, rotate: 0 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          🧩 Puzzle Assembly — Coverage Report
        </span>
      </div>

      <AnimatePresence mode="wait">
        {stage !== 'done' ? (
          <motion.div
            key="puzzle"
            className="relative"
            style={{ width: 500, height: 350 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {/* Puzzle pieces */}
            {allPdfs.map((pdf, i) => {
              const isNew = i === 2;
              const isBuilding = isNew && stage === 'building';
              const isBuilt = isNew && (stage === 'built' || snapped);
              const isFloating = stage === 'floating' || stage === 'building' || stage === 'built';

              const isSnapped = (i === 0 && snapped) || (i === 1 && snap2) || (i === 2 && snap3);
              const piecePosTarget = isSnapped
                ? snappedPositions[i]
                : isFloating ? piecePositions[i] : piecePositions[i];

              const justSnapped = (i === 0 && stage === 'snap1') || (i === 1 && stage === 'snap2') || (i === 2 && stage === 'snap3');

              return (
                <motion.div
                  key={pdf.name}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  animate={{
                    x: piecePosTarget.x,
                    y: piecePosTarget.y,
                    rotate: piecePosTarget.rotate,
                    scale: justSnapped ? [1, 1.1, 1] : 1,
                  }}
                  transition={justSnapped
                    ? { duration: 0.4, type: 'spring', stiffness: 300 }
                    : { type: 'spring', stiffness: 80, damping: 15 }
                  }
                >
                  {/* Puzzle piece shape */}
                  <div
                    className="relative w-28 h-24 rounded-xl flex flex-col items-center justify-center gap-1"
                    style={{
                      background: `${pdf.color}12`,
                      border: `2px solid ${pdf.color}${justSnapped ? '80' : '40'}`,
                      boxShadow: justSnapped ? `0 0 20px ${pdf.color}30` : `0 4px 15px oklch(0 0 0 / 25%)`,
                    }}
                  >
                    {/* Puzzle tab (right side, top piece only) */}
                    {i === 0 && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-6 rounded-r-full"
                        style={{ background: `${pdf.color}20`, border: `2px solid ${pdf.color}30`, borderLeft: 'none' }} />
                    )}
                    {/* Puzzle socket (left side, right piece) */}
                    {i === 1 && (
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-6 rounded-l-full"
                        style={{ background: `${pdf.color}20`, border: `2px solid ${pdf.color}30`, borderRight: 'none' }} />
                    )}
                    {/* Puzzle tab (top, bottom piece) */}
                    {i === 2 && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-4 rounded-t-full"
                        style={{ background: `${pdf.color}20`, border: `2px solid ${pdf.color}30`, borderBottom: 'none' }} />
                    )}

                    <span className="text-lg">{pdf.icon}</span>
                    <span className="text-[7px] font-mono font-bold" style={{ color: pdf.color }}>{pdf.name.replace('.pdf', '')}</span>

                    {/* Building content for new piece */}
                    {isBuilding && (
                      <div className="space-y-0.5 px-2 w-full">
                        {Array.from({ length: Math.min(buildLines, 5) }).map((_, li) => (
                          <motion.div
                            key={li}
                            className="h-0.5 rounded"
                            style={{
                              background: `${pdf.color}40`,
                              width: li === 0 ? '100%' : li === 1 ? '80%' : li === 2 ? '60%' : li === 3 ? '90%' : '70%',
                            }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Built badge */}
                    {isBuilt && (
                      <motion.div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                        style={{ background: `${pdf.color}20` }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <span className="text-[6px] font-mono" style={{ color: pdf.color }}>
                          {COVERAGE_SUMMARY.verdict} | {COVERAGE_SUMMARY.confidence}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Flash effect when all snap together */}
            {stage === 'flash' && (
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${FINAL_PACKET.color}20, transparent)`,
                }}
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
            )}
          </motion.div>
        ) : (
          /* Merged document */
          <motion.div
            key="result"
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.div
              className="relative w-40 h-48 rounded-xl flex flex-col items-center justify-center gap-2"
              style={{
                background: 'oklch(0.16 0.03 256)',
                border: `2px solid ${FINAL_PACKET.color}50`,
                boxShadow: `0 0 35px ${FINAL_PACKET.color}15, 0 8px 30px oklch(0 0 0 / 30%)`,
              }}
            >
              {/* Golden border glow */}
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ border: `2px solid ${FINAL_PACKET.color}` }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <span className="text-3xl">{FINAL_PACKET.icon}</span>
              <span className="text-[9px] font-mono font-bold" style={{ color: FINAL_PACKET.color }}>
                {FINAL_PACKET.name}
              </span>
              <div className="flex gap-1.5 mt-1">
                {allPdfs.map((p, i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                ))}
              </div>
              <span className="text-[6px] font-mono text-muted-foreground">3 documents merged</span>
            </motion.div>
            <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>✅ Claim Packet assembled</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option C — Puzzle Assembly
      </div>
    </div>
  );
}
