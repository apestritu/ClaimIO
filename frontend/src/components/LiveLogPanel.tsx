"use client";

import { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LogEntry } from '@/lib/claim-data';
import { AGENT_COLORS, AGENT_EXPRESSIONS } from '@/lib/claim-data';

interface LiveLogPanelProps {
  logs: LogEntry[];
  stats?: { label: string; value: string }[];
}

// Colors/emojis for demo mode phases (lowercase IDs)
const DEMO_COLORS: Record<string, string> = {
  upload: 'oklch(0.62 0.19 250)',
  ingest: 'oklch(0.7 0.15 195)',
  validate: 'oklch(0.8 0.16 80)',
  collect: 'oklch(0.55 0.2 270)',
  extract: 'oklch(0.7 0.15 195)',
  evaluate: 'oklch(0.55 0.2 270)',
  coverage: 'oklch(0.8 0.16 80)',
  compliance: 'oklch(0.65 0.2 15)',
  decision: 'oklch(0.62 0.19 250)',
  payment: 'oklch(0.7 0.17 160)',
  notify: 'oklch(0.7 0.15 195)',
};

const DEMO_EMOJIS: Record<string, string> = {
  upload: '📦',
  ingest: '🔍',
  validate: '🤔',
  collect: '📂',
  extract: '🧠',
  evaluate: '📊',
  coverage: '🛡️',
  compliance: '⚖️',
  decision: '🔨',
  payment: '💳',
  notify: '🔔',
};

function getAgentColor(agent: string): string {
  return AGENT_COLORS[agent] || DEMO_COLORS[agent] || 'oklch(0.5 0.02 256)';
}

function getAgentEmoji(agent: string): string {
  return AGENT_EXPRESSIONS[agent] || DEMO_EMOJIS[agent] || '📋';
}

function agentLabel(agent: string): string {
  return agent
    .replace(/Agent$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());
}

export function LiveLogPanel({ logs, stats }: LiveLogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const agentSections = useMemo(() => {
    const sections: { agent: string; logs: LogEntry[] }[] = [];
    let currentAgent = '';
    for (const log of logs) {
      const a = log.agent || '';
      if (a !== currentAgent || sections.length === 0) {
        currentAgent = a;
        sections.push({ agent: a, logs: [log] });
      } else {
        sections[sections.length - 1].logs.push(log);
      }
    }
    return sections;
  }, [logs]);

  return (
    <div className="h-full flex flex-col glass-panel rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-glass-border">
        <h3 className="text-sm font-semibold tracking-wide text-foreground">Live Activity</h3>
      </div>

      {stats && stats.length > 0 && (
        <div className="px-4 py-3 grid grid-cols-2 gap-2 border-b border-glass-border">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-sm font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        <AnimatePresence initial={false}>
          {agentSections.map((section, si) => {
            const color = getAgentColor(section.agent);
            const emoji = getAgentEmoji(section.agent);
            return (
              <div key={`section-${si}`}>
                {/* Agent header */}
                {section.agent && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2 mt-3 mb-1.5 first:mt-0"
                  >
                    <span className="text-xs">{emoji}</span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color }}
                    >
                      {agentLabel(section.agent)}
                    </span>
                    <div className="flex-1 h-px" style={{ background: `${color}30` }} />
                  </motion.div>
                )}

                {/* Logs under this agent */}
                {section.logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-2 py-1"
                  >
                    <span className="text-sm shrink-0">{log.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-mono leading-relaxed break-words">
                        {log.text}
                      </p>
                    </div>
                    <span className="text-[9px] text-muted-foreground/50 font-mono shrink-0">{log.timestamp}</span>
                  </motion.div>
                ))}
              </div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
