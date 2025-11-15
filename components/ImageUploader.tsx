/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useRef, useState, useImperativeHandle, forwardRef, useEffect, MutableRefObject } from 'react';
import Button from '@/components/Button';
import { UploadIcon, DownloadIcon, WarningIcon } from '@/components/SVGIcon';
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
  showRetryButton?: boolean;
  onRetryClick?: () => void;
  showDebugButton?: boolean;
  onDebugClick?: () => void;
  showDownloadButton?: boolean;
  downloadUrl?: string | null;
  openDialogRef?: MutableRefObject<(() => void) | null>;
}


const ImageUploader = forwardRef<HTMLImageElement, ImageUploaderProps>(({ id, label, onFileSelect, imageUrl, isDropZone = false, onProductDrop, persistedOrbPosition, showGenerateButton = false, onGenerateClick, showRetryButton = false, onRetryClick, showDebugButton, onDebugClick, showDownloadButton, downloadUrl, openDialogRef }, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

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
  
  // Drag-and-drop file support for uploaders (not for placement drop zones)
  const acceptsFileDrop = !isDropZone;

  const extractImageFileFromDataTransfer = (dt: DataTransfer): File | null => {
    // Prefer DataTransferItem list
    if (dt.items && dt.items.length > 0) {
      for (const item of Array.from(dt.items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) return f;
        }
      }
    }
    // Fallback to files list
    if (dt.files && dt.files.length > 0) {
      const f = dt.files[0];
      if (f && f.type.startsWith('image/')) return f;
    }
    return null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!acceptsFileDrop) return;
    // Always prevent default so the element becomes a valid drop target
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (!acceptsFileDrop) return;
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!acceptsFileDrop) return;
    // Ensure we're leaving the container, not moving between children
    if ((e.currentTarget as Node).contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!acceptsFileDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const file = extractImageFileFromDataTransfer(e.dataTransfer);
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setFileTypeError('For best results, please use PNG, JPG, or JPEG formats.');
    } else {
      setFileTypeError(null);
    }
    onFileSelect(file);
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
  
  const isActionable = isDropZone || !imageUrl;

  const uploaderClasses = [
    'w-full aspect-video rounded-xl bg-white/70 backdrop-blur-sm border border-zinc-200 shadow-sm',
    'transition-all duration-300 relative overflow-hidden ring-1 ring-inset',
    isDropZone
      ? 'border-zinc-300 cursor-crosshair hover:ring-blue-400/40 hover:border-blue-300'
      : 'border-zinc-200 cursor-pointer hover:ring-blue-400/40 hover:border-blue-300',
    isDraggingOver && acceptsFileDrop ? 'ring-blue-400/60 border-blue-400 bg-blue-50/40' : 'ring-transparent',
    !isActionable ? 'cursor-default' : ''
  ].join(' ');

  return (
    <div className="flex flex-col items-center w-full">
      {label && <h3 className="text-xl font-semibold mb-4 text-zinc-700">{label}</h3>}
      <div
        className={uploaderClasses}
        onClick={isActionable ? handleClick : undefined}
        onDragOver={acceptsFileDrop ? handleDragOver : undefined}
        onDragEnter={acceptsFileDrop ? handleDragEnter : undefined}
        onDragLeave={acceptsFileDrop ? handleDragLeave : undefined}
        onDrop={acceptsFileDrop ? handleDrop : undefined}
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
            { (showGenerateButton || showRetryButton || showDebugButton || showDownloadButton) && (
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
                {showRetryButton && onRetryClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onRetryClick(); }}
                    ariaLabel="Retry generation"
                  >
                    Retry
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
          <div className="flex h-full flex-col items-center justify-center text-center text-zinc-600 p-6">
            <UploadIcon />
            <p className="font-medium">Click to upload</p>
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
