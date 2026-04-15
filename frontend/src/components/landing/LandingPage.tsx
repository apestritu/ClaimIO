"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { LandingHero } from "./LandingHero";
import { LandingPain } from "./LandingPain";
import { LandingTransition } from "./LandingTransition";
import { LandingSolution } from "./LandingSolution";

interface LandingPageProps {
  onEnter: () => void;
}

const SLIDE_LABELS = ["Scenarios", "The Problem", "Transition", "Solution"];

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export function LandingPage({ onEnter }: LandingPageProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const isAnimating = useRef(false);
  const totalSlides = 4;

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating.current) return;
      if (index < 0 || index >= totalSlides || index === slideIndex) return;
      setDirection(index > slideIndex ? 1 : -1);
      setSlideIndex(index);
      isAnimating.current = true;
    },
    [slideIndex]
  );

  const next = useCallback(() => goTo(slideIndex + 1), [goTo, slideIndex]);
  const prev = useCallback(() => goTo(slideIndex - 1), [goTo, slideIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  return (
    <div
      className="h-screen w-screen overflow-hidden relative flex flex-col"
      style={{ background: "oklch(0.09 0.01 256)" }}
    >
      {/* Top nav bar */}
      <nav
        className="flex items-center justify-between px-6 py-3 z-50 shrink-0"
        style={{
          background: "oklch(0.09 0.01 256 / 90%)",
          borderBottom: "1px solid oklch(0.2 0.02 256 / 30%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "oklch(0.62 0.19 250 / 12%)",
              border: "1px solid oklch(0.62 0.19 250 / 25%)",
            }}
          >
            <Zap size={16} style={{ color: "oklch(0.62 0.19 250)" }} />
          </motion.div>
          <div>
            <span className="text-sm font-bold" style={{ color: "oklch(0.62 0.19 250)" }}>
              ClaimIO
            </span>
            <span className="text-[8px] text-muted-foreground ml-2 tracking-widest uppercase hidden sm:inline">
              Automated Claim Intelligence
            </span>
          </div>
        </div>

        {/* Slide label */}
        <div className="absolute left-1/2 -translate-x-1/2 text-[10px] font-mono text-muted-foreground">
          {slideIndex + 1}/{totalSlides} · {SLIDE_LABELS[slideIndex]}
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
      </nav>

      {/* Slide area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence
          initial={false}
          custom={direction}
          mode="wait"
          onExitComplete={() => {
            isAnimating.current = false;
          }}
        >
          <motion.div
            key={slideIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 overflow-y-auto"
          >
            {slideIndex === 0 && <LandingHero />}
            {slideIndex === 1 && <LandingPain />}
            {slideIndex === 2 && <LandingTransition />}
            {slideIndex === 3 && <LandingSolution onEnter={onEnter} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div
        className="flex items-center justify-center gap-4 py-3 shrink-0 z-50"
        style={{
          background: "oklch(0.09 0.01 256 / 90%)",
          borderTop: "1px solid oklch(0.2 0.02 256 / 30%)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Prev button */}
        <button
          onClick={prev}
          disabled={slideIndex === 0}
          className="p-1.5 rounded-lg hover:bg-glass-border transition-colors disabled:opacity-20"
          style={{ color: "oklch(0.62 0.19 250)" }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {SLIDE_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => goTo(i)}
              className="group flex flex-col items-center gap-1"
            >
              <motion.div
                className="rounded-full transition-colors"
                style={{
                  width: i === slideIndex ? 24 : 8,
                  height: 8,
                  background: i === slideIndex
                    ? "oklch(0.62 0.19 250)"
                    : "oklch(0.3 0.02 256)",
                }}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={next}
          disabled={slideIndex === totalSlides - 1}
          className="p-1.5 rounded-lg hover:bg-glass-border transition-colors disabled:opacity-20"
          style={{ color: "oklch(0.62 0.19 250)" }}
        >
          <ChevronRight size={18} />
        </button>

        {/* Keyboard hint */}
        <span className="text-[8px] text-muted-foreground/40 font-mono ml-3">
          ← → arrows
        </span>
      </div>
    </div>
  );
}
