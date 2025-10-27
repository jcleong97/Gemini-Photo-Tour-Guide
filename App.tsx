import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { identifyLandmark, fetchLandmarkHistory, generateNarration } from './services/geminiService';
import { fileToBase64, decode, decodeAudioData } from './utils/helpers';
import { Status, GroundingChunk } from './types';
import { UploadIcon, PlayIcon, PauseIcon, ResetIcon, SpinnerIcon } from './components/Icons';

// Sub-components defined outside the main App component to prevent re-creation on re-renders

const ImageUploader: React.FC<{ onImageSelect: (file: File) => void; isProcessing: boolean }> = React.memo(({ onImageSelect, isProcessing }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <h2 className="text-3xl font-bold text-cyan-300 mb-2">AI Photo Tour Guide</h2>
      <p className="text-lg text-gray-300 mb-8">Upload a photo of a landmark to learn its story.</p>
      <label
        htmlFor="image-upload"
        className={`relative block w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${isProcessing ? 'border-gray-600 bg-gray-800/50' : 'border-cyan-400/50 hover:border-cyan-400 hover:bg-cyan-900/20'}`}
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

const InlineLoader: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center py-10">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
      </div>
      <p className="text-lg font-semibold text-white">{text}</p>
    </div>
  );

const AnalysisResult: React.FC<{
  imageUrl: string;
  landmarkName: string;
  landmarkInfo: string;
  audioData: string;
  sources: GroundingChunk[];
  onReset: () => void;
  status: Status;
}> = React.memo(({ imageUrl, landmarkName, landmarkInfo, audioData, sources, onReset, status }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (audioData) {
      setIsAudioReady(false);
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedData = decode(audioData);
      decodeAudioData(decodedData, audioContextRef.current, 24000, 1).then(buffer => {
        audioBufferRef.current = buffer;
        setIsAudioReady(true);
      });
    }
    return () => {
      sourceRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, [audioData]);

  const togglePlayback = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
    } else {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      sourceRef.current = source;
      setIsPlaying(true);
    }
  };
  
  const formattedInfo = useMemo(() => {
    // A simple markdown to HTML converter
    return landmarkInfo
      .replace(/## (.*)/g, '<h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-300">$1</h3>')
      .replace(/\* \*(.*?)\* \*/g, '<strong>$1</strong>')
      .replace(/\* (.*)/g, '<li class="ml-5 list-disc">$1</li>')
      .replace(/\n/g, '<br />');
  }, [landmarkInfo]);

  const getLoadingText = (status: Status) => {
    switch (status) {
        case Status.Identifying: return 'Identifying landmark...';
        case Status.Fetching: return 'Gathering history...';
        default: return 'Loading...';
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
            <img src={imageUrl} alt="Uploaded landmark" className="w-full h-auto object-cover max-h-[50vh]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
                <h2 className="text-3xl md:text-5xl font-bold text-white shadow-lg">{landmarkName || <span className="animate-pulse">Identifying...</span>}</h2>
            </div>
             <button onClick={onReset} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-cyan-500/80 transition-colors">
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
                    {status === Status.Narrating ? <SpinnerIcon className="w-6 h-6" /> : (isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />)}
                    <span>{status === Status.Narrating ? 'Creating Audio' : (isPlaying ? 'Pause' : 'Play Narration')}</span>
                  </button>
                )}
            </div>
            
            {!landmarkInfo ? (
              <InlineLoader text={getLoadingText(status)} />
            ) : (
              <div className="prose prose-invert prose-lg max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: formattedInfo }}></div>
            )}
            
            {sources && sources.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-lg font-semibold text-cyan-400 mb-2">Sources:</h4>
                <ul className="list-disc list-inside text-sm">
                  {sources.map((source, index) => (
                    source.web && <li key={index}><a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">{source.web.title}</a></li>
                  ))}
                </ul>
              </div>
            )}
        </div>
    </div>
  );
});


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
      
      const identifiedName = await identifyLandmark(imageBase64, file.type);
      setLandmarkName(identifiedName);
      setStatus(Status.Fetching);
      
      const { text: historyText, sources } = await fetchLandmarkHistory(identifiedName);
      setLandmarkInfo(historyText);
      setGroundingSources(sources);
      setStatus(Status.Narrating);

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
        {showUploader && <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />}
        
        {showError && (
          <div className="text-center p-8 bg-red-900/50 border border-red-500 rounded-xl max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-red-300 mb-2">Analysis Failed</h2>
            <p className="text-red-200 mb-6">{error}</p>
            <button onClick={resetState} className="px-6 py-2 bg-red-500 text-white font-semibold rounded-full hover:bg-red-400 transition-colors">
              Try Again
            </button>
          </div>
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