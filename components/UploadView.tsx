/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { MutableRefObject } from 'react';
import Button from '@/components/Button';
import ImageUploader from '@/components/ImageUploader';

interface UploadViewProps {
  productImageUrl: string | null;
  sceneImageUrl: string | null;
  onUploadProduct: (file: File) => void;
  onUploadScene: (file: File) => void;
  onChangeProduct: () => void;
  onChangeScene: () => void;
  canChangeProduct: boolean;
  canChangeScene: boolean;
  openSceneDialogRef?: MutableRefObject<(() => void) | null>;
}

const UploadView: React.FC<UploadViewProps> = ({
  productImageUrl,
  sceneImageUrl,
  onUploadProduct,
  onUploadScene,
  onChangeProduct,
  onChangeScene,
  canChangeProduct,
  canChangeScene,
  openSceneDialogRef,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col">
          <h2 className="text-2xl font-extrabold text-center mb-5 text-zinc-800">Upload Jewelry</h2>
          <ImageUploader
            id="product-uploader"
            onFileSelect={onUploadProduct}
            imageUrl={productImageUrl}
          />
          {canChangeProduct && (
            <div className="text-center mt-4">
              <div className="h-5 flex items-center justify-center">
                <Button variant="link" size="sm" onClick={onChangeProduct}>
                  Change Jewelry
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h2 className="text-2xl font-extrabold text-center mb-5 text-zinc-800">Upload Scene</h2>
          <ImageUploader
            id="scene-uploader"
            onFileSelect={onUploadScene}
            imageUrl={sceneImageUrl}
            openDialogRef={openSceneDialogRef}
          />
          {canChangeScene && (
            <div className="text-center mt-4">
              <div className="h-5 flex items-center justify-center">
                <Button variant="link" size="sm" onClick={onChangeScene}>
                  Change Scene
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="text-center mt-10 min-h-[4rem] flex flex-col justify-center items-center">
        <p className="text-zinc-500 animate-fade-in">
          Upload a jewelry photo and a scene photo to begin.
        </p>
      </div>
    </div>
  );
};

export default UploadView;

