export interface EvalRow {
  doc: string;
  type: string;
  icon: string;
  keyFacts: string;
  summary: string;
  impact: string;
  impactColor: string;
  conf: number;
}

export const EVAL_ROWS: EvalRow[] = [
  { doc: 'policy_cert.pdf', type: 'Policy', icon: '📋', keyFacts: 'TRV-2024-8841, $200/day', summary: 'Sets coverage limits', impact: 'Sets coverage limits', impactColor: 'oklch(0.62 0.19 250)', conf: 0.94 },
  { doc: 'claim_form_v2.pdf', type: 'ClaimForm', icon: '📝', keyFacts: 'Incident: 2024-03-15', summary: 'Initiates claim process', impact: 'Context', impactColor: 'oklch(0.5 0.02 256)', conf: 0.91 },
  { doc: 'bag_report_cdg.pdf', type: 'BagReport', icon: '🧳', keyFacts: 'Lost baggage, CDG', summary: 'Confirms bag delay', impact: 'Confirms bag delay', impactColor: 'oklch(0.8 0.16 80)', conf: 0.88 },
  { doc: 'flight_ticket.pdf', type: 'Flight', icon: '✈️', keyFacts: '03-12 → 03-20, AA-123', summary: 'Validates trip dates', impact: 'Context', impactColor: 'oklch(0.5 0.02 256)', conf: 0.85 },
  { doc: 'receipts_paris.pdf', type: 'Receipt', icon: '🧾', keyFacts: '$127.50 + $45.00 + ...', summary: 'Supports claimed amount', impact: 'Supports claimed amount', impactColor: 'oklch(0.7 0.17 160)', conf: 0.91 },
];

export const MEAN_CONFIDENCE = 0.89;
export const TOTAL_AMOUNT = '$487.30';
