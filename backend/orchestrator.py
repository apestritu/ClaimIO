"""
Orchestrator — code-driven pipeline that runs each agent step in order.

Pipeline:
  1. Ingest (OCR + classify)
  2. Evidence Collection (check required docs)
  3. Fact Extraction (per-doc, parallel)
  4. Evidence Evaluation (assess quality)
  5. Coverage Reasoning (GPT policy analysis)
  6. Compliance (sanctions + fraud)
  7. Decision (approve / deny / escalate)
  8. Payment (if approved)
  9. Close & Notify (final summary)
"""

from __future__ import annotations

import logging

from a2a import EventBus, TaskEvent, TaskStatus
from pipeline.ingest import run_ingest
from pipeline.evidence_collection import run_evidence_collection
from pipeline.fact_extraction import run_fact_extraction
from pipeline.evidence_evaluation import run_evidence_evaluation
from pipeline.coverage import run_coverage
from pipeline.compliance import run_compliance
from pipeline.decision import run_decision
from pipeline.payment import run_payment
from pipeline.close_notify import run_close_notify

logger = logging.getLogger(__name__)

PIPELINE_STEPS = [
    "IngestAgent",
    "EvidenceCollectionAgent",
    "FactExtractionAgent",
    "EvidenceEvaluationAgent",
    "CoverageReasoningAgent",
    "ComplianceAgent",
    "DecisionAgent",
    "PaymentAgent",
    "CloseNotifyAgent",
]


async def run_pipeline(case_id: str, bus: EventBus) -> dict:
    """Execute the full claim processing pipeline for a case."""
    await bus.publish(TaskEvent(
        agent="Orchestrator",
        status=TaskStatus.WORKING,
        message=f"Starting claim pipeline for {case_id}",
        data={"case_id": case_id, "steps": PIPELINE_STEPS},
    ))

    try:
        # Step 1: Ingest
        ctx = await run_ingest(case_id, bus)

        # Step 2: Evidence Collection
        ctx = await run_evidence_collection(ctx, bus)

        # Step 3: Fact Extraction
        ctx = await run_fact_extraction(ctx, bus)

        # Step 4: Evidence Evaluation
        ctx = await run_evidence_evaluation(ctx, bus)

        # Step 5: Coverage Reasoning
        ctx = await run_coverage(ctx, bus)

        # Step 6: Compliance
        ctx = await run_compliance(ctx, bus)

        # Step 7: Decision
        ctx = await run_decision(ctx, bus)

        # Step 8: Payment
        ctx = await run_payment(ctx, bus)

        # Step 9: Close & Notify
        ctx = await run_close_notify(ctx, bus)

        await bus.publish(TaskEvent(
            agent="Orchestrator",
            status=TaskStatus.COMPLETED,
            message=f"Pipeline complete for {case_id}. Decision: {ctx.get('decision', {}).get('status')}",
            data={"final_summary": ctx.get("final_summary", {})},
        ))

        return ctx

    except Exception as e:
        logger.exception("Pipeline failed for %s", case_id)
        await bus.publish(TaskEvent(
            agent="Orchestrator",
            status=TaskStatus.FAILED,
            message=f"Pipeline failed: {str(e)}",
            data={"error": str(e)},
        ))
        raise
    finally:
        await bus.close()
