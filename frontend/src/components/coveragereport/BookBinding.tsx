"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXISTING_PDFS, NEW_PDF, FINAL_PACKET, COVERAGE_SUMMARY } from './coveragereport-data';

interface BookBindingProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'stacks' | 'generating' | 'generated' | 'align' | 'binding' | 'cover' | 'close' | 'done';

export function BookBinding({ onComplete, autoPlay = true }: BookBindingProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [genProgress, setGenProgress] = useState(0);
  const [bindLine, setBindLine] = useState(0);
  const startedRef = useRef(false);

  const allPdfs = [...EXISTING_PDFS, NEW_PDF];

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setStage('stacks'), 400));
    t.push(setTimeout(() => {
      setStage('generating');
      const genInterval = setInterval(() => {
        setGenProgress(p => {
          if (p >= 100) { clearInterval(genInterval); return 100; }
          return p + 5;
        });
      }, 50);
      t.push(setTimeout(() => clearInterval(genInterval), 1400) as unknown as ReturnType<typeof setTimeout>);
    }, 1400));

    t.push(setTimeout(() => { setGenProgress(100); setStage('generated'); }, 2800));
    t.push(setTimeout(() => setStage('align'), 3800));

    // Binding line zips down — start interval only when binding stage begins
    t.push(setTimeout(() => {
      setStage('binding');
      const bindInterval = setInterval(() => {
        setBindLine(p => {
          if (p >= 100) { clearInterval(bindInterval); return 100; }
          return p + 4;
        });
      }, 30);
      t.push(setTimeout(() => clearInterval(bindInterval), 1000) as unknown as ReturnType<typeof setTimeout>);
    }, 5000));

    t.push(setTimeout(() => setStage('cover'), 6200));
    t.push(setTimeout(() => setStage('close'), 7400));
    t.push(setTimeout(() => setStage('done'), 8600));
    t.push(setTimeout(() => onComplete?.(), 10500));

    return () => t.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  const isAligned = stage === 'align' || stage === 'binding' || stage === 'cover' || stage === 'close' || stage === 'done';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          📚 Book Binding Workshop — Coverage Report
        </span>
      </div>

      {/* Workbench surface */}
      <div className="absolute bottom-0 left-0 right-0 h-24" style={{
        background: 'linear-gradient(0deg, oklch(0.12 0.03 40), oklch(0.14 0.025 256))',
        borderTop: '1px solid oklch(0.2 0.04 40 / 40%)',
      }} />

      <AnimatePresence mode="wait">
        {stage !== 'done' ? (
          <motion.div
            key="workshop"
            className="relative flex items-end justify-center gap-6"
            style={{ width: 600, height: 280 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            {/* Three page stacks */}
            {allPdfs.map((pdf, i) => {
              const isNew = i === 2;
              const isGenerating = isNew && (stage === 'generating');
              const isGenerated = isNew && genProgress >= 100;
              const shouldShow = !isNew || stage !== 'idle';

              if (!shouldShow) return <div key={i} className="shrink-0" style={{ width: 120 }} />;

              return (
                <motion.div
                  key={pdf.name}
                  className="relative flex flex-col items-center"
                  style={{ width: 120 }}
                  animate={isAligned ? {
                    x: (1 - i) * 55,
                    y: stage === 'align' ? [0, -12, 0] : (i === 1 ? -4 : 0),
                    rotate: 0,
                  } : {}}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                >
                  {/* Page stack */}
                  <motion.div
                    className="relative w-20 h-28 rounded-lg flex flex-col items-center justify-center gap-1"
                    style={{
                      background: isNew && !isGenerated ? 'oklch(0.14 0.02 256)' : `${pdf.color}10`,
                      border: `2px solid ${isNew && !isGenerated ? 'oklch(0.25 0.03 256)' : `${pdf.color}40`}`,
                      boxShadow: `2px 2px 8px oklch(0 0 0 / 20%)`,
                    }}
                    animate={stage === 'align' ? { y: [0, -8, 0] } : {}}
                    transition={stage === 'align' ? { delay: i * 0.15, duration: 0.3 } : {}}
                  >
                    {/* Cover color strip */}
                    <div className="absolute top-0 left-0 right-0 h-4 rounded-t-md" style={{ background: `${pdf.color}25` }} />

                    <span className="text-lg mt-2">{pdf.icon}</span>

                    {/* Generation progress */}
                    {isGenerating && (
                      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.2 0.03 256)' }}>
                        <div className="h-full rounded-full" style={{ background: pdf.color, width: `${genProgress}%` }} />
                      </div>
                    )}

                    {/* Content lines */}
                    {(!isNew || isGenerated) && (
                      <div className="space-y-0.5 px-2 w-full">
                        <div className="h-0.5 w-full rounded" style={{ background: `${pdf.color}30` }} />
                        <div className="h-0.5 w-3/4 rounded" style={{ background: `${pdf.color}20` }} />
                        <div className="h-0.5 w-5/6 rounded" style={{ background: `${pdf.color}20` }} />
                      </div>
                    )}
                  </motion.div>

                  <span className="text-[6px] font-mono mt-1 text-center" style={{ color: pdf.color }}>
                    {pdf.name}
                  </span>
                </motion.div>
              );
            })}

            {/* Binding strip (golden line) */}
            {(stage === 'binding' || stage === 'cover' || stage === 'close') && (
              <motion.div
                className="absolute left-1/2 -translate-x-[70px]"
                style={{
                  top: 10,
                  width: 3,
                  height: `${bindLine}%`,
                  maxHeight: 112,
                  background: 'linear-gradient(180deg, oklch(0.8 0.16 80), oklch(0.7 0.14 60))',
                  borderRadius: 2,
                  boxShadow: '0 0 8px oklch(0.8 0.16 80 / 40%)',
                  zIndex: 10,
                }}
              />
            )}

            {/* Cover wrap */}
            {(stage === 'cover' || stage === 'close') && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2"
                style={{ top: 0, zIndex: 15 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="w-28 h-32 rounded-lg flex flex-col items-center justify-center gap-1" style={{
                  background: 'oklch(0.16 0.03 256)',
                  border: `2px solid ${FINAL_PACKET.color}50`,
                  boxShadow: `0 0 20px ${FINAL_PACKET.color}15`,
                }}>
                  {/* Foil stamp emboss */}
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 1.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  >
                    <span className="text-xl">{FINAL_PACKET.icon}</span>
                    <div className="text-[7px] font-mono font-bold mt-0.5" style={{ color: FINAL_PACKET.color }}>
                      {FINAL_PACKET.name}
                    </div>
                  </motion.div>

                  {/* Spine glow */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style={{
                    background: FINAL_PACKET.color,
                    boxShadow: `0 0 6px ${FINAL_PACKET.color}40`,
                  }} />
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Final result */
          <motion.div
            key="result"
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.div
              className="relative w-36 h-44 rounded-xl flex flex-col items-center justify-center gap-1"
              style={{
                background: 'oklch(0.16 0.03 256)',
                border: `2px solid ${FINAL_PACKET.color}50`,
                boxShadow: `0 0 30px ${FINAL_PACKET.color}15, 0 8px 30px oklch(0 0 0 / 30%)`,
              }}
              animate={{ rotateY: [0, 10, -10, 0] }}
              transition={{ duration: 0.8 }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ background: FINAL_PACKET.color }} />
              <span className="text-2xl">{FINAL_PACKET.icon}</span>
              <span className="text-[8px] font-mono font-bold" style={{ color: FINAL_PACKET.color }}>{FINAL_PACKET.name}</span>
              <div className="flex gap-1 mt-1">
                {allPdfs.map((p, i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                ))}
              </div>
              <span className="text-[6px] font-mono text-muted-foreground mt-0.5">3 documents bound</span>
            </motion.div>
            <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>✅ Packet filed to Reports Tray</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option B — Book Binding Workshop
      </div>
    </div>
  );
}
