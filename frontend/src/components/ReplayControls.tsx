"use client";

import { useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import type { ReplaySpeed, ReplayStatus } from '@/lib/useReplayPipeline';

interface ReplayControlsProps {
  status: ReplayStatus;
  speed: ReplaySpeed;
  currentIndex: number;
  totalEvents: number;
  currentAgent: string | null;
  onPlay: () => void;
  onPause: () => void;
  onSetSpeed: (speed: ReplaySpeed) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeekTo: (index: number) => void;
  onRestart: () => void;
  onStop: () => void;
}

const SPEEDS: ReplaySpeed[] = [1, 2, 4];

export function ReplayControls({
  status,
  speed,
  currentIndex,
  totalEvents,
  currentAgent,
  onPlay,
  onPause,
  onSetSpeed,
  onStepForward,
  onStepBackward,
  onSeekTo,
  onRestart,
  onStop,
}: ReplayControlsProps) {
  const progress = totalEvents > 0 ? ((currentIndex + 1) / totalEvents) * 100 : 0;
  const barRef = useRef<HTMLDivElement>(null);

  // Click on progress bar to seek
  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current;
    if (!bar || totalEvents === 0) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetIndex = Math.round(pct * (totalEvents - 1));
    onSeekTo(targetIndex);
  }, [totalEvents, onSeekTo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          onStepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onStepBackward();
          break;
        case ' ':
          e.preventDefault();
          status === 'playing' ? onPause() : onPlay();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [status, onStepForward, onStepBackward, onPlay, onPause]);

  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 glass-panel border border-glass-border rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Previous agent */}
      <button
        onClick={onStepBackward}
        disabled={currentIndex <= 0}
        className="p-1.5 rounded-lg hover:bg-glass-border transition-colors text-foreground disabled:opacity-30"
        title="Previous step (←)"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Play / Pause */}
      {status === 'playing' ? (
        <button
          onClick={onPause}
          className="p-1.5 rounded-lg hover:bg-glass-border transition-colors text-foreground"
          title="Pause (Space)"
        >
          <Pause size={16} />
        </button>
      ) : (
        <button
          onClick={onPlay}
          disabled={status === 'done'}
          className="p-1.5 rounded-lg hover:bg-glass-border transition-colors text-foreground disabled:opacity-30"
          title="Play (Space)"
        >
          <Play size={16} />
        </button>
      )}

      {/* Next agent */}
      <button
        onClick={onStepForward}
        disabled={status === 'done'}
        className="p-1.5 rounded-lg hover:bg-glass-border transition-colors text-foreground disabled:opacity-30"
        title="Next step (→)"
      >
        <ChevronRight size={16} />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-glass-border" />

      {/* Restart */}
      <button
        onClick={onRestart}
        className="p-1.5 rounded-lg hover:bg-glass-border transition-colors text-foreground"
        title="Restart"
      >
        <RotateCcw size={14} />
      </button>

      {/* Speed selector */}
      <div className="flex items-center gap-1 ml-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors"
            style={{
              background: speed === s ? 'oklch(0.62 0.19 250 / 20%)' : 'transparent',
              color: speed === s ? 'oklch(0.7 0.19 250)' : 'oklch(0.5 0.02 256)',
              border: speed === s ? '1px solid oklch(0.62 0.19 250 / 40%)' : '1px solid transparent',
            }}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* Seekable progress bar */}
      <div className="flex-1 mx-2">
        <div
          ref={barRef}
          className="relative h-2 rounded-full overflow-hidden cursor-pointer group"
          style={{ background: 'oklch(0.25 0.02 256)' }}
          onClick={handleBarClick}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'oklch(0.62 0.19 250)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
          {/* Hover indicator */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'oklch(0.62 0.19 250 / 10%)' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] font-mono text-muted-foreground">
            {Math.max(0, currentIndex + 1)}/{totalEvents}
          </span>
          {currentAgent && (
            <span className="text-[8px] font-mono text-muted-foreground">
              {currentAgent}
            </span>
          )}
        </div>
      </div>

      {/* Exit */}
      <button
        onClick={onStop}
        className="p-1.5 rounded-lg hover:bg-glass-border transition-colors text-muted-foreground"
        title="Exit replay"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
