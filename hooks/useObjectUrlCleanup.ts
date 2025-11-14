/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

export const useObjectUrlCleanup = (url: string | null): void => {
  useEffect(() => {
    return () => {
      if (url && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // noop
        }
      }
    };
  }, [url]);
};

