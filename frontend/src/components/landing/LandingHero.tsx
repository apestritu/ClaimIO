"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Scene {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  elements: React.ReactNode;
}

export function LandingHero() {
  const [activeScene, setActiveScene] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const scenes: Scene[] = [
    {
      id: "cancellation",
      title: "Trip Cancelled",
      subtitle: "Your dream vacation — gone in an instant",
      emoji: "✈️",
      color: "oklch(0.65 0.2 15)",
      elements: <TripCancellationScene />,
    },
    {
      id: "luggage",
      title: "Luggage Lost",
      subtitle: "Arrived at your destination — your bags didn't",
      emoji: "🧳",
      color: "oklch(0.8 0.16 80)",
      elements: <LostLuggageScene />,
    },
    {
      id: "delay",
      title: "Flight Delayed",
      subtitle: "Hours pass. No updates. No compensation.",
      emoji: "⏳",
      color: "oklch(0.62 0.19 250)",
      elements: <FlightDelayScene />,
    },
  ];

  const nextScene = useCallback(() => {
    setActiveScene((prev) => (prev + 1) % scenes.length);
  }, [scenes.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(nextScene, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, nextScene]);

  const current = scenes[activeScene];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Ambient background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${current.color}12 0%, transparent 70%)`,
        }}
        transition={{ duration: 1.5 }}
      />

      {/* Floating particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full opacity-20"
          style={{ background: current.color }}
          animate={{
            x: [0, (Math.random() - 0.5) * 200],
            y: [0, (Math.random() - 0.5) * 300],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          initial={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
        />
      ))}

      {/* Top badge */}
      <motion.div
        className="mb-8 px-4 py-1.5 rounded-full text-[11px] font-medium tracking-wider uppercase"
        style={{
          background: "oklch(0.2 0.02 256 / 60%)",
          border: "1px solid oklch(0.3 0.02 256)",
          color: "oklch(0.7 0.02 256)",
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Every day, millions of travelers face this
      </motion.div>

      {/* Scene animation area */}
      <div className="relative w-full max-w-3xl h-[340px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, x: 80, filter: "blur(12px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -80, filter: "blur(12px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {current.elements}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Title + subtitle */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + "-text"}
          className="text-center mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5 }}
        >
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: current.color }}
          >
            {current.title}
          </h2>
          <p className="mt-3 text-base text-muted-foreground max-w-md mx-auto">
            {current.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Scene indicators */}
      <div className="flex gap-3 mt-10">
        {scenes.map((scene, i) => (
          <button
            key={scene.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all"
            style={{
              background: i === activeScene ? `${scene.color}20` : "oklch(0.18 0.02 256)",
              border: `1px solid ${i === activeScene ? `${scene.color}50` : "oklch(0.25 0.02 256)"}`,
              color: i === activeScene ? scene.color : "oklch(0.5 0.02 256)",
            }}
            onClick={() => {
              setActiveScene(i);
              setIsAutoPlaying(false);
            }}
          >
            <span>{scene.emoji}</span>
            <span>{scene.title}</span>
          </button>
        ))}
      </div>

      {/* Progress bar for auto-play */}
      {isAutoPlaying && (
        <div className="mt-4 w-32 h-0.5 rounded-full overflow-hidden" style={{ background: "oklch(0.2 0.02 256)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: current.color }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
            key={activeScene}
          />
        </div>
      )}

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 flex flex-col items-center gap-1"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[10px] text-muted-foreground/50 tracking-widest uppercase">Scroll</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground/30">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
    </section>
  );
}

/* ─── Scene Components ─── */

function TripCancellationScene() {
  const [boardRows, setBoardRows] = useState<{ city: string; time: string; status: string; cancelled: boolean }[]>([
    { city: "Paris CDG", time: "14:30", status: "On Time", cancelled: false },
    { city: "London LHR", time: "15:45", status: "Boarding", cancelled: false },
    { city: "Rome FCO", time: "16:20", status: "On Time", cancelled: false },
    { city: "Barcelona BCN", time: "17:10", status: "On Time", cancelled: false },
    { city: "Athens ATH", time: "18:00", status: "Delayed", cancelled: false },
  ]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setBoardRows((prev) =>
        prev.map((r, i) => (i === 0 ? { ...r, status: "CANCELLED", cancelled: true } : r))
      );
    }, 1200);
    const t2 = setTimeout(() => {
      setBoardRows((prev) =>
        prev.map((r, i) => (i === 2 ? { ...r, status: "CANCELLED", cancelled: true } : r))
      );
    }, 2200);
    const t3 = setTimeout(() => {
      setBoardRows((prev) =>
        prev.map((r, i) => (i === 4 ? { ...r, status: "CANCELLED", cancelled: true } : r))
      );
    }, 3000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div className="flex items-center gap-8">
      {/* Departure board */}
      <motion.div
        className="rounded-xl overflow-hidden w-[360px]"
        style={{
          background: "oklch(0.1 0.01 256)",
          border: "1px solid oklch(0.2 0.02 256)",
          boxShadow: "0 20px 60px oklch(0 0 0 / 50%)",
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="px-4 py-2 flex items-center gap-2" style={{ background: "oklch(0.13 0.01 256)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "oklch(0.8 0.16 80)" }} />
          <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase">
            Departures — Terminal 2
          </span>
        </div>
        {/* Header row */}
        <div className="grid grid-cols-3 px-4 py-1.5 text-[8px] font-mono text-muted-foreground/60 uppercase tracking-wider"
          style={{ borderBottom: "1px solid oklch(0.2 0.02 256)" }}>
          <span>Destination</span>
          <span className="text-center">Time</span>
          <span className="text-right">Status</span>
        </div>
        {boardRows.map((row, i) => (
          <motion.div
            key={row.city}
            className="grid grid-cols-3 px-4 py-2 text-[10px] font-mono"
            style={{ borderBottom: "1px solid oklch(0.15 0.01 256)" }}
            animate={{
              backgroundColor: row.cancelled ? "oklch(0.65 0.2 15 / 6%)" : "transparent",
            }}
          >
            <span className="text-foreground/80">{row.city}</span>
            <span className="text-center text-muted-foreground">{row.time}</span>
            <motion.span
              className="text-right font-bold"
              style={{
                color: row.cancelled
                  ? "oklch(0.65 0.2 15)"
                  : row.status === "Delayed"
                  ? "oklch(0.8 0.16 80)"
                  : "oklch(0.7 0.17 160)",
              }}
              animate={row.cancelled ? { opacity: [1, 0.4, 1] } : {}}
              transition={row.cancelled ? { duration: 1, repeat: Infinity } : {}}
            >
              {row.status}
            </motion.span>
          </motion.div>
        ))}
      </motion.div>

      {/* Traveler silhouette */}
      <motion.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="text-6xl"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          😰
        </motion.div>
        <span className="text-[9px] text-muted-foreground/50 font-mono">Claim filed: 44 days ago</span>
        <span className="text-[9px] font-mono" style={{ color: "oklch(0.65 0.2 15)" }}>
          Status: "Under review"
        </span>
      </motion.div>
    </div>
  );
}

function LostLuggageScene() {
  const [luggageFallen, setLuggageFallen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLuggageFallen(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Sky / clouds */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 60 + i * 40,
            height: 8,
            background: "oklch(0.3 0.02 256 / 20%)",
            top: `${20 + i * 15}%`,
          }}
          animate={{ x: [-100, 500] }}
          transition={{ duration: 12 + i * 3, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {/* Airplane */}
      <motion.div
        className="absolute text-4xl"
        style={{ top: "25%" }}
        animate={{ x: [-200, 250] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        ✈️
      </motion.div>

      {/* Falling luggage */}
      <AnimatePresence>
        {luggageFallen && (
          <motion.div
            className="absolute text-3xl"
            initial={{ x: 0, y: -20, rotate: 0 }}
            animate={{ y: 120, rotate: 45, opacity: [1, 1, 0.6] }}
            transition={{ duration: 1.5, ease: "easeIn" }}
            style={{ top: "30%", left: "45%" }}
          >
            🧳
          </motion.div>
        )}
      </AnimatePresence>

      {/* Baggage carousel */}
      <motion.div
        className="absolute bottom-12 w-[340px] rounded-xl p-4 flex flex-col items-center gap-3"
        style={{
          background: "oklch(0.12 0.01 256 / 80%)",
          border: "1px solid oklch(0.2 0.02 256)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">
          Baggage Claim — Belt 4
        </div>
        {/* Empty carousel track */}
        <div className="w-full h-6 rounded-full relative overflow-hidden" style={{ background: "oklch(0.15 0.01 256)" }}>
          <motion.div
            className="absolute inset-y-0 w-8 rounded-full"
            style={{ background: "oklch(0.2 0.02 256)" }}
            animate={{ x: [0, 280, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <motion.div
            className="text-3xl"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            😞
          </motion.div>
          <div className="text-[10px] text-muted-foreground">
            <div>Waiting... 45 minutes</div>
            <div className="font-mono" style={{ color: "oklch(0.8 0.16 80)" }}>No bags found</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FlightDelayScene() {
  const [hours, setHours] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHours((prev) => (prev >= 8 ? 0 : prev + 1));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-10">
      {/* Giant clock */}
      <motion.div
        className="relative w-32 h-32 rounded-full flex items-center justify-center"
        style={{
          background: "oklch(0.12 0.01 256)",
          border: "2px solid oklch(0.25 0.02 256)",
          boxShadow: "0 0 40px oklch(0.62 0.19 250 / 10%)",
        }}
      >
        {/* Clock face marks */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-2 rounded-full"
            style={{
              background: "oklch(0.35 0.02 256)",
              transform: `rotate(${i * 30}deg) translateY(-52px)`,
              transformOrigin: "center center",
              top: "50%",
              left: "50%",
              marginLeft: "-1px",
              marginTop: "-4px",
            }}
          />
        ))}
        {/* Hour hand */}
        <motion.div
          className="absolute w-0.5 h-8 rounded-full origin-bottom"
          style={{
            background: "oklch(0.62 0.19 250)",
            bottom: "50%",
            left: "50%",
            marginLeft: "-1px",
          }}
          animate={{ rotate: hours * 30 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        />
        {/* Minute hand */}
        <motion.div
          className="absolute w-px h-10 rounded-full origin-bottom"
          style={{
            background: "oklch(0.5 0.02 256)",
            bottom: "50%",
            left: "50%",
          }}
          animate={{ rotate: hours * 180 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        />
        {/* Center dot */}
        <div
          className="absolute w-2 h-2 rounded-full"
          style={{ background: "oklch(0.62 0.19 250)" }}
        />
        {/* Hours elapsed */}
        <div className="absolute -bottom-8 text-center">
          <span className="text-lg font-bold font-mono" style={{ color: "oklch(0.62 0.19 250)" }}>
            +{hours}h
          </span>
        </div>
      </motion.div>

      {/* Waiting area */}
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="text-5xl"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            😤
          </motion.div>
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-mono text-muted-foreground">Gate B42 — Delayed</div>
            <motion.div
              className="text-[10px] font-mono font-bold"
              style={{ color: "oklch(0.62 0.19 250)" }}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              New departure: TBD
            </motion.div>
          </div>
        </div>

        {/* Phone with no updates */}
        <motion.div
          className="w-24 h-40 rounded-xl flex flex-col items-center justify-center gap-2"
          style={{
            background: "oklch(0.12 0.01 256)",
            border: "1px solid oklch(0.2 0.02 256)",
          }}
        >
          <motion.div
            className="w-14 h-2 rounded-full"
            style={{ background: "oklch(0.2 0.02 256)" }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div className="w-10 h-2 rounded-full" style={{ background: "oklch(0.2 0.02 256)" }} />
          <div className="text-[7px] font-mono text-muted-foreground/40 mt-2">No updates</div>
        </motion.div>
      </motion.div>
    </div>
  );
}
