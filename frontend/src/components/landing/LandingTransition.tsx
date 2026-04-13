"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function LandingTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <section
      ref={ref}
      className="relative h-[70vh] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Dark-to-light gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={isInView ? {
          background: [
            "linear-gradient(180deg, oklch(0.08 0.01 256) 0%, oklch(0.08 0.01 256) 100%)",
            "linear-gradient(180deg, oklch(0.08 0.01 256) 0%, oklch(0.12 0.02 250) 50%, oklch(0.14 0.03 250) 100%)",
          ],
        } : {}}
        transition={{ duration: 2, delay: 0.3 }}
      />

      {/* Central activation ring */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          border: "1px solid oklch(0.62 0.19 250 / 0%)",
        }}
        animate={isInView ? {
          scale: [0.3, 1, 2.5],
          opacity: [0, 0.6, 0],
          borderColor: [
            "oklch(0.62 0.19 250 / 0%)",
            "oklch(0.62 0.19 250 / 40%)",
            "oklch(0.62 0.19 250 / 0%)",
          ],
        } : {}}
        transition={{ duration: 2.5, delay: 0.5 }}
      />

      {/* Second ring */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          border: "1px solid oklch(0.7 0.15 195 / 0%)",
        }}
        animate={isInView ? {
          scale: [0.3, 1, 2.5],
          opacity: [0, 0.4, 0],
          borderColor: [
            "oklch(0.7 0.15 195 / 0%)",
            "oklch(0.7 0.15 195 / 30%)",
            "oklch(0.7 0.15 195 / 0%)",
          ],
        } : {}}
        transition={{ duration: 2.5, delay: 0.8 }}
      />

      {/* Central glow orb */}
      <motion.div
        className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
        animate={isInView ? {
          scale: [0, 1.2, 1],
          opacity: [0, 1, 1],
        } : { scale: 0, opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.3, type: "spring", stiffness: 150, damping: 12 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, oklch(0.62 0.19 250 / 30%) 0%, transparent 70%)",
            boxShadow: "0 0 60px oklch(0.62 0.19 250 / 25%)",
          }}
          animate={isInView ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.span
          className="text-3xl relative z-10"
          animate={isInView ? { rotate: [0, 360] } : {}}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          ⚡
        </motion.span>
      </motion.div>

      {/* Text reveal */}
      <motion.div
        className="relative z-10 mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <motion.h2
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ color: "oklch(0.62 0.19 250)" }}
          animate={isInView ? {
            textShadow: [
              "0 0 20px oklch(0.62 0.19 250 / 0%)",
              "0 0 30px oklch(0.62 0.19 250 / 30%)",
              "0 0 20px oklch(0.62 0.19 250 / 10%)",
            ],
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        >
          What if it just... worked?
        </motion.h2>
        <motion.p
          className="mt-3 text-sm text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 2.2, duration: 0.6 }}
        >
          Intelligent automation that reads, understands, decides, and pays — in minutes, not months.
        </motion.p>
      </motion.div>

      {/* Particle burst on activation */}
      {isInView && Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 2 === 0 ? "oklch(0.62 0.19 250)" : "oklch(0.7 0.15 195)",
              top: "50%",
              left: "50%",
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: Math.cos(angle) * (120 + Math.random() * 80),
              y: Math.sin(angle) * (120 + Math.random() * 80),
              opacity: [0, 0.8, 0],
            }}
            transition={{ duration: 1.5, delay: 0.5 + i * 0.03 }}
          />
        );
      })}

      {/* Bottom gradient fade into next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, oklch(0.12 0.03 250))",
        }}
      />
    </section>
  );
}
