/**
 * Maps raw AgentEvent arrays into typed data props consumed by animation components.
 * Each mapper function extracts and transforms the relevant event data for its animation.
 */

import type { AgentEvent } from './useEventStream';
import { getDocTypeStyle } from './doc-type-styles';

// ─── Shared types for animation agentData props ───

export interface IngestAgentData {
  documents: Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    confidence: number;
    icon: string;
    color: string;
  }>;
  docsConfidence: number;
  missingDocs: boolean;
}

export interface ValidateAgentData {
  checklist: Array<{
    requirement: string;
    status: 'provided' | 'missing';
    confidence: number;
  }>;
  scenario: 'happy' | 'missing';
  missingTypes: string[];
}

export interface CollectAgentData {
  docsByType: Record<string, string[]>;
  documents: IngestAgentData['documents'];
}

export interface ExtractAgentData {
  extractions: Array<{
    filename: string;
    docType: string;
    summary: string;
    confidence: number;
    keyFacts: string[];
    icon: string;
    color: string;
  }>;
}

export interface EvaluateAgentData {
  rows: Array<{
    doc: string;
    type: string;
    icon: string;
    keyFacts: string;
    summary: string;
    impact: string;
    impactColor: string;
    conf: number;
  }>;
  meanConfidence: number;
  totalAmount: string;
}

export interface CoverageAgentData {
  mergedFacts: Array<{ label: string; value: string; icon: string; color: string }>;
  questions: Array<{ icon: string; text: string; result: '✅' | '⚠️' }>;
  guardrailResults: Array<{ rule: string; passed: boolean }>;
  coverageConfidence: number;
  approvedAmount: number;
  meetsThresholds: boolean;
}

export interface ComplianceAgentData {
  claimantName: string;
  sanctionHit: boolean;
  sanctionsConfidence: number;
  fraudRiskScore: number;
  receiptAmounts: number[];
}

export interface DecisionAgentData {
  metrics: Array<{
    label: string;
    value: number;
    weight: number;
    icon: string;
    color: string;
    subtract?: boolean;
  }>;
  globalConfidence: number;
  threshold: number;
  status: string;
  amount: number;
}

export interface PaymentAgentData {
  processed: boolean;
  success: boolean;
  method: string;
  amount: number;
}

export interface NotifyAgentData {
  summary: Record<string, unknown>;
  emailPreview: string;
  notificationSent: boolean;
}

// ─── Mapper functions ───

function findCompleted(events: AgentEvent[]): AgentEvent | undefined {
  return events.find(e => e.status === 'completed');
}

function findWorkingEvents(events: AgentEvent[]): AgentEvent[] {
  return events.filter(e => e.status === 'working');
}

export function mapIngestData(events: AgentEvent[]): IngestAgentData | undefined {
  const completed = findCompleted(events);
  if (!completed) return undefined;

  const docs = (completed.data.documents as Array<Record<string, unknown>>) ?? [];
  const documents = docs.map((d, i) => {
    const docType = (d.type as string) || 'Unknown';
    const style = getDocTypeStyle(docType);
    return {
      id: String(i + 1),
      name: (d.filename as string) || `doc_${i}`,
      size: (d.file_size as string) || '—',
      type: docType,
      confidence: (d.confidence as number) ?? 0,
      icon: style.icon,
      color: style.color,
    };
  });

  // If completed event doesn't have documents array, build from working events
  if (documents.length === 0) {
    const working = findWorkingEvents(events);
    for (const evt of working) {
      if (evt.data.filename && evt.data.type) {
        const docType = evt.data.type as string;
        const style = getDocTypeStyle(docType);
        documents.push({
          id: String(documents.length + 1),
          name: evt.data.filename as string,
          size: (evt.data.file_size as string) || '—',
          type: docType,
          confidence: (evt.data.confidence as number) ?? 0,
          icon: style.icon,
          color: style.color,
        });
      }
    }
  }

  return {
    documents,
    docsConfidence: (completed.data.docs_confidence as number) ?? 0,
    missingDocs: (completed.data.missing_docs as boolean) ?? false,
  };
}

