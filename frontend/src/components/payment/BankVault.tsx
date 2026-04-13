"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PAYMENT_AMOUNT, ACCOUNT_DISPLAY } from './payment-data';

interface BankVaultProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type Stage = 'idle' | 'vaultOpen' | 'requesting' | 'routeDraw' | 'driving' | 'checkpoint1' | 'checkpoint2' | 'checkpoint3' | 'delivered' | 'done';

const CHECKPOINTS = [
  { x: 25, label: 'Verify' },
  { x: 50, label: 'Process' },
  { x: 75, label: 'Clear' },
];

export function BankVault({ onComplete, autoPlay = true }: BankVaultProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [vaultDoorOpen, setVaultDoorOpen] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const [truckPos, setTruckPos] = useState(0);
  const [passedCheckpoints, setPassedCheckpoints] = useState<number[]>([]);
  const [showDelivery, setShowDelivery] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Vault opens
    timers.push(setTimeout(() => {
      setStage('vaultOpen');
      setVaultDoorOpen(true);
    }, 500));

    // Request envelope
    timers.push(setTimeout(() => {
      setStage('requesting');
      setShowEnvelope(true);
    }, 1800));

    // Address filled in
    timers.push(setTimeout(() => {
      setShowEnvelope(false);
      setShowAddress(true);
    }, 3200));

    // Route draws itself
    timers.push(setTimeout(() => {
      setStage('routeDraw');
      const routeInterval = setInterval(() => {
        setRouteProgress(prev => {
          if (prev >= 100) { clearInterval(routeInterval); return 100; }
          return prev + 5;
        });
      }, 30);
      timers.push(setTimeout(() => clearInterval(routeInterval), 800) as unknown as ReturnType<typeof setTimeout>);
    }, 4000));

    // Truck starts driving
    timers.push(setTimeout(() => {
      setStage('driving');
      const driveInterval = setInterval(() => {
        setTruckPos(prev => {
          if (prev >= 100) { clearInterval(driveInterval); return 100; }
          return prev + 0.8;
        });
      }, 40);

      // Pass checkpoints
      timers.push(setTimeout(() => { setPassedCheckpoints(p => [...p, 0]); setStage('checkpoint1'); }, 5600));
      timers.push(setTimeout(() => { setPassedCheckpoints(p => [...p, 1]); setStage('checkpoint2'); }, 7000));
      timers.push(setTimeout(() => { setPassedCheckpoints(p => [...p, 2]); setStage('checkpoint3'); }, 8400));

      timers.push(setTimeout(() => {
        clearInterval(driveInterval);
        setTruckPos(100);
      }, 9500) as unknown as ReturnType<typeof setTimeout>);
    }, 5000));

    // Delivered
    timers.push(setTimeout(() => {
      setStage('delivered');
      setShowDelivery(true);
    }, 9800));

    timers.push(setTimeout(() => {
      setStage('done');
      onComplete?.();
    }, 12000));

    return () => timers.forEach(clearTimeout);
  }, [autoPlay, onComplete]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden gap-4">
      {/* Title */}
      <div className="z-20">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: 'oklch(0.6 0.1 250)' }}>
          🏦 Bank Vault — Secure Transfer
        </span>
      </div>

      {/* Main scene */}
      <div className="relative" style={{ width: 650, height: 340 }}>
        {/* ── LEFT: Vault ── */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ width: 130 }}>
          <div
            className="relative w-24 h-28 rounded-xl overflow-hidden"
            style={{
              background: 'oklch(0.16 0.025 256)',
              border: '2px solid oklch(0.35 0.06 250 / 50%)',
              boxShadow: '0 4px 20px oklch(0 0 0 / 40%)',
            }}
          >
            {/* Vault door */}
            <motion.div
              className="absolute inset-0 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, oklch(0.25 0.04 250), oklch(0.2 0.03 256))',
                transformOrigin: 'left center',
                zIndex: 5,
              }}
              animate={vaultDoorOpen ? { rotateY: -70, opacity: 0.4 } : {}}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              {/* Combination dial */}
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'oklch(0.3 0.05 250)',
                  border: '2px solid oklch(0.45 0.06 250)',
                }}
                animate={!vaultDoorOpen ? { rotate: [0, 180, 360] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <div className="w-0.5 h-3 rounded" style={{ background: 'oklch(0.6 0.08 250)' }} />
              </motion.div>
            </motion.div>

            {/* Inside vault — gold */}
            {vaultDoorOpen && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                style={{ background: 'linear-gradient(180deg, oklch(0.2 0.04 80 / 30%), oklch(0.14 0.02 256))' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-xl">💰</span>
                <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.8 0.16 80)' }}>{PAYMENT_AMOUNT}</span>
              </motion.div>
            )}
          </div>
          <span className="text-[7px] font-mono text-muted-foreground mt-1.5">Insurance Vault</span>
        </div>

        {/* ── ROUTE / ROAD ── */}
        <div className="absolute left-[130px] right-[130px] top-1/2 -translate-y-1/2" style={{ height: 100 }}>
          {/* Road surface */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ height: 20, background: 'oklch(0.15 0.02 256)', borderRadius: 10 }}>
            {/* Route dashes */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-px border-t-2 border-dashed"
              style={{
                borderColor: routeProgress > 0 ? 'oklch(0.5 0.08 250 / 40%)' : 'oklch(0.25 0.03 256)',
                width: `${routeProgress}%`,
              }}
            />
          </div>

          {/* Checkpoints */}
          {CHECKPOINTS.map((cp, i) => {
            const passed = passedCheckpoints.includes(i);
            return (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${cp.x}%`, transform: 'translate(-50%, -50%)' }}
              >
                <motion.div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: passed ? 'oklch(0.7 0.17 160 / 25%)' : 'oklch(0.2 0.03 256)',
                    border: `2px solid ${passed ? 'oklch(0.7 0.17 160 / 60%)' : 'oklch(0.3 0.04 256)'}`,
                    boxShadow: passed ? '0 0 10px oklch(0.7 0.17 160 / 20%)' : 'none',
                  }}
                  animate={passed ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-[6px] font-bold" style={{ color: passed ? 'oklch(0.7 0.17 160)' : 'oklch(0.4 0.03 256)' }}>
                    {passed ? '✓' : (i + 1)}
                  </span>
                </motion.div>
                <span className="text-[6px] font-mono mt-1" style={{ color: passed ? 'oklch(0.7 0.17 160)' : 'oklch(0.4 0.03 256)' }}>
                  {cp.label}
                </span>
              </div>
            );
          })}

          {/* Armored truck */}
          {truckPos > 0 && (
            <motion.div
              className="absolute top-1/2 flex flex-col items-center"
              style={{
                left: `${Math.min(truckPos, 97)}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}
            >
              <motion.div
                className="text-xl"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                🚐
              </motion.div>
              <span className="text-[6px] font-mono font-bold" style={{ color: 'oklch(0.8 0.16 80)' }}>{PAYMENT_AMOUNT}</span>
            </motion.div>
          )}

          {/* Envelope animation */}
          <AnimatePresence>
            {showEnvelope && (
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 text-lg"
                initial={{ left: '10%', opacity: 1 }}
                animate={{ left: '80%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                ✉️
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Destination ── */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ width: 130 }}>
          <motion.div
            className="w-24 h-28 rounded-xl flex flex-col items-center justify-center gap-1"
            style={{
              background: 'oklch(0.14 0.025 256)',
              border: `2px solid ${showDelivery ? 'oklch(0.7 0.17 160 / 50%)' : showAddress ? 'oklch(0.55 0.15 250 / 40%)' : 'oklch(0.25 0.03 256)'}`,
              boxShadow: showDelivery
                ? '0 0 25px oklch(0.7 0.17 160 / 15%)'
                : '0 4px 20px oklch(0 0 0 / 30%)',
            }}
          >
            <span className="text-2xl">{showDelivery ? '✅' : '👤'}</span>

            {showAddress ? (
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-[7px] font-mono text-muted-foreground">Destination</div>
                <div className="text-[7px] font-mono font-bold" style={{ color: 'oklch(0.6 0.1 195)' }}>🏦 ACH {ACCOUNT_DISPLAY}</div>
              </motion.div>
            ) : (
              <div className="text-center">
                <div className="text-[7px] font-mono text-muted-foreground">Destination</div>
                <motion.div
                  className="text-[9px] font-mono font-bold"
                  style={{ color: 'oklch(0.8 0.16 80)' }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ???
                </motion.div>
              </div>
            )}
          </motion.div>
          <span className="text-[7px] font-mono text-muted-foreground mt-1.5">Claimant Account</span>

          {/* Golden glow on delivery */}
          {showDelivery && (
            <motion.div
              className="mt-2 px-3 py-1 rounded-full"
              style={{
                background: 'oklch(0.8 0.16 80 / 12%)',
                border: '1px solid oklch(0.8 0.16 80 / 30%)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <span className="text-[8px] font-mono font-bold" style={{ color: 'oklch(0.8 0.16 80)' }}>
                💰 {PAYMENT_AMOUNT} Delivered
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Final stamp */}
      <AnimatePresence>
        {stage === 'done' && (
          <motion.div
            className="flex items-center gap-3 px-6 py-3 rounded-xl"
            style={{
              background: 'oklch(0.14 0.02 256 / 90%)',
              border: '1px solid oklch(0.7 0.17 160 / 30%)',
              boxShadow: '0 0 30px oklch(0.7 0.17 160 / 12%)',
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.span className="text-xl" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.2 }}>🏦</motion.span>
            <div>
              <div className="text-[10px] font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>DELIVERY COMPLETE</div>
              <div className="text-[8px] font-mono text-muted-foreground">{PAYMENT_AMOUNT} → ACH {ACCOUNT_DISPLAY}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option D — Bank Vault Transfer
      </div>
    </div>
  );
}
