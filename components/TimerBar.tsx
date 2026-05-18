"use client";
import { useEffect, useRef, useState } from 'react';

interface TimerBarProps {
  duration: number;
  onComplete?: () => void;
}

export default function TimerBar({ duration, onComplete }: TimerBarProps) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [remainingPct, setRemainingPct] = useState(100);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setSecondsLeft(duration);
    setRemainingPct(100);

    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const nextRemaining = Math.max(0, duration - elapsed);
      setSecondsLeft(Math.ceil(nextRemaining));
      setRemainingPct(Math.max(0, Math.min(100, (nextRemaining / duration) * 100)));

      if (nextRemaining <= 0) {
        window.clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [duration]);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          alignItems: 'center',
          color: '#172033',
          display: 'flex',
          fontSize: 13,
          fontWeight: 900,
          justifyContent: 'space-between',
          marginBottom: 10,
          textTransform: 'uppercase',
        }}
      >
        <span>Tiempo restante</span>
        <span
          style={{
            background: '#ff1f4f',
            borderRadius: 999,
            boxShadow: '0 6px 14px rgba(255,31,79,0.35)',
            color: '#fffaf0',
            padding: '4px 12px',
          }}
        >
          {secondsLeft}s
        </span>
      </div>

      <div
        aria-label="Progreso del tiempo"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(remainingPct)}
        style={{
          background: '#210711',
          border: '2px solid #172033',
          borderRadius: 999,
          boxShadow: 'inset 0 0 0 3px rgba(255,250,240,0.13), 0 10px 22px rgba(7,8,18,0.34)',
          height: 36,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(90deg, #ffd447 0%, #ff6b87 42%, #ff1f4f 100%)',
            bottom: 0,
            boxShadow: '0 0 24px rgba(255,31,79,0.95)',
            left: 0,
            minWidth: remainingPct > 0 ? 12 : 0,
            position: 'absolute',
            top: 0,
            transition: 'width 50ms linear',
            width: `${remainingPct}%`,
          }}
        />
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.38), transparent 55%)',
            inset: 0,
            pointerEvents: 'none',
            position: 'absolute',
          }}
        />
      </div>
    </div>
  );
}
