"use client";

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, SkipForward, Play } from 'lucide-react';
import { PipelineBar } from '@/components/PipelineBar';
import { AgentAvatar } from '@/components/AgentAvatar';
import { LiveLogPanel } from '@/components/LiveLogPanel';
import { UploadPhase } from '@/components/UploadPhase';
import { IngestAnimation } from '@/components/IngestAnimation';
import { ValidateAnimation } from '@/components/ValidateAnimation';
import { CollectAnimation } from '@/components/CollectAnimation';
import { ExtractAnimation } from '@/components/ExtractAnimation';
import { EvaluateAnimation } from '@/components/EvaluateAnimation';
import { CoverageAnimation } from '@/components/CoverageAnimation';
import { ComplianceAnimation } from '@/components/ComplianceAnimation';
import { DecisionAnimation } from '@/components/DecisionAnimation';
import { PaymentAnimation } from '@/components/PaymentAnimation';
import { NotifyAnimation } from '@/components/NotifyAnimation';
import type { LogEntry, PipelineStep } from '@/lib/claim-data';

type PhaseId = 'upload' | 'ingest' | 'validate' | 'collect' | 'extract' | 'evaluate' | 'coverage' | 'compliance' | 'decision' | 'payment' | 'notify';

const DEMO_STEPS: PipelineStep[] = [
  { id: 'ingest', label: 'Ingest', color: 'oklch(0.7 0.15 195)', icon: 'scan-search' },
  { id: 'validate', label: 'Validate', color: 'oklch(0.8 0.16 80)', icon: 'shield-check' },
  { id: 'collect', label: 'Collect', color: 'oklch(0.55 0.2 270)', icon: 'file-stack' },
  { id: 'extract', label: 'Extract', color: 'oklch(0.7 0.15 195)', icon: 'pickaxe' },
  { id: 'evaluate', label: 'Evaluate', color: 'oklch(0.55 0.2 270)', icon: 'file-text' },
  { id: 'coverage', label: 'Coverage', color: 'oklch(0.8 0.16 80)', icon: 'scale' },
  { id: 'compliance', label: 'Compliance', color: 'oklch(0.65 0.2 15)', icon: 'shield' },
  { id: 'decision', label: 'Decision', color: 'oklch(0.62 0.19 250)', icon: 'gavel' },
  { id: 'payment', label: 'Payment', color: 'oklch(0.7 0.17 160)', icon: 'banknote' },
  { id: 'notify', label: 'Notify', color: 'oklch(0.7 0.15 195)', icon: 'bell' },
];

const AGENT_MESSAGES: Record<PhaseId, string> = {
  upload: 'Ready to receive your documents...',
  ingest: 'Scanning your documents with OCR...',
  validate: 'Checking if everything is here...',
  collect: 'Building your evidence report...',
  extract: 'Reading between the lines...',
  evaluate: 'Summarizing the evidence...',
  coverage: 'Evaluating your coverage...',
  compliance: 'Checking sanctions & fraud...',
  decision: 'Rendering final verdict...',
  payment: 'Processing your payment...',
  notify: 'Wrapping everything up!',
};

const AGENT_COLORS: Record<PhaseId, string> = {
  upload: 'oklch(0.62 0.19 250)',
  ingest: 'oklch(0.7 0.15 195)',
  validate: 'oklch(0.8 0.16 80)',
  collect: 'oklch(0.55 0.2 270)',
  extract: 'oklch(0.7 0.15 195)',
  evaluate: 'oklch(0.55 0.2 270)',
  coverage: 'oklch(0.8 0.16 80)',
  compliance: 'oklch(0.65 0.2 15)',
  decision: 'oklch(0.62 0.19 250)',
  payment: 'oklch(0.7 0.17 160)',
  notify: 'oklch(0.7 0.15 195)',
};

interface DemoModeProps {
  onSwitchToLive: () => void;
  onSwitchToLanding?: () => void;
}

const STEP_TO_PHASE: PhaseId[] = ['ingest', 'validate', 'collect', 'extract', 'evaluate', 'coverage', 'compliance', 'decision', 'payment', 'notify'];

