"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

interface PipelineStep {
  icon: string;
  label: string;
  description: string;
  color: string;
  duration: string;
}

const STEPS: PipelineStep[] = [
  {
    icon: "📤",
    label: "Upload",
    description: "Claimant submits PDFs — tickets, receipts, reports",
    color: "oklch(0.62 0.19 250)",
    duration: "Instant",
  },
  {
    icon: "🔍",
    label: "Scan & Understand",
    description: "AI reads, classifies, and extracts every fact",
    color: "oklch(0.7 0.15 195)",
    duration: "~8 sec",
  },
  {
    icon: "⚖️",
    label: "Evaluate",
    description: "Coverage reasoning against policy terms",
    color: "oklch(0.8 0.16 80)",
    duration: "~5 sec",
  },
  {
    icon: "🛡️",
    label: "Compliance",
    description: "Sanctions screening & fraud detection",
    color: "oklch(0.65 0.2 15)",
    duration: "~3 sec",
  },
  {
    icon: "✅",
    label: "Decision",
    description: "Automatic approve, deny, or escalate",
    color: "oklch(0.7 0.17 160)",
    duration: "~1 sec",
  },
  {
    icon: "💳",
    label: "Pay & Close",
    description: "Payment issued, case closed, claimant notified",
    color: "oklch(0.55 0.2 270)",
    duration: "~2 sec",
  },
];

export function LandingSolution({ onEnter }: { onEnter: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [activeStep, setActiveStep] = useState(-1);
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveStep(i), 800 + i * 700));
    });
    timers.push(setTimeout(() => setShowCTA(true), 800 + STEPS.length * 700 + 600));
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, oklch(0.12 0.03 250) 0%, oklch(0.1 0.02 256) 100%)",
      }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, oklch(0.62 0.19 250 / 6%) 0%, transparent 70%)",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
        animate={isInView ? { scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] } : {}}
        transition={{ duration: 6, repeat: Infinity }}
      />

      {/* Section header */}
      <motion.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-[11px] font-medium"
          style={{
            background: "oklch(0.62 0.19 250 / 10%)",
            border: "1px solid oklch(0.62 0.19 250 / 25%)",
            color: "oklch(0.62 0.19 250)",
          }}
        >
          <span>⚡</span>
          <span>Powered by AI Agents</span>
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          From chaos to clarity
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
          A fully automated pipeline that processes claims in under 30 seconds — end to end.
        </p>
      </motion.div>

      {/* Pipeline flow */}
      <div className="relative w-full max-w-4xl z-10">
        {/* Connection line */}
        <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 hidden md:block"
          style={{ background: "oklch(0.2 0.02 256)" }}
        >
          <motion.div
            className="h-full"
            style={{ background: "linear-gradient(90deg, oklch(0.62 0.19 250), oklch(0.7 0.17 160))" }}
            initial={{ width: "0%" }}
            animate={isInView ? { width: `${Math.max(0, ((activeStep + 1) / STEPS.length) * 100)}%` } : {}}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {STEPS.map((step, i) => {
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;

            return (
              <motion.div
                key={step.label}
                className="flex flex-col items-center text-center relative"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              >
                {/* Step node */}
                <motion.div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-3"
                  style={{
                    background: isActive
                      ? `${step.color}15`
                      : "oklch(0.14 0.02 256)",
                    border: `1.5px solid ${isActive ? `${step.color}50` : "oklch(0.22 0.02 256)"}`,
                    boxShadow: isCurrent ? `0 0 25px ${step.color}20` : "none",
                  }}
                  animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={isCurrent ? { duration: 1.5, repeat: Infinity } : {}}
                >
                  {step.icon}

                  {/* Scan effect for current step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                    >
                      <motion.div
                        className="absolute inset-x-0 h-px"
                        style={{ background: step.color }}
                        animate={{ top: ["0%", "100%"] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                    </motion.div>
                  )}

                  {/* Completed checkmark */}
                  <AnimatePresence>
                    {isActive && !isCurrent && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px]"
                        style={{
                          background: step.color,
                          color: "oklch(0.1 0.01 256)",
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Label */}
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: isActive ? step.color : "oklch(0.4 0.02 256)" }}
                >
                  {step.label}
                </span>

                {/* Description */}
                <span className="text-[8px] text-muted-foreground/60 mt-1 max-w-[120px] leading-tight">
                  {step.description}
                </span>

                {/* Duration badge */}
                <motion.span
                  className="mt-2 px-2 py-0.5 rounded-full text-[7px] font-mono"
                  style={{
                    background: isActive ? `${step.color}10` : "oklch(0.14 0.02 256)",
                    color: isActive ? step.color : "oklch(0.35 0.02 256)",
                    border: `1px solid ${isActive ? `${step.color}20` : "oklch(0.2 0.02 256)"}`,
                  }}
                >
                  {step.duration}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Total time */}
      <motion.div
        className="mt-12 text-center relative z-10"
        initial={{ opacity: 0 }}
        animate={activeStep >= STEPS.length - 1 ? { opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-8" style={{ background: "oklch(0.3 0.02 256)" }} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Total processing time</span>
          <div className="h-px w-8" style={{ background: "oklch(0.3 0.02 256)" }} />
        </div>
        <motion.div
          className="text-3xl font-bold font-mono mt-2"
          style={{ color: "oklch(0.7 0.17 160)" }}
          initial={{ scale: 0.8 }}
          animate={activeStep >= STEPS.length - 1 ? { scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          ~30 seconds
        </motion.div>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          vs. 30–44 days with manual processing
        </p>
      </motion.div>

      {/* CTA */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            className="mt-12 flex flex-col items-center gap-4 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.button
              className="px-8 py-3.5 rounded-2xl text-sm font-semibold relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, oklch(0.62 0.19 250), oklch(0.55 0.2 270))",
                color: "oklch(0.95 0 0)",
                boxShadow: "0 4px 30px oklch(0.62 0.19 250 / 25%)",
              }}
              whileHover={{ scale: 1.05, boxShadow: "0 6px 40px oklch(0.62 0.19 250 / 35%)" }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
            >
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(120deg, transparent 30%, oklch(1 0 0 / 10%) 50%, transparent 70%)",
                }}
                animate={{ x: [-200, 400] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative z-10 flex items-center gap-2">
                <span>See It In Action</span>
                <span>→</span>
              </span>
            </motion.button>

            <div className="flex items-center gap-4">
              <button
                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors underline underline-offset-2"
                onClick={onEnter}
              >
                Try the interactive demo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating document cards in background */}
      {isInView && (
        <>
          <motion.div
            className="absolute top-[15%] left-[8%] w-16 h-20 rounded-lg opacity-[0.06] pointer-events-none"
            style={{ background: "oklch(0.62 0.19 250)", border: "1px solid oklch(0.62 0.19 250 / 20%)" }}
            animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-[25%] right-[10%] w-12 h-16 rounded-lg opacity-[0.05] pointer-events-none"
            style={{ background: "oklch(0.7 0.15 195)", border: "1px solid oklch(0.7 0.15 195 / 20%)" }}
            animate={{ y: [0, 15, 0], rotate: [3, -3, 3] }}
            transition={{ duration: 7, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute bottom-[20%] left-[12%] w-14 h-18 rounded-lg opacity-[0.04] pointer-events-none"
            style={{ background: "oklch(0.8 0.16 80)", border: "1px solid oklch(0.8 0.16 80 / 20%)" }}
            animate={{ y: [0, -12, 0], rotate: [-3, 6, -3] }}
            transition={{ duration: 9, repeat: Infinity, delay: 2 }}
          />
        </>
      )}
    </section>
  );
}
