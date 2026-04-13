"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PAYMENT_METHOD, ACCOUNT_DISPLAY, BOT_REQUEST_MSG, CLAIMANT_REPLY_MSG, BOT_CONFIRM_MSG } from './requestpay-data';

interface ChatConversationProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

interface ChatMsg {
  id: number;
  side: 'left' | 'right';
  text: string;
  icon: string;
}

type Stage = 'idle' | 'typing-bot' | 'bot-sent' | 'typing-user' | 'user-sent' | 'typing-confirm' | 'confirm-sent' | 'minimize' | 'done';

export function ChatConversation({ onComplete, autoPlay = true }: ChatConversationProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typingDots, setTypingDots] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const dotInterval = setInterval(() => setTypingDots(d => (d + 1) % 4), 400);

    timers.push(setTimeout(() => setStage('typing-bot'), 400));

    timers.push(setTimeout(() => {
      setStage('bot-sent');
      setMessages(prev => [...prev, { id: 1, side: 'left', text: BOT_REQUEST_MSG, icon: '🤖' }]);
    }, 2200));

    timers.push(setTimeout(() => setStage('typing-user'), 3200));

    timers.push(setTimeout(() => {
      setStage('user-sent');
      setMessages(prev => [...prev, { id: 2, side: 'right', text: CLAIMANT_REPLY_MSG, icon: '👤' }]);
    }, 4800));

    timers.push(setTimeout(() => setStage('typing-confirm'), 5800));

    timers.push(setTimeout(() => {
      setStage('confirm-sent');
      setMessages(prev => [...prev, { id: 3, side: 'left', text: BOT_CONFIRM_MSG, icon: '✅' }]);
    }, 7200));

    timers.push(setTimeout(() => setStage('minimize'), 8500));
    timers.push(setTimeout(() => setStage('done'), 9500));
    timers.push(setTimeout(() => onComplete?.(), 11000));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(dotInterval);
    };
  }, [autoPlay, onComplete]);

  const isTyping = stage === 'typing-bot' || stage === 'typing-user' || stage === 'typing-confirm';
  const typingSide = stage === 'typing-bot' || stage === 'typing-confirm' ? 'left' : 'right';

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          💬 Chat Conversation — Request Payment Info
        </span>
      </div>

      <AnimatePresence mode="wait">
        {stage !== 'done' ? (
          <motion.div
            key="chat"
            className="relative rounded-2xl overflow-hidden"
            style={{
              width: 380,
              height: 380,
              background: 'oklch(0.12 0.02 256)',
              border: '2px solid oklch(0.3 0.05 250 / 40%)',
              boxShadow: '0 8px 40px oklch(0 0 0 / 40%)',
            }}
            animate={stage === 'minimize' ? { scale: 0.3, opacity: 0, borderRadius: '50%' } : {}}
            transition={{ duration: 0.6 }}
          >
            {/* Chat header */}
            <div className="px-4 py-2.5 flex items-center gap-2" style={{
              background: 'oklch(0.16 0.03 250)',
              borderBottom: '1px solid oklch(0.25 0.04 250)',
            }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
                background: 'oklch(0.55 0.15 250 / 20%)',
                border: '1px solid oklch(0.55 0.15 250 / 30%)',
              }}>
                <span className="text-[10px]">🤖</span>
              </div>
              <div>
                <div className="text-[9px] font-mono font-bold text-foreground">ClaimFlow Assistant</div>
                <div className="text-[7px] font-mono" style={{ color: 'oklch(0.7 0.17 160)' }}>● Online</div>
              </div>
            </div>

            {/* Messages area */}
            <div className="px-3 py-3 flex flex-col gap-2.5 overflow-hidden" style={{ height: 300 }}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.side === 'right' ? 'flex-row-reverse' : ''}`}
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <span className="text-xs shrink-0">{msg.icon}</span>
                  <div
                    className="px-3 py-2 rounded-xl max-w-[260px]"
                    style={{
                      background: msg.side === 'left'
                        ? 'oklch(0.18 0.03 250)'
                        : 'oklch(0.55 0.15 250 / 15%)',
                      border: `1px solid ${msg.side === 'left' ? 'oklch(0.28 0.04 250)' : 'oklch(0.55 0.15 250 / 30%)'}`,
                      borderBottomLeftRadius: msg.side === 'left' ? 4 : undefined,
                      borderBottomRightRadius: msg.side === 'right' ? 4 : undefined,
                    }}
                  >
                    <span className="text-[9px] font-mono leading-relaxed" style={{
                      color: msg.id === 3 ? 'oklch(0.7 0.17 160)' : 'oklch(0.75 0.04 256)',
                    }}>
                      {msg.text}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  className={`flex items-end gap-2 ${typingSide === 'right' ? 'flex-row-reverse' : ''}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-xs">{typingSide === 'left' ? '🤖' : '👤'}</span>
                  <div className="px-3 py-2 rounded-xl" style={{
                    background: 'oklch(0.18 0.03 250)',
                    border: '1px solid oklch(0.28 0.04 250)',
                  }}>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: 'oklch(0.5 0.06 250)' }}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input bar */}
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{
              background: 'oklch(0.14 0.025 256)',
              borderTop: '1px solid oklch(0.25 0.04 250)',
            }}>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-7 rounded-full px-3 flex items-center" style={{
                  background: 'oklch(0.18 0.03 250)',
                  border: '1px solid oklch(0.28 0.04 250)',
                }}>
                  <span className="text-[7px] font-mono text-muted-foreground">Type a message...</span>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{
                  background: 'oklch(0.55 0.15 250 / 20%)',
                }}>
                  <span className="text-[9px]">➤</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Minimized → Payment details card */
          <motion.div
            key="card"
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.div
              className="px-6 py-4 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, oklch(0.22 0.04 195), oklch(0.18 0.03 250))',
                border: '1px solid oklch(0.7 0.15 195 / 30%)',
                boxShadow: '0 4px 20px oklch(0 0 0 / 30%)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🏦</span>
                <div>
                  <div className="text-[9px] font-mono font-bold text-foreground">{PAYMENT_METHOD}</div>
                  <div className="text-[8px] font-mono text-muted-foreground">{ACCOUNT_DISPLAY}</div>
                </div>
                <span className="text-lg ml-2">✅</span>
              </div>
            </motion.div>
            <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>
              Ready for Payment Agent
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option B — Chat Conversation
      </div>
    </div>
  );
}
