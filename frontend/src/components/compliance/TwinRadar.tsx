"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLAIMANT_NAME, RECEIPT_AMOUNTS, COMPLIANCE_RESULT } from './compliance-data';

interface TwinRadarProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

type RadarPhase = 'idle' | 'sweeping' | 'result';

export function TwinRadar({ onComplete, autoPlay = true }: TwinRadarProps) {
  const [sanctionPhase, setSanctionPhase] = useState<RadarPhase>('idle');
  const [fraudPhase, setFraudPhase] = useState<RadarPhase>('idle');
  const [sanctionAngle, setSanctionAngle] = useState(0);
  const [fraudAngle, setFraudAngle] = useState(0);
  const [sanctionBlips, setSanctionBlips] = useState<{ x: number; y: number; fade: number }[]>([]);
  const [fraudBlips, setFraudBlips] = useState<boolean[]>(RECEIPT_AMOUNTS.map(() => false));
  const [showMerged, setShowMerged] = useState(false);
  const startedRef = useRef(false);
  const sanctionSweepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fraudSweepRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startedRef.current || !autoPlay) return;
    startedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // LEFT RADAR: Sanctions sweep
    timers.push(setTimeout(() => {
      setSanctionPhase('sweeping');

      sanctionSweepRef.current = setInterval(() => {
        setSanctionAngle(prev => (prev + 3) % 360);

        // Random ghost blips that appear and fade
        if (Math.random() < 0.15) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 30 + Math.random() * 50;
          setSanctionBlips(prev => [
            ...prev.slice(-8),
            { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, fade: 1 },
          ]);
        }

        // Fade existing blips
        setSanctionBlips(prev =>
          prev.map(b => ({ ...b, fade: b.fade - 0.02 })).filter(b => b.fade > 0)
        );
      }, 30);
    }, 400));

    // Sanctions result
    timers.push(setTimeout(() => {
      if (sanctionSweepRef.current) clearInterval(sanctionSweepRef.current);
      setSanctionPhase('result');
      setSanctionBlips([]);
    }, 3800));

    // RIGHT RADAR: Fraud sweep
    timers.push(setTimeout(() => {
      setFraudPhase('sweeping');

      fraudSweepRef.current = setInterval(() => {
        setFraudAngle(prev => (prev + 3) % 360);
      }, 30);
    }, 800));

    // Reveal receipt blips one by one
    RECEIPT_AMOUNTS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setFraudBlips(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 1500 + i * 600));
    });

    // Fraud result
    timers.push(setTimeout(() => {
      if (fraudSweepRef.current) clearInterval(fraudSweepRef.current);
      setFraudPhase('result');
    }, 4200));

    // Merged display
    timers.push(setTimeout(() => setShowMerged(true), 5000));
    timers.push(setTimeout(() => onComplete?.(), 7000));

    return () => {
      timers.forEach(clearTimeout);
      if (sanctionSweepRef.current) clearInterval(sanctionSweepRef.current);
      if (fraudSweepRef.current) clearInterval(fraudSweepRef.current);
    };
  }, [autoPlay, onComplete]);

  // Receipt blip positions (spread by amount value to different distances)
  const receiptPositions = RECEIPT_AMOUNTS.map((amt, i) => {
    const val = parseFloat(amt.replace('$', ''));
    const angle = (i / RECEIPT_AMOUNTS.length) * Math.PI * 2 - Math.PI / 4;
    const dist = 20 + (val / 250) * 55;
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, amt };
  });

  const radarSize = 200;
  const center = radarSize / 2;

  const RadarDisplay = ({
    title,
    emoji,
    phase: rPhase,
    sweepAngle,
    sweepColor,
    resultColor,
    children,
  }: {
    title: string;
    emoji: string;
    phase: RadarPhase;
    sweepAngle: number;
    sweepColor: string;
    resultColor: string;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col items-center gap-3">
      <div className="text-[8px] font-mono uppercase tracking-wider" style={{ color: 'oklch(0.5 0.06 250 / 70%)' }}>
        {emoji} {title}
      </div>
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: radarSize,
          height: radarSize,
          background: 'oklch(0.08 0.02 160)',
          border: `2px solid ${rPhase === 'result' ? `${resultColor}50` : 'oklch(0.2 0.04 160 / 40%)'}`,
          boxShadow: rPhase === 'result'
            ? `0 0 30px ${resultColor}20`
            : '0 0 20px oklch(0 0 0 / 30%)',
        }}
      >
        {/* Radar grid rings */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
          {[25, 50, 75].map(r => (
            <circle key={r} cx={center} cy={center} r={r * (radarSize / 200)} fill="none" stroke="oklch(0.5 0.1 160)" strokeWidth={0.5} />
          ))}
          <line x1={center} y1={0} x2={center} y2={radarSize} stroke="oklch(0.5 0.1 160)" strokeWidth={0.5} />
          <line x1={0} y1={center} x2={radarSize} y2={center} stroke="oklch(0.5 0.1 160)" strokeWidth={0.5} />
        </svg>

        {/* Sweep line */}
        {rPhase === 'sweeping' && (
          <div
            className="absolute"
            style={{
              left: center,
              top: center,
              width: center - 2,
              height: 2,
              transformOrigin: '0 50%',
              transform: `rotate(${sweepAngle}deg)`,
              background: `linear-gradient(90deg, ${sweepColor}, transparent)`,
              boxShadow: `0 0 8px ${sweepColor}`,
            }}
          />
        )}

        {/* Sweep trail */}
        {rPhase === 'sweeping' && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: radarSize,
              height: radarSize,
              background: `conic-gradient(from ${sweepAngle - 30}deg at 50% 50%, transparent 0deg, ${sweepColor}15 20deg, transparent 30deg)`,
            }}
          />
        )}

        {children}

        {/* Center dot */}
        <div
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: center - 4,
            top: center - 4,
            background: rPhase === 'result' ? resultColor : sweepColor,
            boxShadow: `0 0 6px ${rPhase === 'result' ? resultColor : sweepColor}`,
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden gap-6">
      {/* Title */}
      <motion.div
        className="text-[10px] font-mono uppercase tracking-[0.2em]"
        style={{ color: 'oklch(0.6 0.1 250)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        📡 Twin Radar — Compliance Sweep
      </motion.div>

      <div className="flex gap-10 items-start">
        {/* LEFT RADAR: Sanctions */}
        <RadarDisplay
          title="Sanctions Radar"
          emoji="🛂"
          phase={sanctionPhase}
          sweepAngle={sanctionAngle}
          sweepColor="oklch(0.7 0.17 160)"
          resultColor={COMPLIANCE_RESULT.sanctionsClear ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)'}
        >
          {/* Center blip — claimant */}
          <motion.div
            className="absolute flex flex-col items-center"
            style={{ left: center - 20, top: center - 14 }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                background: sanctionPhase === 'result'
                  ? (COMPLIANCE_RESULT.sanctionsClear ? 'oklch(0.7 0.17 160 / 30%)' : 'oklch(0.65 0.2 15 / 30%)')
                  : 'oklch(0.5 0.1 160 / 20%)',
                border: `1px solid ${sanctionPhase === 'result'
                  ? (COMPLIANCE_RESULT.sanctionsClear ? 'oklch(0.7 0.17 160 / 60%)' : 'oklch(0.65 0.2 15 / 60%)')
                  : 'oklch(0.5 0.1 160 / 40%)'}`,
              }}
            >
              <span className="text-[6px]">👤</span>
            </div>
            <span className="text-[5px] font-mono mt-0.5" style={{ color: 'oklch(0.6 0.1 160)' }}>
              {CLAIMANT_NAME}
            </span>
          </motion.div>

          {/* Ghost blips (fading noise) */}
          {sanctionBlips.map((blip, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: center + blip.x - 3,
                top: center + blip.y - 3,
                background: 'oklch(0.7 0.17 160)',
                opacity: blip.fade * 0.4,
                boxShadow: '0 0 4px oklch(0.7 0.17 160)',
              }}
            />
          ))}

          {/* Result label */}
          {sanctionPhase === 'result' && (
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[7px] font-mono font-bold"
              style={{
                background: COMPLIANCE_RESULT.sanctionsClear ? 'oklch(0.7 0.17 160 / 20%)' : 'oklch(0.65 0.2 15 / 20%)',
                color: COMPLIANCE_RESULT.sanctionsClear ? 'oklch(0.7 0.17 160)' : 'oklch(0.65 0.2 15)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {COMPLIANCE_RESULT.sanctionsClear ? '✅ No match' : '🚨 Match found'}
            </motion.div>
          )}
        </RadarDisplay>

        {/* RIGHT RADAR: Fraud */}
        <RadarDisplay
          title="Fraud Radar"
          emoji="💰"
          phase={fraudPhase}
          sweepAngle={fraudAngle}
          sweepColor="oklch(0.7 0.15 195)"
          resultColor={COMPLIANCE_RESULT.hasDuplicates ? 'oklch(0.65 0.2 15)' : 'oklch(0.7 0.17 160)'}
        >
          {/* Receipt amount blips */}
          {receiptPositions.map((pos, i) => (
            <AnimatePresence key={i}>
              {fraudBlips[i] && (
                <motion.div
                  className="absolute flex flex-col items-center"
                  style={{ left: center + pos.x - 12, top: center + pos.y - 8 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: fraudPhase === 'result'
                        ? 'oklch(0.7 0.17 160 / 40%)'
                        : 'oklch(0.7 0.15 195 / 40%)',
                      border: `1px solid ${fraudPhase === 'result'
                        ? 'oklch(0.7 0.17 160 / 60%)'
                        : 'oklch(0.7 0.15 195 / 60%)'}`,
                      boxShadow: `0 0 6px ${fraudPhase === 'result' ? 'oklch(0.7 0.17 160 / 30%)' : 'oklch(0.7 0.15 195 / 30%)'}`,
                    }}
                  />
                  <span className="text-[5px] font-mono mt-0.5" style={{ color: 'oklch(0.6 0.1 195)' }}>
                    {pos.amt}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}

          {/* Result label */}
          {fraudPhase === 'result' && (
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[7px] font-mono font-bold"
              style={{
                background: COMPLIANCE_RESULT.hasDuplicates ? 'oklch(0.65 0.2 15 / 20%)' : 'oklch(0.7 0.17 160 / 20%)',
                color: COMPLIANCE_RESULT.hasDuplicates ? 'oklch(0.65 0.2 15)' : 'oklch(0.7 0.17 160)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {COMPLIANCE_RESULT.hasDuplicates ? '🚨 Duplicates' : '✅ All unique'}
            </motion.div>
          )}
        </RadarDisplay>
      </div>

      {/* Merged result */}
      <AnimatePresence>
        {showMerged && (
          <motion.div
            className="flex items-center gap-5 px-6 py-3 rounded-xl"
            style={{
              background: 'oklch(0.14 0.02 256 / 90%)',
              border: '1px solid oklch(0.7 0.17 160 / 30%)',
              boxShadow: '0 0 30px oklch(0.7 0.17 160 / 12%)',
            }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'oklch(0.7 0.17 160 / 15%)',
                border: '2px solid oklch(0.7 0.17 160 / 40%)',
                boxShadow: '0 0 15px oklch(0.7 0.17 160 / 20%)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-lg">📡</span>
            </motion.div>
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-bold" style={{ color: 'oklch(0.7 0.17 160)' }}>RADAR SWEEP: ALL CLEAR</div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-mono text-muted-foreground">
                  Sanctions: <span style={{ color: 'oklch(0.7 0.17 160)' }}>CLEAR ({COMPLIANCE_RESULT.sanctionsConf})</span>
                </span>
                <div className="w-px h-3" style={{ background: 'oklch(0.3 0.03 256)' }} />
                <span className="text-[8px] font-mono text-muted-foreground">
                  Fraud: <span style={{ color: 'oklch(0.7 0.17 160)' }}>{COMPLIANCE_RESULT.fraudLabel} ({COMPLIANCE_RESULT.fraudRisk})</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="absolute bottom-4 left-4 text-[9px] font-mono text-muted-foreground/40">
        Option E — Twin Radar Sweep
      </div>
    </div>
  );
}
