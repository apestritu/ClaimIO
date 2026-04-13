export interface MetricInput {
  label: string;
  value: number;
  weight: number;
  icon: string;
  color: string;
  subtract?: boolean;
}

export const METRICS: MetricInput[] = [
  { label: 'C_docs', value: 0.89, weight: 0.30, icon: '📄', color: 'oklch(0.62 0.19 250)' },
  { label: 'C_extract', value: 0.89, weight: 0.30, icon: '🧠', color: 'oklch(0.7 0.15 195)' },
  { label: 'C_coverage', value: 0.82, weight: 0.30, icon: '⚖️', color: 'oklch(0.8 0.16 80)' },
  { label: 'Fraud', value: 0.20, weight: 0.20, icon: '🔍', color: 'oklch(0.65 0.2 15)', subtract: true },
];

export const G_SCORE = 0.74;
export const THRESHOLD = 0.70;
export const APPROVED_AMOUNT = '$487.30';

export type Verdict = 'approve' | 'deny' | 'escalate';

export const VERDICT: Verdict = 'approve';

export const DOORS = [
  { label: 'APPROVE', icon: '🟢', color: 'oklch(0.7 0.17 160)', bg: 'oklch(0.7 0.17 160 / 10%)' },
  { label: 'DENY', icon: '🔴', color: 'oklch(0.65 0.2 15)', bg: 'oklch(0.65 0.2 15 / 10%)' },
  { label: 'ESCALATE', icon: '🟡', color: 'oklch(0.8 0.16 80)', bg: 'oklch(0.8 0.16 80 / 10%)' },
];
