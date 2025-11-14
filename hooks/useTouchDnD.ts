/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import type { RefObject, TouchEvent as ReactTouchEvent } from 'react';
import { computeRelativePositionFromPoint } from '@/services/positioning';

interface Point { x: number; y: number }

interface UseTouchDnDOptions {
  enabled: boolean;
  sceneImgRef: RefObject<HTMLImageElement>;
  onDrop: (position: Point, relative: { xPercent: number; yPercent: number }) => void;
  dropzoneSelector?: string;
}

interface UseTouchDnDResult {
  isTouchDragging: boolean;
  touchGhostPosition: Point | null;
  isHoveringDropZone: boolean;
  touchOrbPosition: Point | null;
  handleTouchStart: (e: ReactTouchEvent) => void;
}

export const useTouchDnD = ({
  enabled,
  sceneImgRef,
  onDrop,
  dropzoneSelector = '[data-dropzone-id="scene-uploader"]',
}: UseTouchDnDOptions): UseTouchDnDResult => {
  const [isTouchDragging, setIsTouchDragging] = useState<boolean>(false);
  const [touchGhostPosition, setTouchGhostPosition] = useState<Point | null>(null);
  const [isHoveringDropZone, setIsHoveringDropZone] = useState<boolean>(false);
  const [touchOrbPosition, setTouchOrbPosition] = useState<Point | null>(null);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    if (!enabled) return;
    e.preventDefault();
    setIsTouchDragging(true);
    const touch = e.touches[0];
    setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });
  }, [enabled]);

  useEffect(() => {
    if (!isTouchDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setTouchGhostPosition({ x: touch.clientX, y: touch.clientY });

      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = el?.closest<HTMLElement>(dropzoneSelector) || null;
      if (dropZone) {
        const rect = dropZone.getBoundingClientRect();
        setTouchOrbPosition({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
        setIsHoveringDropZone(true);
      } else {
        setIsHoveringDropZone(false);
        setTouchOrbPosition(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = el?.closest<HTMLElement>(dropzoneSelector) || null;

      if (dropZone && sceneImgRef.current) {
        const res = computeRelativePositionFromPoint(sceneImgRef.current, dropZone, touch.clientX, touch.clientY);
        if (res) {
          onDrop(res.position, res.relative);
        }
      }

      setIsTouchDragging(false);
      setTouchGhostPosition(null);
      setIsHoveringDropZone(false);
      setTouchOrbPosition(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouchDragging, dropzoneSelector, onDrop, sceneImgRef]);

  return {
    isTouchDragging,
    touchGhostPosition,
    isHoveringDropZone,
    touchOrbPosition,
    handleTouchStart,
  };
};
