"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface Metric {
  value: string;
  numericEnd: number;
  prefix?: string;
  suffix?: string;
  label: string;
  icon: string;
  color: string;
}

const METRICS: Metric[] = [
  {
    value: "30–44",
    numericEnd: 44,
    suffix: " days",
    label: "Average claim processing time",
    icon: "⏱️",
    color: "oklch(0.65 0.2 15)",
  },
  {
    value: "80",
    numericEnd: 80,
    suffix: "%",
    label: "Manual document handling",
    icon: "📄",
    color: "oklch(0.8 0.16 80)",
  },
  {
    value: "300",
    numericEnd: 300,
    prefix: "$",
    suffix: "B+",
    label: "Annual fraud losses (US)",
    icon: "💸",
    color: "oklch(0.65 0.2 15)",
  },
  {
    value: "52",
    numericEnd: 52,
    suffix: "%",
    label: "Customer churn after bad experience",
    icon: "👋",
    color: "oklch(0.62 0.19 250)",
  },
];

function AnimatedCounter({ end, prefix = "", suffix = "", color, inView }: {
  end: number; prefix?: string; suffix?: string; color: string; inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const duration = 2000;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, inView]);

  return (
    <span className="text-4xl md:text-5xl font-bold font-mono tabular-nums" style={{ color }}>
      {prefix}{count}{suffix}
    </span>
  );
}

export function LandingPain() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24"
      style={{ background: "oklch(0.08 0.01 256)" }}
    >
      {/* Background pulse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={isInView ? {
          background: [
            "radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.65 0.2 15 / 4%) 0%, transparent 70%)",
            "radial-gradient(ellipse 80% 50% at 50% 50%, oklch(0.65 0.2 15 / 8%) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.65 0.2 15 / 4%) 0%, transparent 70%)",
          ],
        } : {}}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Section title */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Today&apos;s Reality
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
          The insurance claims process is broken. Here&apos;s the cost.
        </p>
      </motion.div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
        {METRICS.map((metric, i) => (
          <motion.div
            key={metric.label}
            className="relative rounded-2xl p-6 flex flex-col gap-3 overflow-hidden group"
            style={{
              background: "oklch(0.12 0.01 256 / 60%)",
              border: `1px solid ${metric.color}15`,
            }}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Glow on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 100%, ${metric.color}10 0%, transparent 70%)`,
              }}
            />

            <div className="flex items-start justify-between">
              <span className="text-2xl">{metric.icon}</span>
              <motion.div
                className="w-8 h-1 rounded-full"
                style={{ background: `${metric.color}30` }}
                animate={isInView ? { width: [0, 32] } : {}}
                transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
              />
            </div>

            <AnimatedCounter
              end={metric.numericEnd}
              prefix={metric.prefix}
              suffix={metric.suffix}
              color={metric.color}
              inView={isInView}
            />

            <span className="text-xs text-muted-foreground">{metric.label}</span>

            {/* Subtle pulse line */}
            <motion.div
              className="absolute bottom-0 left-0 h-px"
              style={{ background: metric.color }}
              animate={isInView ? { width: ["0%", "100%", "0%"] } : {}}
              transition={{ duration: 3, delay: 1 + i * 0.2, repeat: Infinity }}
            />
          </motion.div>
        ))}
      </div>

      {/* Summary statement */}
      <motion.div
        className="mt-16 text-center"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {["Slow.", "Expensive.", "Error-prone.", "Frustrating."].map((word, i) => (
            <motion.span
              key={word}
              className="text-xl md:text-2xl font-bold"
              style={{ color: "oklch(0.65 0.2 15)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.8 + i * 0.2, duration: 0.4 }}
            >
              {word}
            </motion.span>
          ))}
        </div>
        <motion.p
          className="mt-4 text-sm text-muted-foreground/60 max-w-sm mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 2.8, duration: 0.6 }}
        >
          There has to be a better way.
        </motion.p>
      </motion.div>
    </section>
  );
}
