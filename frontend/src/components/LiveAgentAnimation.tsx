"use client";

import type { AgentEvent } from '@/lib/useEventStream';
import type { LogEntry } from '@/lib/claim-data';
import {
  mapIngestData,
  mapValidateData,
  mapCollectData,
  mapExtractData,
  mapEvaluateData,
  mapCoverageData,
  mapComplianceData,
  mapDecisionData,
  mapPaymentData,
  mapNotifyData,
} from '@/lib/agent-data-mapper';
import { IngestAnimation } from './IngestAnimation';
import { ValidateAnimation } from './ValidateAnimation';
import { CollectAnimation } from './CollectAnimation';
import { ExtractAnimation } from './ExtractAnimation';
import { EvaluateAnimation } from './EvaluateAnimation';
import { CoverageAnimation } from './CoverageAnimation';
import { ComplianceAnimation } from './ComplianceAnimation';
import { DecisionAnimation } from './DecisionAnimation';
import { PaymentAnimation } from './PaymentAnimation';
import { NotifyAnimation } from './NotifyAnimation';
import { AgentPhaseAnimation } from './AgentPhaseAnimation';

interface LiveAgentAnimationProps {
  agentId: string;
  /** Incrementally-built events per agent (live mode). */
  agentEvents: Record<string, AgentEvent[]>;
  allEvents: AgentEvent[];
  isCompleted: boolean;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onComplete: () => void;
  onRestart: () => void;
  /**
   * Optional: full event set pre-grouped by agent (replay mode).
   * When provided, mappers use this so data is always available
   * even before visible events reach the "completed" status.
   */
  fullAgentEvents?: Record<string, AgentEvent[]>;
}

/**
 * Always renders the rich demo-style animation for the given agent.
 *
 * - In replay mode, `fullAgentEvents` contains every event from the saved
 *   run, so mappers always have full data → real values populate the animation.
 * - In live mode, `fullAgentEvents` is absent. If the agent's completed event
 *   hasn't arrived yet the mapper returns undefined and the animation falls
 *   back to its built-in mock data — identical to demo mode visuals.
 */
export function LiveAgentAnimation({
  agentId,
  agentEvents,
  allEvents,
  isCompleted,
  addLog,
  onComplete,
  onRestart,
  fullAgentEvents,
}: LiveAgentAnimationProps) {
  // For data mapping: use fullAgentEvents (replay) when available, else incremental
  const dataEvents = (fullAgentEvents ?? agentEvents)[agentId] ?? [];
  const noop = () => {};

  switch (agentId) {
    case 'IngestAgent': {
      const data = mapIngestData(dataEvents);
      return <IngestAnimation addLog={addLog} onComplete={onComplete} agentData={data} />;
    }

    case 'EvidenceCollectionAgent': {
      const validateData = mapValidateData(dataEvents);
      const ingestEvents = (fullAgentEvents ?? agentEvents)['IngestAgent'] ?? [];
      const ingestData = mapIngestData(ingestEvents);
      const collectData = mapCollectData(dataEvents, ingestData);
      // If we have collect data, show Collect; otherwise show Validate
      if (collectData && isCompleted) {
        return (
          <CollectAnimation
            addLog={addLog}
            onComplete={onComplete}
            onReportGenerated={noop}
            agentData={collectData}
          />
        );
      }
      return (
        <ValidateAnimation
          addLog={addLog}
          onComplete={onComplete}
          scenario={'happy'}
          onSwitchScenario={noop}
          agentData={validateData}
        />
      );
    }

    case 'FactExtractionAgent': {
      const data = mapExtractData(dataEvents);
      return (
        <ExtractAnimation
          addLog={addLog}
          onComplete={onComplete}
          onReportGenerated={noop}
          agentData={data}
        />
      );
    }

    case 'EvidenceEvaluationAgent': {
      const data = mapEvaluateData(dataEvents);
      return <EvaluateAnimation addLog={addLog} onComplete={onComplete} agentData={data} />;
    }

    case 'CoverageReasoningAgent': {
      const data = mapCoverageData(dataEvents);
      return <CoverageAnimation addLog={addLog} onComplete={onComplete} agentData={data} />;
    }

    case 'ComplianceAgent': {
      const data = mapComplianceData(dataEvents);
      return <ComplianceAnimation addLog={addLog} onComplete={onComplete} agentData={data} />;
    }

    case 'DecisionAgent': {
      const data = mapDecisionData(dataEvents);
      return <DecisionAnimation addLog={addLog} onComplete={onComplete} agentData={data} />;
    }

    case 'PaymentAgent': {
      const data = mapPaymentData(dataEvents);
      return <PaymentAnimation addLog={addLog} onComplete={onComplete} agentData={data} />;
    }

    case 'CloseNotifyAgent': {
      const data = mapNotifyData(dataEvents);
      return (
        <NotifyAnimation
          addLog={addLog}
          onComplete={onComplete}
          onRestart={onRestart}
          agentData={data}
        />
      );
    }

    default:
      return (
        <AgentPhaseAnimation
          agentId={agentId}
          events={allEvents}
          isCompleted={isCompleted}
        />
      );
  }
}
