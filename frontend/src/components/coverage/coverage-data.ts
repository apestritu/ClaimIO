export interface MergedFact {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export interface ReasoningCheck {
  icon: string;
  text: string;
  detail: string;
  result: '✅' | '⚠️' | '❌';
}

export const MERGED_FACTS: MergedFact[] = [
  { label: 'Policy', value: '01/01/2024 → 12/31/2024', icon: '📋', color: 'oklch(0.62 0.19 250)' },
  { label: 'Trip', value: '03/12 → 03/20', icon: '✈️', color: 'oklch(0.7 0.15 195)' },
  { label: 'Incident', value: '03/15', icon: '📅', color: 'oklch(0.62 0.19 250)' },
  { label: 'Bag delay', value: '48h', icon: '🧳', color: 'oklch(0.8 0.16 80)' },
  { label: 'Receipts', value: '$487.30', icon: '💰', color: 'oklch(0.7 0.17 160)' },
  { label: 'Limits', value: '$200/day + $200 flat', icon: '🛡️', color: 'oklch(0.8 0.16 80)' },
];

export const REASONING_CHECKS: ReasoningCheck[] = [
  { icon: '📅', text: 'Incident in trip window?', detail: '03/12 ≤ 03/15 ≤ 03/20', result: '✅' },
  { icon: '📋', text: 'Incident in policy window?', detail: '01/01 ≤ 03/15 ≤ 12/31', result: '✅' },
  { icon: '🧳', text: 'Bag delay ≥ 24h?', detail: '48h ≥ 24h', result: '✅' },
  { icon: '💰', text: 'Receipts ≤ limits?', detail: '$487.30 ≤ $2,000', result: '✅' },
];

export const GUARDRAIL_RULES = [
  'No sanctions match',
  'No fraud indicators',
  'Policy active at incident date',
  'Claimant identity verified',
];

export const COVERAGE_RESULT = {
  approved: true,
  amount: '$487.30',
  confidence: 0.82,
  issues: 'none',
};
