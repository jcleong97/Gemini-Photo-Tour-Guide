import React, { useState, useCallback } from 'react';
import { ImageUploaderProps } from '../types';
import { UploadIcon } from './Icons';

export const ImageUploader: React.FC<ImageUploaderProps> = React.memo(({ onImageSelect, isProcessing }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isProcessing) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }

    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  }, [isProcessing]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    if (isProcessing) {
      return;
    }

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      onImageSelect(droppedFiles[0]);
    }
  }, [isProcessing, onImageSelect]);

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <h2 className="text-3xl font-bold text-cyan-300 mb-2">AI Photo Tour Guide</h2>
      <p className="text-lg text-gray-300 mb-8">Upload a photo of a landmark to learn its story.</p>
      <label
        htmlFor="image-upload"
        className={`relative block w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${
          isProcessing
            ? 'border-gray-600 bg-gray-800/50'
            : isDragActive
              ? 'border-cyan-400 bg-cyan-900/30'
              : 'border-cyan-400/50 hover:border-cyan-400 hover:bg-cyan-900/20'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center">
          <UploadIcon className="w-12 h-12 text-cyan-400 mb-4" />
          <span className="text-xl font-semibold text-white">
            {isProcessing ? 'Processing...' : 'Click to upload or drag & drop'}
          </span>
          <span className="mt-2 text-gray-400">PNG, JPG, or WEBP</span>
        </div>
        <input
          id="image-upload"
          type="file"
          className="sr-only"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
      </label>
    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';


