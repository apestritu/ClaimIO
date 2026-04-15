"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_DOCUMENTS, type LogEntry, type ClaimDocument } from '@/lib/claim-data';
import type { IngestAgentData } from '@/lib/agent-data-mapper';

interface IngestAnimationProps {
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
  agentData?: IngestAgentData;
}

export function IngestAnimation({ addLog, onComplete, agentData }: IngestAnimationProps) {
  const [scanningIndex, setScanningIndex] = useState(-1);
  const [scannedDocs, setScannedDocs] = useState<ClaimDocument[]>([]);
  const [scanPhase, setScanPhase] = useState<'scanning' | 'classified' | 'idle'>('idle');
  const [showBookshelf, setShowBookshelf] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const docs: ClaimDocument[] = agentData
    ? agentData.documents.map(d => ({ id: d.id, name: d.name, size: d.size, type: d.type as ClaimDocument['type'], confidence: d.confidence, icon: d.icon, color: d.color }))
    : MOCK_DOCUMENTS;
  const docsConfidence = agentData?.docsConfidence ?? 0.87;

  const lineWidths = useMemo(
    () => docs.map(() => Array.from({ length: 7 }, () => 50 + Math.random() * 40)),
    [docs]
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scanDoc = (i: number) => {
      if (i >= docs.length) {
        // All scanned — transition to bookshelf
        timeout = setTimeout(() => {
          setShowBookshelf(true);
          addLog({ icon: '📚', text: 'All documents scanned — organizing bookshelf...' });
          timeout = setTimeout(() => {
            setShowConfidence(true);
            addLog({ icon: '📊', text: `Docs confidence: ${docsConfidence.toFixed(2)} | Missing: ${agentData?.missingDocs ? 'yes' : 'none'}` });
            setTimeout(onComplete, 1000);
          }, 400);
        }, 200);
        return;
      }

      setScanningIndex(i);
      setScanPhase('scanning');
      addLog({ icon: '🔍', text: `OCR processing: ${docs[i].name}...` });

      timeout = setTimeout(() => {
        setScanPhase('classified');
        addLog({ icon: '✅', text: `Classified as "${docs[i].type}" (conf: ${docs[i].confidence.toFixed(2)})` });

        timeout = setTimeout(() => {
          setScannedDocs(prev => [...prev, docs[i]]);
          setScanPhase('idle');
          timeout = setTimeout(() => scanDoc(i + 1), 150);
        }, 300);
      }, 650);
    };

    timeout = setTimeout(() => scanDoc(0), 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allScanned = scannedDocs.length === docs.length;
  const currentDoc = scanningIndex >= 0 && scanningIndex < docs.length ? docs[scanningIndex] : null;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8">

      {/* ── SCANNING PHASE ── */}
      {!showBookshelf && (
        <>
          {/* Counter */}
          <div className="text-[10px] font-mono text-muted-foreground">
            {scannedDocs.length}/{docs.length} documents processed
          </div>

          {/* Scanning area */}
          <div className="relative w-56 h-64 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentDoc && scanPhase !== 'idle' && (
                <motion.div
                  key={currentDoc.id}
                  className="absolute w-56 h-64"
                  initial={{ opacity: 0, y: 40, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, y: 60 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                >
                  {/* Classification badge — outside overflow-hidden so never clipped */}
                  {scanPhase === 'classified' && (
                    <motion.div
                      className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap"
                      style={{ background: currentDoc.color, color: 'oklch(0.145 0.03 256)' }}
                      initial={{ y: -20, opacity: 0, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      {currentDoc.icon} {currentDoc.type}
                    </motion.div>
                  )}

                  {/* Card body — overflow-hidden keeps scan beam inside */}
                  <div
                    className="w-full h-full rounded-xl flex flex-col items-center justify-center overflow-hidden relative"
                    style={{
                      background: 'oklch(0.18 0.02 256)',
                      border: `2px solid ${scanPhase === 'classified' ? currentDoc.color : 'oklch(0.35 0.02 256)'}`,
                      boxShadow: scanPhase === 'scanning'
                        ? '0 0 40px oklch(0.7 0.15 195 / 35%)'
                        : `0 0 30px ${currentDoc.color}30`,
                    }}
                  >
                    {scanPhase === 'scanning' && (
                      <motion.div
                        className="absolute inset-x-0 h-1 z-10"
                        style={{
                          background: 'linear-gradient(180deg, transparent, oklch(0.7 0.15 195), transparent)',
                          boxShadow: '0 0 20px oklch(0.7 0.15 195)',
                        }}
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    <span className="text-4xl mb-3">{currentDoc.icon}</span>
                    <div className="space-y-1.5 px-4 w-full">
                      {lineWidths[scanningIndex]?.map((w, j) => (
                        <motion.div
                          key={j}
                          className="h-[3px] rounded-full"
                          style={{
                            background: scanPhase === 'classified' ? currentDoc.color : 'oklch(0.5 0.02 256)',
                            width: `${w}%`,
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: scanPhase === 'scanning' ? [0.15, 0.5, 0.15] : 0.4 }}
                          transition={
                            scanPhase === 'scanning'
                              ? { duration: 1.2, repeat: Infinity, delay: j * 0.08 }
                              : { duration: 0.3 }
                          }
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground mt-3 px-3 truncate w-full text-center">
                      {currentDoc.name}
                    </span>
                    {scanPhase === 'classified' && (
                      <motion.div
                        className="absolute bottom-3 text-base font-mono font-bold"
                        style={{ color: currentDoc.color }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                      >
                        {(currentDoc.confidence * 100).toFixed(0)}%
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {scanPhase === 'idle' && !allScanned && (
              <motion.div
                className="w-56 h-64 rounded-xl border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: 'oklch(0.3 0.02 256)' }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="text-muted-foreground/40 text-xs font-mono">Next document...</span>
              </motion.div>
            )}
          </div>

          {/* Mini progress dots during scanning */}
          {scannedDocs.length > 0 && !allScanned && (
            <div className="flex gap-1.5 justify-center">
              {docs.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: scannedDocs.some(d => d.id === doc.id)
                      ? doc.color
                      : 'oklch(0.3 0.02 256)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── BOOKSHELF PHASE ── */}
      {showBookshelf && (
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            📚 Document Bookshelf — hover to inspect
          </div>

          {/* Bookshelf */}
          <div className="relative flex items-end justify-center" style={{ perspective: '800px' }}>
            {scannedDocs.map((doc, i) => {
              const isHovered = hoveredDoc === doc.id;
              return (
                <motion.div
                  key={doc.id}
                  className="relative cursor-pointer"
                  style={{ zIndex: isHovered ? 50 : 10 - i, marginLeft: i === 0 ? 0 : '-4px' }}
                  onMouseEnter={() => setHoveredDoc(doc.id)}
                  onMouseLeave={() => setHoveredDoc(null)}
                  initial={{ opacity: 0, y: 80, rotateY: -30 }}
                  animate={{
                    opacity: 1,
                    y: isHovered ? -40 : 0,
                    rotateY: 0,
                    scale: isHovered ? 1.15 : 1,
                    x: isHovered
                      ? (i - (scannedDocs.length - 1) / 2) * 8
                      : 0,
                  }}
                  transition={{
                    delay: isHovered ? 0 : i * 0.08,
                    type: 'spring',
                    stiffness: 250,
                    damping: 20,
                  }}
                >
                  <div
                    className="w-28 h-36 rounded-lg flex flex-col items-center justify-center overflow-hidden relative"
                    style={{
                      background: 'oklch(0.18 0.02 256)',
                      border: `2px solid ${isHovered ? doc.color : `${doc.color}40`}`,
                      boxShadow: isHovered
                        ? `0 12px 40px ${doc.color}40, 0 0 20px ${doc.color}25`
                        : `0 2px 8px oklch(0 0 0 / 30%)`,
                    }}
                  >
                    {/* Color spine on left edge */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ background: doc.color }}
                    />

                    {/* Type badge top */}
                    <div
                      className="absolute top-0 inset-x-0 py-1 pl-2.5 text-left text-[8px] font-bold"
                      style={{ background: `${doc.color}30`, color: doc.color }}
                    >
                      {doc.type}
                    </div>

                    <span className="text-2xl mt-3">{doc.icon}</span>

                    {/* Name always visible */}
                    <span className="text-[7px] font-mono text-muted-foreground mt-1.5 px-2 text-center truncate w-full">
                      {doc.name}
                    </span>

                    {/* Show details on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg"
                          style={{ background: 'oklch(0.12 0.02 256 / 92%)' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <span className="text-2xl">{doc.icon}</span>
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: doc.color }}
                          >
                            {doc.type}
                          </span>
                          <span className="text-[8px] font-mono text-muted-foreground px-2 text-center truncate w-full">
                            {doc.name}
                          </span>
                          <span
                            className="text-sm font-mono font-bold"
                            style={{ color: doc.color }}
                          >
                            {(doc.confidence * 100).toFixed(0)}%
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Confidence at bottom when not hovered */}
                    {!isHovered && (
                      <span
                        className="text-[8px] font-mono font-bold mt-1"
                        style={{ color: doc.color }}
                      >
                        {(doc.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Shelf bar */}
          <motion.div
            className="w-[500px] h-1.5 rounded-full"
            style={{
              background: 'linear-gradient(90deg, oklch(0.3 0.05 195), oklch(0.25 0.03 256), oklch(0.3 0.05 270))',
              boxShadow: '0 2px 10px oklch(0 0 0 / 40%)',
              marginTop: '-22px',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Confidence gauge */}
          {showConfidence && (
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="relative w-32 h-16 overflow-hidden">
                <svg viewBox="0 0 120 60" className="w-full h-full">
                  <path
                    d="M 10 55 A 50 50 0 0 1 110 55"
                    fill="none"
                    stroke="oklch(0.3 0.02 256)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <motion.path
                    d="M 10 55 A 50 50 0 0 1 110 55"
                    fill="none"
                    stroke="oklch(0.7 0.15 195)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="157"
                    initial={{ strokeDashoffset: 157 }}
                    animate={{ strokeDashoffset: 157 * (1 - docsConfidence) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Document Confidence: <span className="text-cyan font-bold">{docsConfidence.toFixed(2)}</span>
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
