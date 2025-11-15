/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useRef, useState, useImperativeHandle, forwardRef, useEffect, MutableRefObject } from 'react';
import Button from '@/components/Button';
import { computeRelativePositionFromPoint } from '@/services/positioning';

interface ImageUploaderProps {
  id: string;
  label?: string;
  onFileSelect: (file: File) => void;
  imageUrl: string | null;
  isDropZone?: boolean;
  onProductDrop?: (position: {x: number, y: number}, relativePosition: { xPercent: number; yPercent: number; }) => void;
  persistedOrbPosition?: { x: number; y: number } | null;
  showGenerateButton?: boolean;
  onGenerateClick?: () => void;
  showDebugButton?: boolean;
  onDebugClick?: () => void;
  showDownloadButton?: boolean;
  downloadUrl?: string | null;
  isTouchHovering?: boolean;
  touchOrbPosition?: { x: number; y: number } | null;
  openDialogRef?: MutableRefObject<(() => void) | null>;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const DownloadIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const WarningIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);


const ImageUploader = forwardRef<HTMLImageElement, ImageUploaderProps>(({ id, label, onFileSelect, imageUrl, isDropZone = false, onProductDrop, persistedOrbPosition, showGenerateButton = false, onGenerateClick, showDebugButton, onDebugClick, showDownloadButton, downloadUrl, isTouchHovering = false, touchOrbPosition = null, openDialogRef }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [orbPosition, setOrbPosition] = useState<{x: number, y: number} | null>(null);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);

  // Expose the internal imgRef to the parent component via the forwarded ref
  useImperativeHandle(ref, () => imgRef.current as HTMLImageElement);
  
  useEffect(() => {
    if (!imageUrl) {
      setFileTypeError(null);
    }
  }, [imageUrl]);

  // Expose a method so parent buttons can open the file dialog
  useEffect(() => {
    if (!openDialogRef) return;
    openDialogRef.current = () => {
      inputRef.current?.click();
    };
    return () => {
      openDialogRef.current = null;
    };
  }, [openDialogRef]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setFileTypeError('For best results, please use PNG, JPG, or JPEG formats.');
      } else {
        setFileTypeError(null);
      }
      onFileSelect(file);
    }
  };
  
  // A shared handler for both click and drop placements.
  const handlePlacement = useCallback((clientX: number, clientY: number, currentTarget: HTMLDivElement) => {
    const img = imgRef.current;
    if (!img || !onProductDrop) return;
    const res = computeRelativePositionFromPoint(img, currentTarget, clientX, clientY);
    if (!res) return;
    onProductDrop(res.position, res.relative);
  }, [onProductDrop]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDropZone && onProductDrop) {
      // If it's a drop zone, a click should place the product.
      handlePlacement(event.clientX, event.clientY, event.currentTarget);
    } else {
      // Otherwise, it's an uploader, so open the file dialog.
      inputRef.current?.click();
    }
  };
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(true);
      if (isDropZone && onProductDrop) {
          const rect = event.currentTarget.getBoundingClientRect();
          setOrbPosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
          });
      }
  }, [isDropZone, onProductDrop]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      setOrbPosition(null);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOver(false);
      setOrbPosition(null);

      if (isDropZone && onProductDrop) {
          // Case 1: A product is being dropped onto the scene
          handlePlacement(event.clientX, event.clientY, event.currentTarget);
      } else {
          // Case 2: A file is being dropped to be uploaded
          const file = event.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
              const allowedTypes = ['image/jpeg', 'image/png'];
              if (!allowedTypes.includes(file.type)) {
                  setFileTypeError('For best results, please use PNG, JPG, or JPEG formats.');
              } else {
                  setFileTypeError(null);
              }
              onFileSelect(file);
          }
      }
  }, [isDropZone, onProductDrop, onFileSelect, handlePlacement]);
  
  const showHoverState = isDraggingOver || isTouchHovering;
  const currentOrbPosition = orbPosition || touchOrbPosition;
  const isActionable = isDropZone || !imageUrl;

  const uploaderClasses = [
    'w-full aspect-video rounded-xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm',
    'transition-all duration-300 relative overflow-hidden ring-1 ring-inset ring-transparent',
    showHoverState
      ? 'border-blue-300 ring-blue-400/40 bg-blue-50/70 is-dragging-over'
      : (isDropZone
          ? 'border-zinc-300 cursor-crosshair hover:ring-blue-400/40 hover:border-blue-300'
          : 'border-zinc-200 cursor-pointer hover:ring-blue-400/40 hover:border-blue-300'),
    !isActionable ? 'cursor-default' : ''
  ].join(' ');

  return (
    <div className="flex flex-col items-center w-full">
      {label && <h3 className="text-xl font-semibold mb-4 text-zinc-700">{label}</h3>}
      <div
        className={uploaderClasses}
        onClick={isActionable ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-dropzone-id={id}
      >
        <input
          type="file"
          id={id}
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg"
          className="hidden"
        />
        {imageUrl ? (
          <>
            <img 
              ref={imgRef}
              src={imageUrl} 
              alt={label || 'Uploaded Scene'} 
              className="w-full h-full object-contain" 
            />
            
            <div 
                className="drop-orb" 
                style={{ 
                    left: currentOrbPosition ? currentOrbPosition.x : -9999, 
                    top: currentOrbPosition ? currentOrbPosition.y : -9999 
                }}
            ></div>
            {persistedOrbPosition && (
                <div 
                    className="drop-orb" 
                    style={{ 
                        left: persistedOrbPosition.x, 
                        top: persistedOrbPosition.y,
                        opacity: 1,
                        transform: 'translate(-50%, -50%) scale(1)',
                        transition: 'none', // Appear instantly without animation
                    }}
                ></div>
            )}
            { (showGenerateButton || showDebugButton || showDownloadButton) && (
              <div className="absolute bottom-2 right-2 flex items-center gap-2 z-20">
                {showGenerateButton && onGenerateClick && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onGenerateClick(); }}
                    ariaLabel="Generate composed image"
                  >
                    Generate
                  </Button>
                )}
                {showDebugButton && onDebugClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDebugClick(); }}
                    ariaLabel="Show debug view"
                  >
                    Debug
                  </Button>
                )}
                {showDownloadButton && downloadUrl && (
                  <Button
                    variant="primary"
                    size="sm"
                    href={downloadUrl}
                    download={`home-canvas-creation.jpeg`}
                    onClick={(e) => e.stopPropagation()}
                    ariaLabel="Download generated image"
                    className="pl-2 pr-3"
                  >
                    <DownloadIcon className="h-4 w-4 mr-1.5" />
                    <span>Download</span>
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-zinc-600 p-6">
            <UploadIcon />
            <p className="font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-zinc-500 mt-1">PNG or JPG, up to ~10MB</p>
          </div>
        )}
      </div>
      {fileTypeError && (
        <div className="w-full mt-2 text-sm text-yellow-900 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center animate-fade-in" role="alert">
            <WarningIcon />
            <span>{fileTypeError}</span>
        </div>
      )}
    </div>
  );
});

export default ImageUploader;
