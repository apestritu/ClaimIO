"use client";

import { useState, useCallback, useRef } from "react";
import type { AgentEvent, PipelineState } from "./useEventStream";
import { PIPELINE_STEPS } from "./claim-data";

const INITIAL_STATE: PipelineState = {
  isRunning: false,
  events: [],
  currentAgent: null,
  completedAgents: [],
  error: null,
  finalSummary: null,
};

const MOCK_MESSAGES: Record<string, string[]> = {
  IngestAgent: [
    "OCR processing: policy_cert.pdf...",
    'Classified as "Policy" (conf: 0.94)',
    "OCR processing: claim_form_v2.pdf...",
    'Classified as "ClaimForm" (conf: 0.91)',
    "OCR processing: bag_damage_report.pdf...",
    'Classified as "BagReport" (conf: 0.88)',
    "All documents ingested successfully",
  ],
  EvidenceCollectionAgent: [
    "Checking required documents...",
    "Policy — found",
    "ClaimForm — found",
    "BagReport — found",
    "FlightTicket — found",
    "All required documents present",
  ],
  FactExtractionAgent: [
    "Extracting facts from 6 documents (4 parallel)...",
    "policy_cert.pdf → Policy | conf: 0.94",
    "claim_form_v2.pdf → ClaimForm | conf: 0.91",
    "bag_damage_report.pdf → BagReport | conf: 0.88",
    "flight_ticket_AA123.pdf → FlightTicket | conf: 0.85",
    "repair_receipt.pdf → Receipt | conf: 0.90",
    "Fact Map consolidated — 11 facts extracted",
  ],
  EvidenceEvaluationAgent: [
    "Evaluating evidence quality...",
    "Cross-referencing dates with policy coverage...",
    "Checking incident timeline consistency...",
    "Evidence quality score: 0.87",
    "No contradictions found in evidence",
  ],
  CoverageReasoningAgent: [
    "Analyzing policy coverage terms...",
    "Matching claim type to coverage section 4.2...",
    "Coverage applies: baggage delay > 6 hours",
    "Maximum coverage limit: $500.00",
    "Coverage confidence: 0.91",
  ],
  ComplianceAgent: [
    "Running compliance checks...",
    "OFAC sanctions screening...",
    "No sanctions hits found",
    "Anti-fraud pattern analysis...",
    "Fraud risk score: 0.08 (low)",
    "All compliance checks passed",
  ],
  DecisionAgent: [
    "Reviewing all agent outputs...",
    "Coverage: APPROVED at $172.50",
    "Compliance: PASS",
    "Evidence quality: HIGH",
    "Final decision: APPROVED — $172.50",
  ],
  PaymentAgent: [
    "Initiating payment process...",
    "Payment method: direct deposit",
    "Amount: $172.50 USD",
    "Payment processed successfully",
  ],
  CloseNotifyAgent: [
    "Generating claim summary...",
    "Sending notification to claimant...",
    "Email sent: claim_approved_CLM-2024-08-4721.pdf",
    "Case closed successfully",
  ],
};

const MOCK_FINAL_SUMMARY: Record<string, unknown> = {
  claim_status: "APPROVED",
  approved_amount: 172.5,
  global_confidence: 0.89,
  coverage_confidence: 0.91,
  fraud_risk: 0.08,
  sanctions_hit: false,
  meets_thresholds: true,
  documents_processed: 6,
  payment_processed: true,
  coverage_reasoning:
    "The claimant's baggage was delayed for more than 6 hours on flight AA-123 from CDG to JFK on March 15, 2024. Policy TRV-2024-8841 covers baggage delay under Section 4.2 with a maximum limit of $500. The claimant submitted repair receipts totaling $172.50 USD, which falls within the coverage limit. All required documentation has been provided and verified.",
  issues: [],
  evidence_checklist: [
    { requirement: "Valid policy document", status: "provided", confidence: 0.94 },
    { requirement: "Completed claim form", status: "provided", confidence: 0.91 },
    { requirement: "Incident report", status: "provided", confidence: 0.88 },
    { requirement: "Proof of travel", status: "provided", confidence: 0.85 },
    { requirement: "Expense receipts", status: "provided", confidence: 0.91 },
  ],
};

