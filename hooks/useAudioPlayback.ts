import { useState, useEffect, useRef } from 'react';
import { decode, decodeAudioData } from '../utils/helpers';

interface UseAudioPlaybackReturn {
  isPlaying: boolean;
  isAudioReady: boolean;
  togglePlayback: () => void;
}

const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;

export const useAudioPlayback = (audioData: string): UseAudioPlaybackReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!audioData) {
      setIsAudioReady(false);
      return;
    }

    setIsAudioReady(false);
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
      sampleRate: SAMPLE_RATE 
    });
    
    const decodedData = decode(audioData);
    decodeAudioData(decodedData, audioContextRef.current, SAMPLE_RATE, NUM_CHANNELS)
      .then(buffer => {
        audioBufferRef.current = buffer;
        setIsAudioReady(true);
      })
      .catch(error => {
        console.error('Failed to decode audio:', error);
        setIsAudioReady(false);
      });

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

  return {
    isPlaying,
    isAudioReady,
    togglePlayback,
  };
};


