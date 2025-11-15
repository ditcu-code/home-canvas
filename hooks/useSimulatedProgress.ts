/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Simulates determinate progress while a task is active.
 * - Advances quickly at start, slows near 90% while active.
 * - On completion, animates to 100% then resets to 0 after a short delay.
 */
export const useSimulatedProgress = (
  isActive: boolean,
  options?: { holdPercent?: number; tickMs?: number }
): number => {
  const holdPercent = options?.holdPercent ?? 90;
  const tickMs = options?.tickMs ?? 120;
  const [progress, setProgress] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const clear = () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    if (isActive) {
      clear();
      setProgress((p) => (p > 0 && p < holdPercent ? p : 0));
      timerRef.current = window.setInterval(() => {
        setProgress((p) => {
          if (p >= holdPercent) return p;
          // Ease-out increment: larger steps early, smaller later
          const remaining = holdPercent - p;
          const delta = Math.max(0.5, remaining * 0.08);
          return Math.min(holdPercent, p + delta);
        });
      }, tickMs);
      return clear;
    }

    // If not active: push to 100% then reset after a brief delay
    if (!isActive) {
      clear();
      if (progress < 100) {
        // Quick finish to 100%
        const start = performance.now();
        const duration = 350; // ms
        const from = progress;
        const animate = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const next = Math.round(from + (100 - from) * eased);
          setProgress(next);
          if (t < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }
      const id = window.setTimeout(() => setProgress(0), 600);
      return () => window.clearTimeout(id);
    }
  }, [isActive]);

  return progress;
};

