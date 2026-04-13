export interface ClaimDocument {
  id: string;
  name: string;
  size: string;
  type: 'Policy' | 'ClaimForm' | 'BagReport' | 'FlightTicket' | 'Receipt';
  confidence: number;
  icon: string;
  color: string;
}

export const MOCK_DOCUMENTS: ClaimDocument[] = [
  { id: '1', name: 'policy_cert.pdf', size: '245 KB', type: 'Policy', confidence: 0.94, icon: '📋', color: 'oklch(0.62 0.19 250)' },
  { id: '2', name: 'claim_form_v2.pdf', size: '182 KB', type: 'ClaimForm', confidence: 0.91, icon: '📝', color: 'oklch(0.55 0.2 270)' },
  { id: '3', name: 'bag_damage_report.pdf', size: '1.2 MB', type: 'BagReport', confidence: 0.88, icon: '🧳', color: 'oklch(0.8 0.16 80)' },
  { id: '4', name: 'flight_ticket_AA123.pdf', size: '98 KB', type: 'FlightTicket', confidence: 0.85, icon: '✈️', color: 'oklch(0.7 0.15 195)' },
  { id: '5', name: 'repair_receipt.pdf', size: '56 KB', type: 'Receipt', confidence: 0.90, icon: '🧾', color: 'oklch(0.7 0.17 160)' },
  { id: '6', name: 'replacement_receipt.pdf', size: '34 KB', type: 'Receipt', confidence: 0.92, icon: '🧾', color: 'oklch(0.7 0.17 160)' },
];

export type PipelineStep = {
  id: string;
  label: string;
  color: string;
  icon: string;
};

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: 'IngestAgent', label: 'Ingest', color: 'oklch(0.7 0.15 195)', icon: 'scan-search' },
  { id: 'EvidenceCollectionAgent', label: 'Evidence', color: 'oklch(0.8 0.16 80)', icon: 'shield-check' },
  { id: 'FactExtractionAgent', label: 'Facts', color: 'oklch(0.55 0.2 270)', icon: 'file-stack' },
  { id: 'EvidenceEvaluationAgent', label: 'Evaluate', color: 'oklch(0.7 0.17 160)', icon: 'pickaxe' },
  { id: 'CoverageReasoningAgent', label: 'Coverage', color: 'oklch(0.62 0.19 250)', icon: 'scale' },
  { id: 'ComplianceAgent', label: 'Compliance', color: 'oklch(0.65 0.2 15)', icon: 'shield' },
  { id: 'DecisionAgent', label: 'Decision', color: 'oklch(0.8 0.16 80)', icon: 'gavel' },
  { id: 'PaymentAgent', label: 'Payment', color: 'oklch(0.7 0.15 195)', icon: 'banknote' },
  { id: 'CloseNotifyAgent', label: 'Notify', color: 'oklch(0.7 0.17 160)', icon: 'bell' },
];

export type PhaseId = 'select' | 'IngestAgent' | 'EvidenceCollectionAgent' | 'FactExtractionAgent' | 'EvidenceEvaluationAgent' | 'CoverageReasoningAgent' | 'ComplianceAgent' | 'DecisionAgent' | 'PaymentAgent' | 'CloseNotifyAgent' | 'done';

export interface LogEntry {
  id: string;
  icon: string;
  text: string;
  timestamp: string;
  agent?: string;
}

export const AGENT_MESSAGES: Record<string, string> = {
  select: 'Ready to receive your documents...',
  IngestAgent: 'Scanning your documents with OCR...',
  EvidenceCollectionAgent: 'Checking if everything is here...',
  FactExtractionAgent: 'Reading between the lines...',
  EvidenceEvaluationAgent: 'Assessing evidence quality...',
  CoverageReasoningAgent: 'Analyzing policy coverage...',
  ComplianceAgent: 'Running compliance checks...',
  DecisionAgent: 'Making the final call...',
  PaymentAgent: 'Processing payment...',
  CloseNotifyAgent: 'Wrapping up and notifying...',
  done: 'All done!',
};

export const AGENT_COLORS: Record<string, string> = {
  select: 'oklch(0.62 0.19 250)',
  IngestAgent: 'oklch(0.7 0.15 195)',
  EvidenceCollectionAgent: 'oklch(0.8 0.16 80)',
  FactExtractionAgent: 'oklch(0.55 0.2 270)',
  EvidenceEvaluationAgent: 'oklch(0.7 0.17 160)',
  CoverageReasoningAgent: 'oklch(0.62 0.19 250)',
  ComplianceAgent: 'oklch(0.65 0.2 15)',
  DecisionAgent: 'oklch(0.8 0.16 80)',
  PaymentAgent: 'oklch(0.7 0.15 195)',
  CloseNotifyAgent: 'oklch(0.7 0.17 160)',
  done: 'oklch(0.7 0.17 160)',
};

export const AGENT_EXPRESSIONS: Record<string, string> = {
  select: '📦',
  IngestAgent: '🔍',
  EvidenceCollectionAgent: '🤔',
  FactExtractionAgent: '🧠',
  EvidenceEvaluationAgent: '📊',
  CoverageReasoningAgent: '🛡️',
  ComplianceAgent: '⚖️',
  DecisionAgent: '🔨',
  PaymentAgent: '💳',
  CloseNotifyAgent: '🔔',
  done: '✅',
};