export function mapValidateData(events: AgentEvent[]): ValidateAgentData | undefined {
  // Look for the validation working event first, then fall back to completed
  const validationEvt = events.find(
    e => e.status === 'working' && e.data.checklist
  );
  const completed = findCompleted(events);
  const source = validationEvt ?? completed;
  if (!source) return undefined;

  const checklist = ((source.data.checklist as Array<Record<string, unknown>>) ?? []).map(c => ({
    requirement: (c.requirement as string) || '',
    status: (c.status as 'provided' | 'missing') || 'missing',
    confidence: (c.confidence as number) ?? 0,
  }));

  return {
    checklist,
    scenario: (source.data.scenario as 'happy' | 'missing') ?? (checklist.some(c => c.status === 'missing') ? 'missing' : 'happy'),
    missingTypes: (source.data.missing_types as string[]) ?? checklist.filter(c => c.status === 'missing').map(c => c.requirement),
  };
}

export function mapCollectData(
  evidenceEvents: AgentEvent[],
  ingestData?: IngestAgentData
): CollectAgentData | undefined {
  const completed = findCompleted(evidenceEvents);
  if (!completed) return undefined;

  return {
    docsByType: (completed.data.docs_by_type as Record<string, string[]>) ?? {},
    documents: ingestData?.documents ?? [],
  };
}

export function mapExtractData(events: AgentEvent[]): ExtractAgentData | undefined {
  const working = findWorkingEvents(events).filter(e => e.data.filename);
  if (working.length === 0) return undefined;

  return {
    extractions: working.map(evt => {
      const docType = (evt.data.doc_type as string) || 'Unknown';
      const style = getDocTypeStyle(docType);
      return {
        filename: (evt.data.filename as string) || '',
        docType,
        summary: (evt.data.summary as string) || '',
        confidence: (evt.data.confidence as number) ?? 0,
        keyFacts: (evt.data.key_facts as string[]) ?? [],
        icon: style.icon,
        color: style.color,
      };
    }),
  };
}

const IMPACT_MAP: Record<string, string> = {
  BagReport: 'Confirms bag delay',
  Receipt: 'Supports claimed amount',
  Policy: 'Sets coverage limits',
  ClaimForm: 'Context',
  FlightTicket: 'Context',
  PhysicianStatement: 'Medical evidence',
  CancellationConfirmation: 'Confirms cancellation',
  TripSummary: 'Trip overview',
  Email: 'Supporting correspondence',
};

export function mapEvaluateData(events: AgentEvent[]): EvaluateAgentData | undefined {
  const completed = findCompleted(events);
  if (!completed) return undefined;

  const evaluation = (completed.data.evaluation as Array<Record<string, unknown>>) ?? [];
  if (evaluation.length === 0) return undefined;

  const rows = evaluation.map(row => {
    const docType = (row.doc_type as string) || 'Unknown';
    const style = getDocTypeStyle(docType);
    const impact = IMPACT_MAP[docType] || 'General context';
    return {
      doc: (row.filename as string) || '',
      type: docType,
      icon: style.icon,
      keyFacts: (row.summary as string) || '—',
      summary: impact,
      impact,
      impactColor: style.color,
      conf: (row.confidence as number) ?? 0,
    };
  });

  const meanConf = (completed.data.mean_extraction_confidence as number) ?? 0;
  // We don't have total amount here; it comes from coverage. Use a placeholder.
  return {
    rows,
    meanConfidence: meanConf,
    totalAmount: '',
  };
}

const FACT_COLORS: Record<string, string> = {
  'Policy Start': 'oklch(0.62 0.19 250)',
  'Policy End': 'oklch(0.62 0.19 250)',
  'Incident': 'oklch(0.62 0.19 250)',
  'Bag Delay Start': 'oklch(0.8 0.16 80)',
  'Bag Delivered': 'oklch(0.8 0.16 80)',
  'Total Receipts': 'oklch(0.7 0.17 160)',
  'Total Refunds': 'oklch(0.7 0.17 160)',
  'Limits': 'oklch(0.8 0.16 80)',
};

