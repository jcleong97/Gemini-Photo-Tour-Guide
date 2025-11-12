## Quick context (what this app is)
- Frontend-only React + TypeScript app built with Vite. Core flow lives in `App.tsx`.
- Uses Google Gemini via the `@google/genai` client inside `services/geminiService.ts` for: image recognition (`identifyLandmark`), web-grounded content (`fetchLandmarkHistory`), and TTS (`generateNarration`).

## High-level architecture (what to read first)
- `App.tsx` — orchestrates the user flow: upload -> identify -> fetch history -> generate audio -> show results.
- `services/geminiService.ts` — single integration boundary with Gemini. All prompt and model changes should happen here.
- `components/*` — presentational components (e.g. `ImageUploader.tsx`, `AnalysisResult.tsx`). Prefer small UI changes here.
- `hooks/useAudioPlayback.ts` — audio playback and AudioContext handling for base64 audio returned by Gemini TTS.
- `utils/*` — helpers for data conversions (`fileToBase64`, `decodeAudioData`) and markdown formatting used with `dangerouslySetInnerHTML` in `AnalysisResult`.
- `types.ts` — canonical shapes (Status enum, GroundingChunk) used across the app.

## Key patterns & conventions (do this in this repo)
- Single AI integration point: change prompts, models, or tool usage only in `services/geminiService.ts`. Example:
  - `identifyLandmark` sends the image as `inlineData` and expects `response.text` to be the landmark name.
  - `fetchLandmarkHistory` uses `config.tools = [{ googleSearch: {} }]` and preserves grounding chunks in the response.
  - `generateNarration` requests `responseModalities: [Modality.AUDIO]` and extracts base64 audio from `response.candidates[0].content.parts[0].inlineData.data`.

- Environment keys: README instructs creating `.env.local` with `GEMINI_API_KEY`. `services/geminiService.ts` reads `process.env.API_KEY || process.env.GEMINI_API_KEY`. Follow the README when running locally.

- Data flow example (concrete):
  1. `ImageUploader` returns a `File` to `App.handleImageSelect`.
  2. `fileToBase64(file)` (in `utils/helpers.ts`) converts file to base64 (the data URL prefix is removed).
  3. `identifyLandmark(imageBase64, mimeType)` -> sets `landmarkName`.
  4. `fetchLandmarkHistory(landmarkName)` -> markdown text + `GroundingChunk[]` (used as `sources` in `AnalysisResult`).
  5. `generateNarration(landmarkInfo)` -> base64 audio -> fed into `useAudioPlayback`.

## Practical editing guidance for AI agents
- When modifying prompts or model names, update only `services/geminiService.ts`. Keep these changes small and test the full flow.
- If you change how audio is returned (e.g. a different encoding or wrapper), update `utils/helpers.decode` and `hooks/useAudioPlayback.ts` together — both expect base64 audio and the same decoding strategy.
- When updating markdown rendering, prefer touching `utils/markdownFormatter.ts` (used by `AnalysisResult`) rather than `dangerouslySetInnerHTML` call sites.

## Build & run (developer workflow)
- Install: `npm install`
- Create a `.env.local` at project root with `GEMINI_API_KEY=your_api_key_here` (see README).
- Dev server: `npm run dev` (Vite dev server). Production build: `npm run build` then `npm run preview`.

## Safety notes & gotchas discovered in the repo
- The app expects the Gemini API key to be available as an environment variable (see above). The code reads `process.env.GEMINI_API_KEY`. Be mindful that Vite normally exposes env vars that begin with `VITE_` to client code — the current project uses `process.env` directly, so changes to how env vars are injected may be required depending on deployment.
- `AnalysisResult` uses `dangerouslySetInnerHTML` with output from `utils/markdownFormatter.ts` — sanitize or limit changes here; assume inputs are grounded with sources stored in `types.GroundingChunk`.

## Files to reference when working on specific tasks
- Change prompts/models: `services/geminiService.ts`
- Orchestration / error state management: `App.tsx`
- Audio/playback: `hooks/useAudioPlayback.ts`, `utils/helpers.ts`
- Markdown rendering: `utils/markdownFormatter.ts`, `components/AnalysisResult.tsx`
- Types / shapes: `types.ts`

## Example PR checklist for AI-related changes
- Update `services/geminiService.ts` prompts or model names.
- Run `npm run dev` and exercise: upload image -> ensure landmark is identified -> history appears -> play narration.
- Verify sources appear under “Sources” in `AnalysisResult` and links open correctly.
- If altering audio encoding/shape, update `useAudioPlayback` and `utils/helpers.decode` and manually test playback.

---
If any of the sections above are unclear or you want the file to include example snippets or stricter rules (e.g., environment variable exposure rules for Vite), tell me which area to expand and I’ll update this file.