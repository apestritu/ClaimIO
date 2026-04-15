/**
 * Cosmetic mapping from backend document types to icons and colors
 * used by the animation components.
 */

export interface DocTypeStyle {
  icon: string;
  color: string;
}

const DOC_TYPE_MAP: Record<string, DocTypeStyle> = {
  Policy:                   { icon: '📋', color: 'oklch(0.62 0.19 250)' },
  ClaimForm:                { icon: '📝', color: 'oklch(0.55 0.2 270)' },
  BagReport:                { icon: '🧳', color: 'oklch(0.8 0.16 80)' },
  FlightTicket:             { icon: '✈️', color: 'oklch(0.7 0.15 195)' },
  Receipt:                  { icon: '🧾', color: 'oklch(0.7 0.17 160)' },
  PhysicianStatement:       { icon: '🩺', color: 'oklch(0.65 0.2 15)' },
  CancellationConfirmation: { icon: '❌', color: 'oklch(0.65 0.2 15)' },
  TripSummary:              { icon: '📊', color: 'oklch(0.62 0.19 250)' },
  Email:                    { icon: '📧', color: 'oklch(0.7 0.15 195)' },
};

const DEFAULT_STYLE: DocTypeStyle = { icon: '📄', color: 'oklch(0.5 0.02 256)' };

export function getDocTypeStyle(docType: string): DocTypeStyle {
  return DOC_TYPE_MAP[docType] ?? DEFAULT_STYLE;
}
