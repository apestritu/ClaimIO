"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { AGENT_EXPRESSIONS } from '@/lib/claim-data';

interface AgentAvatarProps {
  phase: string;
  message: string;
  glowColor: string;
}

export function AgentAvatar({ phase, message, glowColor }: AgentAvatarProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex items-start gap-3">
      <motion.div
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl glass-panel"
        style={{ boxShadow: `0 0 20px ${glowColor}40` }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {AGENT_EXPRESSIONS[phase] || '🤖'}
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          className="glass-panel rounded-xl rounded-tl-sm px-3 py-2 max-w-[240px]"
          initial={{ opacity: 0, x: -10, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs text-muted-foreground">{message}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
