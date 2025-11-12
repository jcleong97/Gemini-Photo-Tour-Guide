import React from 'react';
import { InlineLoaderProps } from '../types';

export const InlineLoader: React.FC<InlineLoaderProps> = ({ text }) => (
  <div className="flex flex-col items-center justify-center text-center py-10">
    <div className="relative w-16 h-16 mb-4">
      <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
      <div className="absolute inset-0 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
    </div>
    <p className="text-lg font-semibold text-white">{text}</p>
  </div>
);

