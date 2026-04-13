"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, FileText, X } from 'lucide-react';
import type { LogEntry } from '@/lib/claim-data';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
}

interface UploadPhaseProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onStartProcessing: () => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

export function UploadPhase({ onFilesUploaded, onStartProcessing, addLog }: UploadPhaseProps) {
  const [files] = useState<UploadedFile[]>([
    { id: '1', name: 'policy_cert.pdf', size: '245 KB' },
    { id: '2', name: 'claim_form_v2.pdf', size: '182 KB' },
    { id: '3', name: 'bag_damage_report.pdf', size: '1.2 MB' },
    { id: '4', name: 'flight_ticket_AA123.pdf', size: '98 KB' },
    { id: '5', name: 'repair_receipt.pdf', size: '56 KB' },
    { id: '6', name: 'replacement_receipt.pdf', size: '34 KB' },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [boxState, setBoxState] = useState<'empty' | 'filling' | 'sealed'>('empty');
  const [visibleFiles, setVisibleFiles] = useState<UploadedFile[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleFiles = useCallback(() => {
    setBoxState('filling');
    addLog({ icon: '📦', text: 'Documents received, preparing upload...' });

    const STAGGER = 400; // stagger between each doc appearing
    const LINGER = 600;  // how long a doc stays visible after landing

    // Stagger docs appearing (same as original)
    files.forEach((file, i) => {
      timersRef.current.push(setTimeout(() => {
        setVisibleFiles(prev => [...prev, file]);
        addLog({ icon: '📄', text: `Uploaded: ${file.name} (${file.size})` });
      }, (i + 1) * STAGGER));

      // After landing + linger, hide this doc
      timersRef.current.push(setTimeout(() => {
        setHiddenIds(prev => new Set(prev).add(file.id));
      }, (i + 1) * STAGGER + LINGER));
    });

    // Seal after all docs have disappeared
    const totalTime = (files.length + 1) * STAGGER + LINGER + 200;
    timersRef.current.push(setTimeout(() => {
      setBoxState('sealed');
      addLog({ icon: '✅', text: `${files.length} documents ready for processing` });
      onFilesUploaded(files);
    }, totalTime));
  }, [addLog, files, onFilesUploaded]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-8">
        {/* Box / Drop zone */}
        <AnimatePresence mode="wait">
          {boxState === 'empty' ? (
            <motion.div
              key="dropzone"
              className={`w-80 h-56 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
              }`}
              onClick={handleFiles}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(); }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CloudUpload size={48} className="text-muted-foreground" />
              </motion.div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Drop your claim documents here</p>
                <p className="text-xs text-muted-foreground mt-1">PDF files only • Click to browse</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="box"
              className="relative w-80 h-56 flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Cardboard box */}
              <div className="relative w-48 h-36">
                {/* Box body */}
                <div
                  className="absolute bottom-0 w-full h-28 rounded-md"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.6 0.1 60), oklch(0.5 0.1 55))',
                    boxShadow: '0 8px 30px oklch(0 0 0 / 40%)',
                  }}
                />
                {/* Box flaps */}
                <AnimatePresence>
                  {boxState === 'sealed' && (
                    <>
                      <motion.div
                        className="absolute top-6 left-0 w-1/2 h-8 origin-bottom rounded-tl-sm"
                        style={{ background: 'oklch(0.55 0.1 58)' }}
                        initial={{ rotateX: -180 }}
                        animate={{ rotateX: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                      <motion.div
                        className="absolute top-6 right-0 w-1/2 h-8 origin-bottom rounded-tr-sm"
                        style={{ background: 'oklch(0.52 0.1 56)' }}
                        initial={{ rotateX: -180 }}
                        animate={{ rotateX: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                      {/* Seal */}
                      <motion.div
                        className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10"
                        style={{
                          background: 'radial-gradient(circle, oklch(0.62 0.19 250), oklch(0.5 0.2 250))',
                          boxShadow: '0 0 20px oklch(0.62 0.19 250 / 50%)',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
                      >
                        <span className="text-xs font-bold" style={{ color: 'oklch(1 0 0)' }}>AI</span>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Counter badge */}
                {hiddenIds.size > 0 && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold z-20"
                    style={{
                      background: 'oklch(0.62 0.19 250)',
                      color: 'oklch(1 0 0)',
                      boxShadow: '0 2px 8px oklch(0.62 0.19 250 / 40%)',
                    }}
                    key={hiddenIds.size}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {hiddenIds.size}
                  </motion.div>
                )}

                {/* Falling document cards — original staggered style */}
                <AnimatePresence>
                  {visibleFiles.map((file, i) => {
                    if (hiddenIds.has(file.id)) return null;
                    return (
                      <motion.div
                        key={file.id}
                        className="absolute w-16 h-20 rounded-sm flex flex-col items-center justify-center"
                        style={{
                          background: 'oklch(0.95 0 0)',
                          left: `${20 + (i % 3) * 20}%`,
                          boxShadow: '0 2px 8px oklch(0 0 0 / 20%)',
                        }}
                        initial={{ y: -200, x: (i - 2.5) * 15, rotate: (i - 2.5) * 8, opacity: 0 }}
                        animate={{
                          y: 10 + i * 2,
                          x: (i - 2.5) * 5,
                          rotate: (i - 2.5) * 3,
                          opacity: 1,
                        }}
                        exit={{ y: 35, scale: 0.3, opacity: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 15,
                        }}
                      >
                        <FileText size={14} style={{ color: 'oklch(0.55 0.2 15)' }} />
                        <span className="text-[6px] mt-1 text-center px-1 truncate w-full" style={{ color: 'oklch(0.3 0 0)' }}>
                          {file.name.slice(0, 10)}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Process button */}
        <AnimatePresence>
          {boxState === 'sealed' && (
            <motion.button
              className="px-8 py-3 rounded-xl font-semibold text-sm tracking-wide text-primary-foreground"
              style={{
                background: 'linear-gradient(135deg, oklch(0.62 0.19 250), oklch(0.55 0.2 270))',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 0 30px oklch(0.62 0.19 250 / 40%)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartProcessing}
            >
              Process Claim →
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
