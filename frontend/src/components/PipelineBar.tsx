"use client";

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PIPELINE_STEPS, type PipelineStep } from '@/lib/claim-data';

interface PipelineBarProps {
  activeStep: number;
  completedSteps: number[];
  steps?: PipelineStep[];
  onStepClick?: (stepIndex: number) => void;
}

export function PipelineBar({ activeStep, completedSteps, steps, onStepClick }: PipelineBarProps) {
  const pipelineSteps = steps || PIPELINE_STEPS;
  return (
    <div className="glass-panel sticky top-0 z-50 px-6 py-4">
      <div className="flex items-center max-w-6xl mx-auto">
        {pipelineSteps.map((step, i) => {
          const isCompleted = completedSteps.includes(i);
          const isActive = activeStep === i;
          const isUpcoming = !isCompleted && !isActive;

          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <div key={step.id} className="flex items-center" style={{ flex: i < pipelineSteps.length - 1 ? '1 1 0%' : '0 0 auto' }}>
              <div
                className={`flex flex-col items-center gap-1.5 shrink-0 ${isClickable ? 'cursor-pointer' : ''}`}
                onClick={() => isClickable && onStepClick(i)}
              >
                <motion.div
                  className="relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors"
                  whileHover={isClickable ? { scale: 1.2 } : {}}
                  style={{
                    borderColor: isUpcoming ? 'oklch(0.4 0.02 256)' : step.color,
                    background: isCompleted || isActive ? step.color : 'transparent',
                    borderStyle: isUpcoming ? 'dashed' : 'solid',
                  }}
                  animate={isActive ? {
                    scale: [1, 1.15, 1],
                    boxShadow: [
                      `0 0 0px ${step.color}`,
                      `0 0 20px ${step.color}`,
                      `0 0 0px ${step.color}`,
                    ],
                  } : {}}
                  transition={isActive ? { duration: 2, repeat: Infinity } : {}}
                >
                  {isCompleted ? (
                    <Check size={16} className="text-background" strokeWidth={3} />
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{ color: isActive ? 'oklch(0.145 0.03 256)' : 'oklch(0.5 0.02 256)' }}
                    >
                      {i + 1}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2px solid ${step.color}` }}
                      animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{ color: isUpcoming ? 'oklch(0.5 0.02 256)' : step.color }}
                >
                  {step.label}
                </span>
              </div>

              {i < pipelineSteps.length - 1 && (
                <div className="relative flex-1 h-0.5 mt-[-18px]">
                  <div className="absolute inset-0 rounded-full" style={{ background: 'oklch(0.3 0.02 256)' }} />
                  <motion.div
                    className="absolute inset-0 rounded-full origin-left"
                    style={{
                      background: `linear-gradient(90deg, ${step.color}, ${pipelineSteps[i + 1]?.color || step.color})`,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
