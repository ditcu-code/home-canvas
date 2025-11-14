/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

export const useRotatingMessages = (
  isActive: boolean,
  messages: string[],
  intervalMs: number = 3000
): number => {
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    if (!isActive || messages.length === 0) return;
    setIndex(0);
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [isActive, messages, intervalMs]);

  return index;
};