export function mapCoverageData(events: AgentEvent[]): CoverageAgentData | undefined {
  const completed = findCompleted(events);
  if (!completed) return undefined;

  const rawFacts = (completed.data.merged_facts_list as Array<Record<string, string>>) ?? [];
  const mergedFacts = rawFacts.map(f => ({
    label: f.label || '',
    value: f.value || '',
    icon: f.icon || '📋',
    color: FACT_COLORS[f.label] || 'oklch(0.62 0.19 250)',
  }));

  const guardrailResults = (completed.data.guardrail_results as Array<{ rule: string; passed: boolean }>) ?? [];

  // Build questions from guardrails
  const questions = guardrailResults.map(gr => ({
    icon: gr.passed ? '✅' : '⚠️',
    text: gr.rule + '?',
    result: (gr.passed ? '✅' : '⚠️') as '✅' | '⚠️',
  }));

  return {
    mergedFacts,
    questions,
    guardrailResults,
    coverageConfidence: (completed.data.coverage_confidence as number) ?? 0,
    approvedAmount: (completed.data.approved_amount as number) ?? 0,
    meetsThresholds: (completed.data.meets_thresholds as boolean) ?? false,
  };
}

export function mapComplianceData(events: AgentEvent[]): ComplianceAgentData | undefined {
  const completed = findCompleted(events);
  if (!completed) return undefined;

  return {
    claimantName: (completed.data.claimant_name as string) || 'Unknown',
    sanctionHit: (completed.data.sanction_hit as boolean) ?? false,
    sanctionsConfidence: (completed.data.sanctions_confidence as number) ?? 0,
    fraudRiskScore: (completed.data.fraud_risk_score as number) ?? 0,
    receiptAmounts: (completed.data.receipt_amounts as number[]) ?? [],
  };
}

const METRIC_COLORS: Record<string, string> = {
  C_docs: 'oklch(0.62 0.19 250)',
  C_extract: 'oklch(0.7 0.15 195)',
  C_coverage: 'oklch(0.8 0.16 80)',
  Fraud: 'oklch(0.65 0.2 15)',
};

export function mapDecisionData(events: AgentEvent[]): DecisionAgentData | undefined {
  const completed = findCompleted(events);
  if (!completed) return undefined;

  const rawMetrics = (completed.data.metrics as Array<Record<string, unknown>>) ?? [];
  const metrics = rawMetrics.map(m => ({
    label: (m.label as string) || '',
    value: (m.value as number) ?? 0,
    weight: (m.weight as number) ?? 0,
    icon: (m.icon as string) || '📊',
    color: METRIC_COLORS[(m.label as string)] || 'oklch(0.5 0.02 256)',
    subtract: (m.subtract as boolean) ?? false,
  }));

  return {
    metrics,
    globalConfidence: (completed.data.global_confidence as number) ?? 0,
    threshold: (completed.data.threshold as number) ?? 0.7,
    status: (completed.data.status as string) || 'UNKNOWN',
    amount: (completed.data.amount as number) ?? 0,
  };
}

export function mapPaymentData(events: AgentEvent[]): PaymentAgentData | undefined {
  const completed = findCompleted(events);
  if (!completed) return undefined;

  return {
    processed: (completed.data.processed as boolean) ?? false,
    success: (completed.data.success as boolean) ?? false,
    method: (completed.data.method as string) || 'ACH',
    amount: (completed.data.amount as number) ?? 0,
  };
}

export function mapNotifyData(events: AgentEvent[]): NotifyAgentData | undefined {
  const completed = findCompleted(events);
  if (!completed) return undefined;

  return {
    summary: (completed.data.summary as Record<string, unknown>) ?? {},
    emailPreview: (completed.data.email_preview as string) || '',
    notificationSent: (completed.data.notification_sent as boolean) ?? false,
  };
}
