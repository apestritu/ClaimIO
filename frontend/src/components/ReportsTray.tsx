"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';

interface ReportsTrayProps {
  reports: { name: string; color: string }[];
}

export function ReportsTray({ reports }: ReportsTrayProps) {
  if (reports.length === 0) return null;

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-40 glass-panel rounded-xl px-4 py-3"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Generated Reports</p>
      <div className="flex gap-2">
        <AnimatePresence>
          {reports.map((r) => (
            <motion.div
              key={r.name}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-glass cursor-pointer hover:bg-glass-border transition-colors"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <FileText size={12} style={{ color: r.color }} />
              <span className="text-[10px] font-mono text-muted-foreground">{r.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
