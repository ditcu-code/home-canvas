/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { MutableRefObject } from 'react';
import { Product } from '@/types';
import Button from '@/components/Button';
import ObjectCard from '@/components/ObjectCard';
import ImageUploader from '@/components/ImageUploader';
import ControlsBar from '@/components/ControlsBar';
import { transparentDragImage } from '@/constants/drag';

interface WorkspaceViewProps {
  selectedProduct: Product;
  onChangeProduct: () => void;
  onTouchStart: (e: React.TouchEvent) => void;

  sceneImgRef: React.RefObject<HTMLImageElement>;
  sceneImageUrl: string;
  isLoading: boolean;
  onSceneFileSelect: (file: File) => void;
  onProductDrop: (
    position: { x: number; y: number },
    relative: { xPercent: number; yPercent: number }
  ) => void;
  persistedOrbPosition: { x: number; y: number } | null;
  showGenerateButton: boolean;
  onGenerateClick: () => void;
  showRetryButton: boolean;
  onRetryClick: () => void;
  showDebugButton: boolean;
  onDebugClick: () => void;
  showDownloadButton: boolean;
  downloadUrl: string | null;
  isTouchHovering: boolean;
  touchOrbPosition: { x: number; y: number } | null;
  openSceneDialogRef: MutableRefObject<(() => void) | null>;

  // Controls
  canAdjust: boolean;
  onAdjustScale: (delta: number) => void;
  canChangeScene: boolean;
  onChangeScene: () => void;
  canReset: boolean;
  onReset: () => void;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  selectedProduct,
  onChangeProduct,
  onTouchStart,
  sceneImgRef,
  sceneImageUrl,
  isLoading,
  onSceneFileSelect,
  onProductDrop,
  persistedOrbPosition,
  showGenerateButton,
  onGenerateClick,
  showRetryButton,
  onRetryClick,
  showDebugButton,
  onDebugClick,
  showDownloadButton,
  downloadUrl,
  isTouchHovering,
  touchOrbPosition,
  openSceneDialogRef,
  canAdjust,
  onAdjustScale,
  canChangeScene,
  onChangeScene,
  canReset,
  onReset,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
      {/* Jewelry Column */}
      <div className="md:col-span-1 flex flex-col">
        <h2 className="text-2xl font-extrabold text-center mb-5 text-zinc-800">Jewelry</h2>
        <div className="flex-grow flex items-center justify-center">
          <div
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
            }}
            onTouchStart={onTouchStart}
            className="cursor-move w-full max-w-xs"
          >
            <ObjectCard product={selectedProduct} isSelected={true} />
          </div>
        </div>
        <div className="text-center mt-4">
          <div className="h-5 flex items-center justify-center">
            <Button variant="link" size="sm" onClick={onChangeProduct}>
              Change Jewelry
            </Button>
          </div>
        </div>
      </div>

      {/* Scene Column */}
      <div className="md:col-span-2 flex flex-col">
        <h2 className="text-2xl font-extrabold text-center mb-5 text-zinc-800">Scene</h2>
        <div className="flex-grow flex items-center justify-center">
          <ImageUploader
            ref={sceneImgRef}
            id="scene-uploader"
            onFileSelect={onSceneFileSelect}
            imageUrl={sceneImageUrl}
            isDropZone={!!sceneImageUrl && !isLoading}
            onProductDrop={onProductDrop}
            persistedOrbPosition={persistedOrbPosition}
            showGenerateButton={showGenerateButton}
            onGenerateClick={onGenerateClick}
            showRetryButton={showRetryButton}
            onRetryClick={onRetryClick}
            showDebugButton={showDebugButton}
            onDebugClick={onDebugClick}
            showDownloadButton={showDownloadButton}
            downloadUrl={downloadUrl}
            isTouchHovering={isTouchHovering}
            touchOrbPosition={touchOrbPosition}
            openDialogRef={openSceneDialogRef}
          />
        </div>
        <ControlsBar
          canAdjust={canAdjust}
          onAdjustScale={onAdjustScale}
          canChangeScene={canChangeScene}
          onChangeScene={onChangeScene}
          canReset={canReset}
          onReset={onReset}
        />
      </div>
    </div>
  );
};

export default WorkspaceView;
