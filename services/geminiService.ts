
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { GroundingChunk } from '../types';

let ai: GoogleGenAI | null = null;

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const possibleMessage = (error as { message?: string }).message
      ?? (error as { error?: { message?: string } }).error?.message
      ?? (error as { error?: { statusMessage?: string } }).error?.statusMessage;

    if (typeof possibleMessage === 'string' && possibleMessage.trim().length > 0) {
      return possibleMessage;
    }
  }

  return 'An unexpected error occurred while contacting the Gemini service.';
};

const normalizeGeminiError = (error: unknown): never => {
  const message = extractErrorMessage(error);

  if (/model\s+is\s+overloaded/i.test(message) || /unavailable/i.test(message) || /503/.test(message)) {
    throw new Error('Gemini is currently overloaded. Please try again in a few moments.');
  }

  if (/rate\s+limit/i.test(message) || /429/.test(message)) {
    throw new Error('Gemini rate limit reached. Wait a bit and try again.');
  }

  throw new Error(message);
};

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please create a .env.local file with your API key.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const identifyLandmark = async (imageBase64: string, mimeType: string): Promise<string> => {
  let response: GenerateContentResponse;
  try {
    response = await getAI().models.generateContent({
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
  } catch (error) {
    normalizeGeminiError(error);
  }

  const text = response.text.trim();
  if (text.toLowerCase() === 'unknown') {
    throw new Error('Could not identify a landmark in the photo.');
  }
  return text;
};

export const fetchLandmarkHistory = async (landmarkName: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
  let response: GenerateContentResponse;
  try {
    response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Tell me about the history and some interesting facts about ${landmarkName}. Format the response as markdown.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
  } catch (error) {
    normalizeGeminiError(error);
  }
  
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return { text: response.text, sources: sources as GroundingChunk[] };
};

export const generateNarration = async (textToNarrate: string): Promise<string> => {
  let response: GenerateContentResponse;
  try {
    response = await getAI().models.generateContent({
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
  } catch (error) {
    normalizeGeminiError(error);
  }

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Failed to generate audio narration.');
  }
  return base64Audio;
};
