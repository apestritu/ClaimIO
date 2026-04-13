"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Zap } from "lucide-react";
import { LandingHero } from "./LandingHero";
import { LandingPain } from "./LandingPain";
import { LandingTransition } from "./LandingTransition";
import { LandingSolution } from "./LandingSolution";

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });

  const navOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const navBackdrop = useTransform(scrollYProgress, [0, 0.05], ["blur(0px)", "blur(12px)"]);

  return (
    <div ref={containerRef} className="h-screen overflow-y-auto scroll-smooth" style={{ background: "oklch(0.09 0.01 256)" }}>
      {/* Floating nav bar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          opacity: navOpacity,
          backdropFilter: navBackdrop,
          background: "oklch(0.09 0.01 256 / 80%)",
          borderBottom: "1px solid oklch(0.2 0.02 256 / 50%)",
        }}
      >
        <div className="flex items-center gap-2">
          <Zap size={18} style={{ color: "oklch(0.62 0.19 250)" }} />
          <span className="text-sm font-bold" style={{ color: "oklch(0.62 0.19 250)" }}>
            ClaimIO
          </span>
        </div>
        <motion.button
          className="px-4 py-1.5 rounded-full text-[10px] font-semibold"
          style={{
            background: "oklch(0.62 0.19 250 / 15%)",
            border: "1px solid oklch(0.62 0.19 250 / 30%)",
            color: "oklch(0.62 0.19 250)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEnter}
        >
          Launch App →
        </motion.button>
      </motion.nav>

      {/* Hero brand header (visible at top) */}
      <div className="flex items-center justify-center pt-12 pb-4">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "oklch(0.62 0.19 250 / 12%)",
              border: "1px solid oklch(0.62 0.19 250 / 25%)",
            }}
          >
            <Zap size={20} style={{ color: "oklch(0.62 0.19 250)" }} />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "oklch(0.62 0.19 250)" }}>
              ClaimIO
            </h1>
            <p className="text-[9px] text-muted-foreground tracking-widest uppercase">
              Automated Claim Intelligence
            </p>
          </div>
        </motion.div>
      </div>

      {/* Section 1 — Cinematic Scenarios */}
      <LandingHero />

      {/* Section 2 — Pain Visualization */}
      <LandingPain />

      {/* Section 3 — Transition */}
      <LandingTransition />

      {/* Section 4 — Solution */}
      <LandingSolution onEnter={onEnter} />

      {/* Footer */}
      <footer className="py-8 text-center" style={{ background: "oklch(0.08 0.01 256)" }}>
        <p className="text-[9px] text-muted-foreground/40 font-mono">
          Built with AI Agents · ClaimIO © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
