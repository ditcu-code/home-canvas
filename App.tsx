/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef } from 'react';
import { generateCompositeImage } from '@/services/geminiService';
import { dataURLtoFile } from '@/services/fileUtils';
import { loadingMessages } from '@/constants/loadingMessages';
import { Product } from '@/types';
import Header from '@/components/Header';
import Spinner from '@/components/Spinner';
import DebugModal from '@/components/DebugModal';
import TouchGhost from '@/components/TouchGhost';
import ErrorState from '@/components/ErrorState';
import UploadView from '@/components/UploadView';
import WorkspaceView from '@/components/WorkspaceView';
import { useRotatingMessages } from '@/hooks/useRotatingMessages';
import { useObjectUrlCleanup } from '@/hooks/useObjectUrlCleanup';
import { useTouchDnD } from '@/hooks/useTouchDnD';

// Drag ghost image moved to constants/drag.ts and used in WorkspaceView

// Utilities and constants moved to dedicated modules


const App: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [sceneImage, setSceneImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [persistedOrbPosition, setPersistedOrbPosition] = useState<{x: number, y: number} | null>(null);
  const [debugImageUrl, setDebugImageUrl] = useState<string | null>(null);
  const [debugPrompt, setDebugPrompt] = useState<string | null>(null);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [generatedSceneUrlForDownload, setGeneratedSceneUrlForDownload] = useState<string | null>(null);
  // Preserve the originally uploaded scene for re-generations (e.g., resizing)
  const [originalSceneImage, setOriginalSceneImage] = useState<File | null>(null);
  // Allow post-generation size adjustments
  const [jewelryScale, setJewelryScale] = useState<number>(1);
  const [lastDropRelativePosition, setLastDropRelativePosition] = useState<{ xPercent: number; yPercent: number } | null>(null);

  const sceneImgRef = useRef<HTMLImageElement>(null);
  // Refs to support opening file pickers from "Change" buttons
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const sceneUploaderOpenRef = useRef<(() => void) | null>(null);
  
  const sceneImageUrl = sceneImage ? URL.createObjectURL(sceneImage) : null;
  const productImageUrl = selectedProduct ? selectedProduct.imageUrl : null;

  // Hooks: URL cleanup + rotating loading messages
  useObjectUrlCleanup(sceneImageUrl);
  useObjectUrlCleanup(productImageUrl);
  const loadingMessageIndex = useRotatingMessages(isLoading, loadingMessages, 3000);

  // Centralized generation-state reset to avoid repetition
  const resetGenerationState = useCallback(() => {
    setPersistedOrbPosition(null);
    setDebugImageUrl(null);
    setDebugPrompt(null);
    setGeneratedSceneUrlForDownload(null);
    setJewelryScale(1);
    setLastDropRelativePosition(null);
  }, []);

  const handleProductImageUpload = useCallback((file: File) => {
    // useEffect will handle cleaning up the previous blob URL
    setError(null);
    try {
        const imageUrl = URL.createObjectURL(file);
        const product: Product = {
            id: Date.now(),
            name: file.name,
            imageUrl: imageUrl,
        };
        setProductImageFile(file);
        setSelectedProduct(product);
        // Clear generation-related state when changing jewelry
        resetGenerationState();
    } catch(err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Could not load the jewelry image. Details: ${errorMessage}`);
      console.error(err);
    }
  }, [resetGenerationState]);

  const handleSceneImageUpload = useCallback((file: File) => {
    setSceneImage(file);
    setOriginalSceneImage(file);
    // Clear generation-related state when changing scene
    resetGenerationState();
  }, [resetGenerationState]);

  // Hidden input change handlers (for Change buttons)
  const handleProductFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProductImageUpload(file);
    // Allow selecting the same file again later
    e.currentTarget.value = '';
  };

  // Instant Start feature removed

  const handleProductDrop = useCallback(async (position: {x: number, y: number}, relativePosition: { xPercent: number; yPercent: number; }) => {
    if (!productImageFile || !sceneImage || !selectedProduct) {
      setError('An unexpected error occurred. Please try again.');
      return;
    }
    setPersistedOrbPosition(position);
    setLastDropRelativePosition(relativePosition);
    setIsLoading(true);
    setError(null);
    try {
      const baseScene = originalSceneImage || sceneImage;
      const { finalImageUrl, debugImageUrl, finalPrompt } = await generateCompositeImage(
        productImageFile, 
        selectedProduct.name,
        baseScene,
        baseScene.name,
        relativePosition,
        jewelryScale
      );
      setGeneratedSceneUrlForDownload(finalImageUrl);
      setDebugImageUrl(debugImageUrl);
      setDebugPrompt(finalPrompt);
      const newSceneFile = dataURLtoFile(finalImageUrl, `generated-scene-${Date.now()}.jpeg`);
      setSceneImage(newSceneFile);

    } catch (err)
 {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setPersistedOrbPosition(null);
    }
  }, [productImageFile, sceneImage, selectedProduct, originalSceneImage, jewelryScale]);


  const handleReset = useCallback(() => {
    // Let useEffect handle URL revocation
    setSelectedProduct(null);
    setProductImageFile(null);
    setSceneImage(null);
    setError(null);
    setIsLoading(false);
    resetGenerationState();
    setOriginalSceneImage(null);
  }, [resetGenerationState]);

  const handleChangeProduct = useCallback(() => {
    // Let useEffect handle URL revocation
    setSelectedProduct(null);
    setProductImageFile(null);
    resetGenerationState();
  }, [resetGenerationState]);
  
  const handleChangeScene = useCallback(() => {
    setSceneImage(null);
    setOriginalSceneImage(null);
    resetGenerationState();
  }, [resetGenerationState]);

  const handleAdjustScale = useCallback(async (delta: number) => {
    if (!productImageFile || !originalSceneImage || !selectedProduct || !lastDropRelativePosition) return;
    const nextScale = Math.max(0.5, Math.min(2, jewelryScale + delta));
    if (nextScale === jewelryScale) return;
    setIsLoading(true);
    setError(null);
    try {
      const { finalImageUrl, debugImageUrl, finalPrompt } = await generateCompositeImage(
        productImageFile,
        selectedProduct.name,
        originalSceneImage,
        originalSceneImage.name,
        lastDropRelativePosition,
        nextScale
      );
      setGeneratedSceneUrlForDownload(finalImageUrl);
      setDebugImageUrl(debugImageUrl);
      setDebugPrompt(finalPrompt);
      const newSceneFile = dataURLtoFile(finalImageUrl, `generated-scene-${Date.now()}.jpeg`);
      setSceneImage(newSceneFile);
      setJewelryScale(nextScale);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to adjust size. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [productImageFile, originalSceneImage, selectedProduct, lastDropRelativePosition, jewelryScale]);

  // Effects above are handled by hooks now

  const touch = useTouchDnD({
    enabled: !!selectedProduct,
    sceneImgRef,
    onDrop: (position, relative) => {
      handleProductDrop(position, relative);
    }
  });

  // Touch DnD now handled by useTouchDnD

  const renderContent = () => {
    if (error) {
      return <ErrorState message={error} onReset={handleReset} />;
    }
    
    if (!productImageFile || !sceneImage) {
      return (
        <UploadView
          productImageUrl={productImageUrl}
          sceneImageUrl={sceneImageUrl}
          onUploadProduct={handleProductImageUpload}
          onUploadScene={handleSceneImageUpload}
          onChangeProduct={() => productFileInputRef.current?.click()}
          onChangeScene={() => sceneUploaderOpenRef.current?.()}
          canChangeProduct={!!productImageFile}
          canChangeScene={!!sceneImage}
          openSceneDialogRef={sceneUploaderOpenRef}
        />
      );
    }

    return (
      <div className="w-full max-w-7xl mx-auto animate-fade-in">
        <WorkspaceView
          selectedProduct={selectedProduct!}
          onChangeProduct={() => productFileInputRef.current?.click()}
          onTouchStart={touch.handleTouchStart}
          sceneImgRef={sceneImgRef}
          sceneImageUrl={sceneImageUrl!}
          isLoading={isLoading}
          onSceneFileSelect={handleSceneImageUpload}
          onProductDrop={handleProductDrop}
          persistedOrbPosition={persistedOrbPosition}
          showDebugButton={!!debugImageUrl && !isLoading}
          onDebugClick={() => setIsDebugModalOpen(true)}
          showDownloadButton={!!generatedSceneUrlForDownload && !isLoading}
          downloadUrl={generatedSceneUrlForDownload}
          isTouchHovering={touch.isHoveringDropZone}
          touchOrbPosition={touch.touchOrbPosition}
          openSceneDialogRef={sceneUploaderOpenRef}
          canAdjust={!!(generatedSceneUrlForDownload && !isLoading && lastDropRelativePosition && originalSceneImage)}
          onAdjustScale={handleAdjustScale}
          canChangeScene={!!(sceneImage && !isLoading)}
          onChangeScene={() => sceneUploaderOpenRef.current?.()}
          canReset={!!(productImageFile && sceneImage && !isLoading)}
          onReset={handleReset}
        />
        <div className="text-center mt-10 min-h-[8rem] flex flex-col justify-center items-center">
          {isLoading ? (
            <div className="animate-fade-in">
               <Spinner />
               <p className="text-xl mt-4 text-zinc-600 transition-opacity duration-500">{loadingMessages[loadingMessageIndex]}</p>
            </div>
          ) : (
            <p className="text-zinc-500 animate-fade-in">
               Drag the jewelry onto a location in the scene, or simply click where you want it.
            </p>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-white text-zinc-800 flex items-center justify-center p-4 md:p-8">
      <TouchGhost 
        imageUrl={touch.isTouchDragging ? productImageUrl : null} 
        position={touch.touchGhostPosition}
      />
      <div className="flex flex-col items-center gap-8 w-full">
        <Header />
        <main className="w-full">
          {renderContent()}
        </main>
      </div>
      <DebugModal 
        isOpen={isDebugModalOpen} 
        onClose={() => setIsDebugModalOpen(false)}
        imageUrl={debugImageUrl}
        prompt={debugPrompt}
      />
      {/* Hidden file inputs for Change buttons */}
      <input
        type="file"
        ref={productFileInputRef}
        className="hidden"
        accept="image/png, image/jpeg"
        onChange={handleProductFileInputChange}
      />
    </div>
  );
};

export default App;
