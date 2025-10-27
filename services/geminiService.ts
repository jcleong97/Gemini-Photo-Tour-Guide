
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { GroundingChunk } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const identifyLandmark = async (imageBase64: string, mimeType: string): Promise<string> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64,
          },
        },
        {
          text: 'Identify the primary landmark in this photo. Respond with only the name and city/country of the landmark. If no landmark is present, say "Unknown".',
        },
      ],
    },
  });
  const text = response.text.trim();
  if (text.toLowerCase() === 'unknown') {
    throw new Error('Could not identify a landmark in the photo.');
  }
  return text;
};

export const fetchLandmarkHistory = async (landmarkName: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Tell me about the history and some interesting facts about ${landmarkName}. Format the response as markdown.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return { text: response.text, sources: sources as GroundingChunk[] };
};

export const generateNarration = async (textToNarrate: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text: textToNarrate }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Failed to generate audio narration.');
  }
  return base64Audio;
};