export function DemoMode({ onSwitchToLive, onSwitchToLanding }: DemoModeProps) {
  const [phase, setPhase] = useState<PhaseId>('upload');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [autoMode, setAutoMode] = useState(true);
  const [validateScenario, setValidateScenario] = useState<'happy' | 'missing'>('happy');
  const [replayKey, setReplayKey] = useState(0);

  const activeStep = phase === 'upload' ? -1 : STEP_TO_PHASE.indexOf(phase);

  const addLogRaw = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [...prev, { ...log, id: crypto.randomUUID(), timestamp }]);
  }, []);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const addLog = useCallback((log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    addLogRaw({ ...log, agent: log.agent || phaseRef.current });
  }, [addLogRaw]);

  const transitionToPhase = useCallback((next: PhaseId) => {
    setPhase(next);
  }, []);

  const handleStepClick = useCallback((stepIndex: number) => {
    const targetPhase = STEP_TO_PHASE[stepIndex];
    if (!targetPhase) return;
    addLog({ icon: '🔄', text: `Replaying ${DEMO_STEPS[stepIndex].label} phase...` });
    setPhase(targetPhase);
    setReplayKey(k => k + 1);
  }, [addLog]);

  const completeStep = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => [...prev, stepIndex]);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 glass-panel border-b border-glass-border">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-primary" />
          <span className="text-lg font-bold text-gradient-primary">ClaimIO</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Back to landing */}
          {onSwitchToLanding && (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium glass-panel hover:bg-glass-border transition-colors text-muted-foreground"
              onClick={onSwitchToLanding}
            >
              ← Home
            </button>
          )}
          {/* Switch to live */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium glass-panel hover:bg-glass-border transition-colors text-amber"
            onClick={onSwitchToLive}
          >
            🔴 Switch to Live
          </button>
          {/* Auto/Manual toggle */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium glass-panel hover:bg-glass-border transition-colors"
            onClick={() => setAutoMode(!autoMode)}
          >
            {autoMode ? <Play size={10} /> : <SkipForward size={10} />}
            {autoMode ? 'Auto' : 'Step-by-step'}
          </button>
          <div className="text-xs font-mono text-muted-foreground">
            Claim #<span className="text-foreground">CLM-2024-08-4721</span>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <PipelineBar activeStep={activeStep} completedSteps={completedSteps} steps={DEMO_STEPS} onStepClick={handleStepClick} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main animation area */}
        <div className="flex-1 relative overflow-hidden" style={{ flexBasis: '70%' }}>
          <AgentAvatar
            phase={phase}
            message={AGENT_MESSAGES[phase]}
            glowColor={AGENT_COLORS[phase]}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={`${phase}-${replayKey}`}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              transition={{ duration: 0.5 }}
            >
              {phase === 'upload' && (
                <UploadPhase
                  addLog={addLog}
                  onFilesUploaded={() => {}}
                  onStartProcessing={() => transitionToPhase('ingest')}
                />
              )}
              {phase === 'ingest' && (
                <IngestAnimation
                  addLog={addLog}
                  onComplete={() => {
                    completeStep(0);
                    if (autoMode) transitionToPhase('validate');
                  }}
                />
              )}
              {phase === 'validate' && (
                <ValidateAnimation
                  addLog={addLog}
                  scenario={validateScenario}
                  onSwitchScenario={() => setValidateScenario(v => v === 'happy' ? 'missing' : 'happy')}
                  onComplete={() => {
                    completeStep(1);
                    if (autoMode) transitionToPhase('collect');
                  }}
                />
              )}
              {phase === 'collect' && (
                <CollectAnimation
                  addLog={addLog}
                  onComplete={() => {
                    completeStep(2);
                    if (autoMode) transitionToPhase('extract');
                  }}
                  onReportGenerated={() => {}}
                />
              )}
              {phase === 'extract' && (
                <ExtractAnimation
                  addLog={addLog}
                  onComplete={() => {
                    completeStep(3);
                    if (autoMode) transitionToPhase('evaluate');
                  }}
                  onReportGenerated={() => {}}
                />
              )}
              {phase === 'evaluate' && (
                <EvaluateAnimation
                  addLog={addLog}
                  onComplete={() => {
                    completeStep(4);
                    if (autoMode) transitionToPhase('coverage');
                  }}
                />
              )}
              {phase === 'coverage' && (
                <CoverageAnimation
                  addLog={addLog}
                  onComplete={() => {
                    completeStep(5);
                    if (autoMode) transitionToPhase('compliance');
                  }}
                />
              )}
              {phase === 'compliance' && (
                <ComplianceAnimation
                  addLog={addLog}
                  onComplete={() => {
                    completeStep(6);
                    if (autoMode) transitionToPhase('decision');
                  }}
                />
              )}
              {phase === 'decision' && (
                <DecisionAnimation
                  addLog={addLog}
                  onComplete={() => {
                    completeStep(7);
                    if (autoMode) transitionToPhase('payment');
                  }}
                />
              )}
              {phase === 'payment' && (
                <PaymentAnimation
                  addLog={addLog}
                  onComplete={() => {
                    completeStep(8);
                    if (autoMode) transitionToPhase('notify');
                  }}
                />
              )}
              {phase === 'notify' && (
                <NotifyAnimation
                  addLog={addLog}
                  onComplete={() => {
                    completeStep(9);
                  }}
                  onReportGenerated={() => {}}
                  onRestart={() => {
                    setPhase('upload');
                    setLogs([]);
                    setCompletedSteps([]);
                    setReplayKey(k => k + 1);
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Manual mode next button */}
          {!autoMode && completedSteps.includes(activeStep) && phase !== 'notify' && (
            <motion.button
              className="absolute bottom-6 right-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground z-20"
              style={{ background: 'linear-gradient(135deg, oklch(0.62 0.19 250), oklch(0.55 0.2 270))' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const currentIdx = STEP_TO_PHASE.indexOf(phase);
                const nextPhase = STEP_TO_PHASE[currentIdx + 1];
                if (nextPhase) transitionToPhase(nextPhase);
              }}
            >
              Next Step →
            </motion.button>
          )}
        </div>

        {/* Right panel */}
        <div className="shrink-0 overflow-hidden" style={{ flexBasis: '30%', maxWidth: '380px' }}>
          <LiveLogPanel logs={logs} />
        </div>
      </div>

    </div>
  );
}
