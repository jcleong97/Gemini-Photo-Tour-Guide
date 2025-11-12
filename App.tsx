import React, { useState, useCallback } from 'react';
import { identifyLandmark, fetchLandmarkHistory, generateNarration } from './services/geminiService';
import { fileToBase64 } from './utils/helpers';
import { Status, GroundingChunk } from './types';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { ErrorDisplay } from './components/ErrorDisplay';

export default function App() {
  const [status, setStatus] = useState<Status>(Status.Idle);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [landmarkName, setLandmarkName] = useState<string>('');
  const [landmarkInfo, setLandmarkInfo] = useState<string>('');
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);
  const [audioData, setAudioData] = useState<string>('');

  const resetState = useCallback(() => {
    setStatus(Status.Idle);
    setError(null);
    setImageFile(null);
    setImageUrl('');
    setLandmarkName('');
    setLandmarkInfo('');
    setGroundingSources([]);
    setAudioData('');
  }, []);

  const handleImageSelect = useCallback(async (file: File) => {
    resetState();
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setStatus(Status.Identifying);

    try {
      const imageBase64 = await fileToBase64(file);
      
      // Step 1: Identify landmark
      const identifiedName = await identifyLandmark(imageBase64, file.type);
      setLandmarkName(identifiedName);
      setStatus(Status.Fetching);
      
      // Step 2: Fetch historical information
      const { text: historyText, sources } = await fetchLandmarkHistory(identifiedName);
      setLandmarkInfo(historyText);
      setGroundingSources(sources);
      setStatus(Status.Narrating);

      // Step 3: Generate audio narration
      const narratedAudio = await generateNarration(historyText);
      setAudioData(narratedAudio);
      setStatus(Status.Done);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      setStatus(Status.Error);
    }
  }, [resetState]);

  const isProcessing = status !== Status.Idle && status !== Status.Done && status !== Status.Error;
  const showUploader = status === Status.Idle;
  const showError = status === Status.Error;
  const showResult = !showUploader && !showError && !!imageUrl;

  return (
    <div className="min-h-screen bg-gray-900 bg-grid-cyan-500/10 flex items-center justify-center p-4">
      <div className="w-full">
        {showUploader && (
          <ImageUploader 
            onImageSelect={handleImageSelect} 
            isProcessing={isProcessing} 
          />
        )}
        
        {showError && (
          <ErrorDisplay 
            error={error || 'Unknown error'} 
            onReset={resetState} 
          />
        )}

        {showResult && (
          <AnalysisResult 
            imageUrl={imageUrl}
            landmarkName={landmarkName}
            landmarkInfo={landmarkInfo}
            audioData={audioData}
            sources={groundingSources}
            onReset={resetState}
            status={status}
          />
        )}
      </div>
    </div>
  );
}
