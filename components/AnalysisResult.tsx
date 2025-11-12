import React, { useMemo } from 'react';
import { AnalysisResultProps, Status } from '../types';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { formatMarkdownToHTML } from '../utils/markdownFormatter';
import { InlineLoader } from './InlineLoader';
import { PlayIcon, PauseIcon, ResetIcon, SpinnerIcon } from './Icons';

const getLoadingText = (status: Status): string => {
  switch (status) {
    case Status.Identifying:
      return 'Identifying landmark...';
    case Status.Fetching:
      return 'Gathering history...';
    default:
      return 'Loading...';
  }
};

export const AnalysisResult: React.FC<AnalysisResultProps> = React.memo(({
  imageUrl,
  landmarkName,
  landmarkInfo,
  audioData,
  sources,
  onReset,
  status,
}) => {
  const { isPlaying, isAudioReady, togglePlayback } = useAudioPlayback(audioData);
  
  const formattedInfo = useMemo(
    () => formatMarkdownToHTML(landmarkInfo),
    [landmarkInfo]
  );

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        <img 
          src={imageUrl} 
          alt="Uploaded landmark" 
          className="w-full h-auto object-cover max-h-[50vh]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white shadow-lg">
            {landmarkName || <span className="animate-pulse">Identifying...</span>}
          </h2>
        </div>
        <button 
          onClick={onReset} 
          className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-cyan-500/80 transition-colors"
          aria-label="Reset"
        >
          <ResetIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-8 p-6 md:p-8 bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-cyan-300">Generated Guide</h3>
          {landmarkInfo && (
            <button 
              onClick={togglePlayback} 
              disabled={!isAudioReady || status === Status.Narrating}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black font-semibold rounded-full hover:bg-cyan-400 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {status === Status.Narrating ? (
                <SpinnerIcon className="w-6 h-6" />
              ) : isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6" />
              )}
              <span>
                {status === Status.Narrating 
                  ? 'Creating Audio' 
                  : isPlaying 
                  ? 'Pause' 
                  : 'Play Narration'}
              </span>
            </button>
          )}
        </div>
        
        {!landmarkInfo ? (
          <InlineLoader text={getLoadingText(status)} />
        ) : (
          <div 
            className="prose prose-invert prose-lg max-w-none text-gray-300" 
            dangerouslySetInnerHTML={{ __html: formattedInfo }}
          />
        )}
        
        {sources && sources.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-lg font-semibold text-cyan-400 mb-2">Sources:</h4>
            <ul className="list-disc list-inside text-sm">
              {sources.map((source, index) => (
                source.web && (
                  <li key={index}>
                    <a 
                      href={source.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-cyan-500 hover:underline"
                    >
                      {source.web.title}
                    </a>
                  </li>
                )
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

AnalysisResult.displayName = 'AnalysisResult';

