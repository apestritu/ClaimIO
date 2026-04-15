"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry } from '@/lib/claim-data';
import type { NotifyAgentData } from '@/lib/agent-data-mapper';

interface NotifyAnimationProps {
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
  onReportGenerated?: (report: { name: string; color: string }) => void;
  onRestart: () => void;
  agentData?: NotifyAgentData;
}

type Stage = 'pdf' | 'email' | 'closed';

const SUMMARY_ROWS = [
  { label: 'Policy Window', value: '01/01/2024 → 12/31/2024' },
  { label: 'Trip Dates', value: '03/12 → 03/20' },
  { label: 'Incident', value: '03/15' },
  { label: 'Bag Delay', value: '48h' },
  { label: 'Total Receipts', value: '$487.30' },
  { label: 'Approved Amount', value: '$487.30' },
];


export function NotifyAnimation({ addLog, onComplete, onReportGenerated, onRestart, agentData }: NotifyAnimationProps) {
  const [stage, setStage] = useState<Stage>('pdf');
  const [visibleRows, setVisibleRows] = useState(0);
  const [pdfDone, setPdfDone] = useState(false);
  const [emailStep, setEmailStep] = useState(0); // 0=composing, 1=attachments, 2=sending, 3=sent
  const [typedText, setTypedText] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const startedRef = useRef(false);

  const summaryRows = agentData
    ? [
        { label: 'Status', value: String(agentData.summary.claim_status ?? 'UNKNOWN') },
        { label: 'Approved Amount', value: `$${Number(agentData.summary.approved_amount ?? 0).toFixed(2)}` },
        { label: 'AI Confidence', value: String(Number(agentData.summary.global_confidence ?? 0).toFixed(2)) },
        { label: 'Coverage Confidence', value: String(Number(agentData.summary.coverage_confidence ?? 0).toFixed(2)) },
        { label: 'Documents Processed', value: String(agentData.summary.documents_processed ?? 0) },
        { label: 'Fraud Risk', value: String(Number(agentData.summary.fraud_risk ?? 0).toFixed(2)) },
      ]
    : SUMMARY_ROWS;
  const fullEmailText = agentData?.emailPreview || 'We have completed the assessment of your claim.\nDecision: APPROVED\nAmount: $487.30\nAI confidence score: 0.74';

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    addLog({ icon: '📄', text: 'Building Coverage Checking report...' });

    // Part A — PDF build rows
    summaryRows.forEach((_, i) => {
      setTimeout(() => setVisibleRows(i + 1), 500 + i * 350);
    });

    const t1 = setTimeout(() => {
      setPdfDone(true);
      addLog({ icon: '✅', text: 'Coverage check complete' });
    }, 500 + summaryRows.length * 350 + 500);

    // Part B — Email
    const t2 = setTimeout(() => {
      setStage('email');
      addLog({ icon: '📧', text: 'Sending final decision to claimant...' });
    }, 500 + summaryRows.length * 350 + 1800);

    // Typewriter text
    const emailStartTime = 500 + summaryRows.length * 350 + 2300;
    const charTimers: ReturnType<typeof setTimeout>[] = [];
    fullEmailText.split('').forEach((char, i) => {
      charTimers.push(setTimeout(() => {
        setTypedText(fullEmailText.slice(0, i + 1));
      }, emailStartTime + i * 30));
    });

    // Send
    const t3 = setTimeout(() => setEmailStep(2), emailStartTime + fullEmailText.length * 30 + 800);

    // Sent — envelope flies away
    const t4 = setTimeout(() => {
      setEmailStep(3);
      addLog({ icon: '✅', text: 'Email sent to claimant' });
    }, emailStartTime + fullEmailText.length * 30 + 1600);

    // Case Closed
    const t5 = setTimeout(() => {
      setStage('closed');
      setShowClosed(true);
      addLog({ icon: '🔒', text: 'Case CLOSED' });
    }, emailStartTime + fullEmailText.length * 30 + 2800);

    // Restart button
    const t6 = setTimeout(() => setShowRestart(true), emailStartTime + fullEmailText.length * 30 + 3800);

    const t7 = setTimeout(onComplete, emailStartTime + fullEmailText.length * 30 + 4300);

    return () => {
      [t1, t2, t3, t4, t5, t6, t7, ...charTimers].forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 gap-5">

      {/* ── PART A: Coverage PDF ── */}
      {stage === 'pdf' && (
        <motion.div
          className="rounded-xl overflow-hidden w-[360px]"
          style={{
            background: 'oklch(0.16 0.02 256)',
            border: '1px solid oklch(0.8 0.16 80 / 30%)',
            boxShadow: '0 8px 40px oklch(0 0 0 / 40%)',
          }}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: pdfDone ? 0.6 : 1, x: 0, scale: pdfDone ? 0.85 : 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          {/* Header */}
          <div className="px-4 py-2 flex items-center gap-2" style={{ background: 'oklch(0.7 0.17 160)' }}>
            <span className="text-sm">✅</span>
            <span className="text-[11px] font-bold" style={{ color: 'oklch(0.145 0.03 256)' }}>
              CLAIM APPROVED
            </span>
            <span className="text-[8px] ml-auto" style={{ color: 'oklch(0.145 0.03 256 / 70%)' }}>
              AI confidence: 0.74
            </span>
          </div>

          {/* Rows */}
          <div className="p-3 space-y-1">
            {summaryRows.slice(0, visibleRows).map((row, i) => (
              <motion.div
                key={row.label}
                className="flex justify-between py-1 px-2 rounded-md"
                style={{ background: 'oklch(0.2 0.02 256 / 50%)' }}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <span className="text-[8px] font-mono text-muted-foreground">{row.label}</span>
                <span className="text-[8px] font-mono font-bold text-foreground">{row.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── PART B: Email ── */}
      {stage === 'email' && emailStep < 3 && (
        <motion.div
          className="w-[380px] rounded-xl overflow-hidden"
          style={{
            background: 'oklch(0.16 0.02 256)',
            border: '1px solid oklch(0.7 0.15 195 / 30%)',
            boxShadow: '0 8px 40px oklch(0 0 0 / 40%)',
          }}
          initial={{ opacity: 0, y: 60 }}
          animate={emailStep === 2 ? { opacity: 0, scale: 0.5, y: -100 } : { opacity: 1, y: 0 }}
          transition={emailStep === 2 ? { duration: 0.8 } : { type: 'spring', stiffness: 120, damping: 20 }}
        >
          {/* Email header */}
          <div className="px-4 py-2 space-y-1" style={{ borderBottom: '1px solid oklch(0.3 0.02 256)' }}>
            <div className="text-[8px] font-mono">
              <span className="text-muted-foreground">To: </span>
              <span className="text-foreground">claimant@example.com</span>
            </div>
            <div className="text-[8px] font-mono">
              <span className="text-muted-foreground">Subject: </span>
              <span className="text-foreground font-bold">Travel claim – final decision</span>
            </div>
          </div>

          {/* Email body */}
          <div className="px-4 py-3">
            <div className="text-[9px] font-mono text-foreground/80 whitespace-pre-line min-h-[60px]">
              {typedText}
              <motion.span
                className="inline-block w-px h-3 ml-0.5"
                style={{ background: 'oklch(0.7 0.15 195)' }}
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Send button */}
          {emailStep < 2 && typedText.length >= fullEmailText.length && (
            <div className="px-4 py-2">
              <motion.div
                className="w-full py-1.5 rounded-lg text-center text-[9px] font-bold"
                style={{
                  background: 'oklch(0.7 0.15 195)',
                  color: 'oklch(0.145 0.03 256)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, scale: [1, 0.97, 1] }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                Send ✉️
              </motion.div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── CASE CLOSED ── */}
      {stage === 'closed' && (
        <motion.div
          className="flex flex-col items-center gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {showClosed && (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              >
                <motion.div
                  className="rounded-2xl px-10 py-6 text-center relative overflow-hidden"
                  style={{
                    background: 'oklch(0.16 0.02 256 / 90%)',
                    border: '2px solid oklch(0.7 0.17 160 / 40%)',
                    boxShadow: '0 0 60px oklch(0.7 0.17 160 / 15%), 0 0 100px oklch(0.8 0.16 80 / 8%)',
                  }}
                >
                  {/* Golden shimmer */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(120deg, transparent 30%, oklch(0.8 0.16 80 / 8%) 50%, transparent 70%)',
                    }}
                    animate={{ x: [-200, 400] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />

                  <div className="relative z-10">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-lg font-bold tracking-wider" style={{ color: 'oklch(0.7 0.17 160)' }}>
                      CASE CLOSED
                    </div>
                    <div className="space-y-1 mt-3 text-[10px] font-mono text-muted-foreground">
                      <div>Claim ID: <span className="text-foreground font-bold">CLM-2024-0042</span></div>
                      <div>Decision: <span className="font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>APPROVED</span></div>
                      <div>Amount: <span className="font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>$487.30</span></div>
                      <div>Global confidence: <span className="text-foreground font-bold">0.74</span></div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Restart button */}
          <AnimatePresence>
            {showRestart && (
              <motion.button
                className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.62 0.19 250), oklch(0.55 0.2 270))',
                  color: 'oklch(0.95 0 0)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={onRestart}
              >
                Process Another Claim →
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
