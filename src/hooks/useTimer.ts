"use client";

import { useEffect, useRef, useState } from "react";

interface TimerState {
  ms: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: (toMs?: number) => void;
}

export function useCountdown(initialMs: number): TimerState {
  const [ms, setMs] = useState(initialMs);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);
  const lastTick = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    lastTick.current = Date.now();
    ref.current = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTick.current;
      lastTick.current = now;
      setMs((m) => {
        const next = m - dt;
        if (next <= 0) {
          if (ref.current) window.clearInterval(ref.current);
          setRunning(false);
          return 0;
        }
        return next;
      });
    }, 250);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  return {
    ms,
    running,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: (toMs?: number) => {
      setRunning(false);
      setMs(toMs ?? initialMs);
    }
  };
}