export function useMockPipeline() {
  const [state, setState] = useState<PipelineState>(INITIAL_STATE);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const startPipeline = useCallback(
    async (caseId: string) => {
      clearTimeouts();

      setState({
        ...INITIAL_STATE,
        isRunning: true,
      });

      const steps = PIPELINE_STEPS;
      let delay = 300;
      const allEvents: AgentEvent[] = [];

      // Orchestrator start
      const orchStart: AgentEvent = {
        id: crypto.randomUUID(),
        agent: "Orchestrator",
        status: "working",
        message: `Starting pipeline for ${caseId}`,
        data: {},
        timestamp: Date.now() / 1000,
      };

      timeoutsRef.current.push(
        setTimeout(() => {
          allEvents.push(orchStart);
          setState((prev) => ({
            ...prev,
            events: [...prev.events, orchStart],
          }));
        }, delay)
      );
      delay += 400;

      for (const step of steps) {
        const messages = MOCK_MESSAGES[step.id] || ["Processing..."];

        // Working event
        const workingEvt: AgentEvent = {
          id: crypto.randomUUID(),
          agent: step.id,
          status: "working",
          message: `${step.label} agent started`,
          data: {},
          timestamp: Date.now() / 1000,
        };

        const capturedDelay1 = delay;
        timeoutsRef.current.push(
          setTimeout(() => {
            allEvents.push(workingEvt);
            setState((prev) => ({
              ...prev,
              events: [...prev.events, workingEvt],
              currentAgent: step.id,
            }));
          }, capturedDelay1)
        );
        delay += 600;

        // Sub-messages
        for (const msg of messages) {
          const subEvt: AgentEvent = {
            id: crypto.randomUUID(),
            agent: step.id,
            status: "working",
            message: msg,
            data: {},
            timestamp: Date.now() / 1000,
          };

          const capturedDelay2 = delay;
          timeoutsRef.current.push(
            setTimeout(() => {
              allEvents.push(subEvt);
              setState((prev) => ({
                ...prev,
                events: [...prev.events, subEvt],
              }));
            }, capturedDelay2)
          );
          delay += 350 + Math.random() * 300;
        }

        // Completed event
        const completedEvt: AgentEvent = {
          id: crypto.randomUUID(),
          agent: step.id,
          status: "completed",
          message: `${step.label} agent completed`,
          data: {},
          timestamp: Date.now() / 1000,
        };

        const capturedDelay3 = delay;
        const stepId = step.id;
        timeoutsRef.current.push(
          setTimeout(() => {
            allEvents.push(completedEvt);
            setState((prev) => ({
              ...prev,
              events: [...prev.events, completedEvt],
              currentAgent: prev.currentAgent === stepId ? null : prev.currentAgent,
              completedAgents: prev.completedAgents.includes(stepId)
                ? prev.completedAgents
                : [...prev.completedAgents, stepId],
            }));
          }, capturedDelay3)
        );
        delay += 500;
      }

      // Orchestrator complete
      const orchDone: AgentEvent = {
        id: crypto.randomUUID(),
        agent: "Orchestrator",
        status: "completed",
        message: "Pipeline completed successfully",
        data: { final_summary: MOCK_FINAL_SUMMARY },
        timestamp: Date.now() / 1000,
      };

      timeoutsRef.current.push(
        setTimeout(() => {
          allEvents.push(orchDone);
          setState((prev) => ({
            ...prev,
            events: [...prev.events, orchDone],
            isRunning: false,
            finalSummary: MOCK_FINAL_SUMMARY,
          }));
        }, delay)
      );
    },
    [clearTimeouts]
  );

  const reset = useCallback(() => {
    clearTimeouts();
    setState(INITIAL_STATE);
  }, [clearTimeouts]);

  return { state, startPipeline, reset };
}
