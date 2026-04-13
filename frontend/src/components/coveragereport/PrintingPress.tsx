"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXISTING_PDFS, NEW_PDF, FINAL_PACKET, COVERAGE_SUMMARY } from './coveragereport-data';

interface PrintingPressProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'feeding' | 'printing' | 'printed' | 'merging' | 'binding' | 'stamping' | 'done';

export function PrintingPress({ onComplete, autoPlay = true }: PrintingPressProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [dataStreams, setDataStreams] = useState(0);
  const [rollerSpin, setRollerSpin] = useState(false);
  const [showNewPdf, setShowNewPdf] = useState(false);
  const [mergedPdfs, setMergedPdfs] = useState<number[]>([]);
  const [showPacket, setShowPacket] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setStage('feeding'), 400));
    t.push(setTimeout(() => setDataStreams(1), 800));
    t.push(setTimeout(() => setDataStreams(2), 1200));
    t.push(setTimeout(() => setDataStreams(3), 1600));

    t.push(setTimeout(() => { setStage('printing'); setRollerSpin(true); }, 2200));
    t.push(setTimeout(() => { setShowNewPdf(true); setRollerSpin(false); setStage('printed'); }, 4000));

    // Merge phase
    t.push(setTimeout(() => setStage('merging'), 5200));
    t.push(setTimeout(() => setMergedPdfs([0]), 5600));
    t.push(setTimeout(() => setMergedPdfs([0, 1]), 6200));
    t.push(setTimeout(() => setMergedPdfs([0, 1, 2]), 6800));

    t.push(setTimeout(() => { setStage('binding'); }, 7400));
    t.push(setTimeout(() => { setStage('stamping'); setShowPacket(true); }, 8400));
    t.push(setTimeout(() => setStage('done'), 9600));
    t.push(setTimeout(() => onComplete?.(), 11000));

    return () => t.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const allPdfs = [...EXISTING_PDFS, NEW_PDF];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          🖨️ Printing Press — Coverage Report
        </span>
      </div>

      <div className="relative flex items-center gap-6" style={{ width: 650, height: 320 }}>
        {/* Data input (left) */}
        <div className="flex flex-col items-center gap-2 shrink-0" style={{ width: 120 }}>
          <span className="text-[7px] font-mono text-muted-foreground uppercase">Raw Data</span>
          {['Verdict', 'Amounts', 'Confidence'].map((label, i) => (
            <motion.div
              key={label}
              className="w-full px-2 py-1.5 rounded-lg text-center"
              style={{
                background: i < dataStreams ? `${NEW_PDF.color}12` : 'oklch(0.15 0.02 256)',
                border: `1px solid ${i < dataStreams ? `${NEW_PDF.color}35` : 'oklch(0.25 0.03 256)'}`,
              }}
              animate={{ opacity: i < dataStreams ? 1 : 0.3 }}
            >
              <span className="text-[7px] font-mono" style={{ color: i < dataStreams ? NEW_PDF.color : 'oklch(0.4 0.03 256)' }}>
                {label}: {i === 0 ? COVERAGE_SUMMARY.verdict : i === 1 ? COVERAGE_SUMMARY.amount : COVERAGE_SUMMARY.confidence}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Press machine (center) */}
        <div className="relative flex flex-col items-center shrink-0" style={{ width: 200 }}>
          <div
            className="w-full h-48 rounded-2xl relative overflow-hidden"
            style={{
              background: 'oklch(0.14 0.025 256)',
              border: `2px solid ${rollerSpin ? 'oklch(0.55 0.15 250 / 50%)' : 'oklch(0.3 0.05 250 / 40%)'}`,
              boxShadow: rollerSpin ? '0 0 20px oklch(0.55 0.15 250 / 15%)' : '0 6px 25px oklch(0 0 0 / 40%)',
            }}
          >
            {/* Press label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[6px] font-mono text-muted-foreground uppercase tracking-wider">
              Printing Press
            </div>

            {/* Rollers */}
            <div className="absolute top-12 left-4 right-4 flex flex-col gap-6">
              {[0, 1].map(i => (
                <motion.div
                  key={i}
                  className="w-full h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, oklch(0.3 0.04 250), oklch(0.22 0.03 256))',
                    border: '1px solid oklch(0.4 0.05 250 / 40%)',
                    boxShadow: 'inset 0 2px 4px oklch(0.4 0.06 250 / 20%)',
                  }}
                  animate={rollerSpin ? { rotate: 360 } : { rotate: 0 }}
                  transition={rollerSpin ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
                >
                  <div className="w-[80%] h-px" style={{ background: 'oklch(0.4 0.06 250 / 30%)' }} />
                </motion.div>
              ))}
            </div>

            {/* Paper passing through (during printing) */}
            {(stage === 'printing') && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-24 h-32 rounded-sm"
                style={{
                  background: 'oklch(0.92 0.01 80)',
                  boxShadow: '0 2px 8px oklch(0 0 0 / 20%)',
                }}
                initial={{ top: -40 }}
                animate={{ top: 200 }}
                transition={{ duration: 1.5, ease: 'linear' }}
              >
                <div className="p-1.5 space-y-0.5">
                  <div className="h-0.5 w-16 rounded" style={{ background: 'oklch(0.4 0.04 256)' }} />
                  <div className="h-0.5 w-12 rounded" style={{ background: 'oklch(0.4 0.04 256)' }} />
                  <div className="h-0.5 w-14 rounded" style={{ background: 'oklch(0.4 0.04 256)' }} />
                </div>
              </motion.div>
            )}

            {/* Heat shimmer */}
            {stage === 'printed' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-8"
                style={{ background: 'linear-gradient(0deg, oklch(0.8 0.16 80 / 8%), transparent)' }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1, repeat: 2 }}
              />
            )}
          </div>
        </div>

        {/* Output / merge area (right) */}
        <div className="flex flex-col items-center gap-3 shrink-0" style={{ width: 180 }}>
          <span className="text-[7px] font-mono text-muted-foreground uppercase">Reports Tray</span>

          <AnimatePresence mode="wait">
            {!showPacket ? (
              <motion.div key="pdfs" className="flex flex-col gap-2 w-full" exit={{ opacity: 0, scale: 0.8 }}>
                {allPdfs.map((pdf, i) => {
                  const isNew = i === 2;
                  const isVisible = isNew ? showNewPdf : true;
                  const isMerged = mergedPdfs.includes(i);
                  return isVisible ? (
                    <motion.div
                      key={pdf.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        background: `${pdf.color}10`,
                        border: `1px solid ${pdf.color}30`,
                        boxShadow: isMerged ? `0 0 10px ${pdf.color}15` : 'none',
                      }}
                      initial={isNew ? { opacity: 0, x: -30 } : { opacity: 1 }}
                      animate={{
                        opacity: 1, x: 0,
                        scale: isMerged ? 0.9 : 1,
                        y: isMerged ? (i - 1) * -8 : 0,
                      }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <span className="text-xs">{pdf.icon}</span>
                      <span className="text-[7px] font-mono" style={{ color: pdf.color }}>{pdf.name}</span>
                    </motion.div>
                  ) : null;
                })}
              </motion.div>
            ) : (
              <motion.div
                key="packet"
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {/* Bound packet */}
                <motion.div
                  className="relative w-32 h-40 rounded-xl flex flex-col items-center justify-center gap-1"
                  style={{
                    background: 'oklch(0.16 0.03 256)',
                    border: `2px solid ${FINAL_PACKET.color}50`,
                    boxShadow: `0 0 25px ${FINAL_PACKET.color}15`,
                  }}
                  animate={stage === 'stamping' ? { rotateY: [0, 15, -15, 0] } : {}}
                  transition={{ duration: 0.8 }}
                >
                  {/* Spine */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                    style={{ background: FINAL_PACKET.color }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <span className="text-2xl">{FINAL_PACKET.icon}</span>
                  <span className="text-[8px] font-mono font-bold" style={{ color: FINAL_PACKET.color }}>
                    {FINAL_PACKET.name}
                  </span>
                  <div className="flex gap-1 mt-1">
                    {allPdfs.map((p, i) => (
                      <div key={i} className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    ))}
                  </div>
                </motion.div>

                {stage === 'done' && (
                  <motion.span
                    className="text-[8px] font-mono font-bold"
                    style={{ color: 'oklch(0.7 0.17 160)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ✅ Packet ready
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option A — Printing Press
      </div>
    </div>
  );
}
