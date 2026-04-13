"use client";

import { motion } from "framer-motion";
import { PIPELINE_STEPS, AGENT_EXPRESSIONS } from "@/lib/claim-data";
import type { AgentEvent } from "@/lib/useEventStream";

interface AgentPhaseAnimationProps {
  agentId: string;
  events: AgentEvent[];
  isCompleted: boolean;
}

export function AgentPhaseAnimation({ agentId, events, isCompleted }: AgentPhaseAnimationProps) {
  const step = PIPELINE_STEPS.find((s) => s.id === agentId);
  const agentEvents = events.filter((e) => e.agent === agentId);
  const expression = AGENT_EXPRESSIONS[agentId] || "🤖";
  const color = step?.color || "oklch(0.62 0.19 250)";

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
      {/* Agent orb */}
      <motion.div
        className="w-24 h-24 rounded-full flex items-center justify-center text-4xl relative"
        style={{
          background: `radial-gradient(circle, ${color}30, ${color}10)`,
          border: `2px solid ${color}60`,
          boxShadow: `0 0 40px ${color}25, 0 0 80px ${color}10`,
        }}
        animate={
          isCompleted
            ? { scale: 1 }
            : { scale: [1, 1.08, 1] }
        }
        transition={isCompleted ? {} : { duration: 2, repeat: Infinity }}
      >
        {expression}
        {!isCompleted && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${color}` }}
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Step name */}
      <motion.h3
        className="text-lg font-bold"
        style={{ color }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {step?.label || agentId}
      </motion.h3>

      {/* Event messages */}
      <div className="w-full max-w-md space-y-2">
        {agentEvents.slice(-5).map((evt, i) => (
          <motion.div
            key={evt.id}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg glass-panel"
            style={{
              borderColor:
                evt.status === "completed"
                  ? "oklch(0.7 0.17 160 / 30%)"
                  : evt.status === "failed"
                  ? "oklch(0.65 0.2 15 / 30%)"
                  : undefined,
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="text-sm">
              {evt.status === "completed" ? "✅" : evt.status === "failed" ? "❌" : "⚙️"}
            </span>
            <span className="text-xs text-muted-foreground font-mono truncate">
              {evt.message}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Completion check */}
      {isCompleted && (
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.svg viewBox="0 0 52 52" className="w-12 h-12">
            <motion.circle
              cx="26" cy="26" r="24"
              fill="none"
              stroke={color}
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6 }}
            />
            <motion.path
              d="M14 27 L22 35 L38 19"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            />
          </motion.svg>
        </motion.div>
      )}
    </div>
  );
}
