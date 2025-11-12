import React from 'react';
import { ErrorDisplayProps } from '../types';

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onReset }) => (
  <div className="text-center p-8 bg-red-900/50 border border-red-500 rounded-xl max-w-md mx-auto">
    <h2 className="text-2xl font-bold text-red-300 mb-2">Analysis Failed</h2>
    <p className="text-red-200 mb-6">{error}</p>
    <button 
      onClick={onReset} 
      className="px-6 py-2 bg-red-500 text-white font-semibold rounded-full hover:bg-red-400 transition-colors"
    >
      Try Again
    </button>
  </div>
);


