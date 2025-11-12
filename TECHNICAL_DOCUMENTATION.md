# Gemini Photo Tour Guide - Technical Documentation

## 🎯 What This System Does

This application is an **AI-powered photo tour guide** that uses Google's Gemini AI to:

1. **Identify landmarks** from uploaded photos
2. **Research historical information** about the identified landmark
3. **Generate audio narration** using text-to-speech
4. **Display the information** with sources in a beautiful UI

### User Flow

```
User Uploads Photo → AI Identifies Landmark → AI Fetches History → AI Generates Audio → User Views Results
```

---

## 🏗️ System Architecture

### Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **AI Service**: Google Gemini AI SDK (`@google/genai`)
- **Audio Processing**: Web Audio API

### Project Structure

```
Gemini-Photo-Tour-Guide/
├── App.tsx                 # Main React component (UI logic)
├── index.tsx               # React entry point
├── index.html              # HTML template
├── services/
│   └── geminiService.ts    # AI API calls to Gemini
├── utils/
│   └── helpers.ts          # Image/Audio conversion utilities
├── types.ts                # TypeScript type definitions
├── components/
│   └── Icons.tsx           # SVG icon components
├── vite.config.ts          # Vite build configuration
└── .env.local              # API key (not in git)
```

---

## 📋 Code Explanation

### 1. **Main Application (`App.tsx`)**

The main component manages the entire application state and orchestrates the AI workflow.

#### State Management

```typescript
const [status, setStatus] = useState<Status>(Status.Idle);
const [imageFile, setImageFile] = useState<File | null>(null);
const [landmarkName, setLandmarkName] = useState<string>('');
const [landmarkInfo, setLandmarkInfo] = useState<string>('');
const [audioData, setAudioData] = useState<string>('');
```

**Status States:**
- `Idle`: Initial state, showing upload interface
- `Identifying`: AI is analyzing the image
- `Fetching`: AI is gathering historical information
- `Narrating`: AI is generating audio narration
- `Done`: All processing complete
- `Error`: Something went wrong

#### Main Workflow (`handleImageSelect`)

When a user uploads an image, this function executes the following steps:

```typescript
1. Convert image to Base64 string
   → fileToBase64(file)

2. Identify the landmark (Status: Identifying)
   → identifyLandmark(imageBase64, file.type)
   → Returns: "Eiffel Tower, Paris, France"

3. Fetch historical information (Status: Fetching)
   → fetchLandmarkHistory(landmarkName)
   → Returns: Markdown text + web sources

4. Generate audio narration (Status: Narrating)
   → generateNarration(historyText)
   → Returns: Base64-encoded audio data

5. Display results (Status: Done)
   → Shows image, text, audio player, and sources
```

#### Components

**ImageUploader**: Handles file upload with drag-and-drop support

**AnalysisResult**: Displays the results with:
- Image display with landmark name overlay
- Markdown-formatted historical information
- Audio player (play/pause functionality)
- Source links from Google Search
- Reset button to start over

**InlineLoader**: Shows loading spinner with status messages

### 2. **AI Service Layer (`services/geminiService.ts`)**

This is where all AI interactions happen. It's the **bridge between your app and Google's Gemini AI**.

#### API Key Management

```typescript
const getAI = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set...");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};
```

**Why this pattern?**
- Lazy initialization: Only creates the AI client when first needed
- Prevents app crash on startup if API key is missing
- Singleton pattern: Reuses the same client instance

#### Function 1: `identifyLandmark()`

**Purpose**: Uses vision AI to recognize landmarks in photos

**How it works:**
```typescript
await getAI().models.generateContent({
  model: 'gemini-2.5-flash',
  contents: {
    parts: [
      {
        inlineData: {
          mimeType: 'image/jpeg',  // Image MIME type
          data: imageBase64,       // Base64-encoded image
        },
      },
      {
        text: 'Identify the primary landmark...', // Prompt
      },
    ],
  },
});
```

**AI Model**: `gemini-2.5-flash`
- Fast, efficient vision model
- Can analyze images and understand context
- Optimized for quick responses

**Input**: 
- Base64 image data
- Text prompt asking to identify landmark

**Output**: 
- Plain text: "Landmark Name, City, Country"
- Or "Unknown" if no landmark detected

#### Function 2: `fetchLandmarkHistory()`

**Purpose**: Researches and provides historical information about the landmark

**How it works:**
```typescript
await getAI().models.generateContent({
  model: 'gemini-2.5-flash',
  contents: `Tell me about the history and facts about ${landmarkName}`,
  config: {
    tools: [{ googleSearch: {} }],  // ⭐ Enable Google Search
  },
});
```

**Key Configuration**:
- `tools: [{ googleSearch: {} }]` - Enables real-time web search
- This gives the AI access to current, factual information from the internet
- Not limited to training data - searches Google in real-time

**Output**:
- `text`: Markdown-formatted historical information
- `sources`: Array of web sources with URLs and titles (grounding metadata)

**Grounding Metadata**:
```typescript
groundingMetadata.groundingChunks = [
  {
    web: {
      uri: "https://example.com/page",
      title: "Landmark History"
    }
  }
]
```

This shows where the AI got its information from, providing transparency and credibility.

#### Function 3: `generateNarration()`

**Purpose**: Converts text into natural-sounding speech

**How it works:**
```typescript
await getAI().models.generateContent({
  model: 'gemini-2.5-flash-preview-tts',  // Text-to-speech model
  contents: [{ parts: [{ text: textToNarrate }] }],
  config: {
    responseModalities: [Modality.AUDIO],  // Request audio output
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: 'Kore' },  // Voice selection
      },
    },
  },
});
```

**AI Model**: `gemini-2.5-flash-preview-tts`
- Specialized text-to-speech model
- Generates natural-sounding speech from text
- Different from regular text models

**Configuration**:
- `responseModalities: [Modality.AUDIO]` - Tells the API to return audio, not text
- `voiceName: 'Kore'` - Selects the voice personality (prebuilt voices available)

**Output**: 
- Base64-encoded audio data
- Audio format: 24kHz sample rate, mono channel

### 3. **Utility Functions (`utils/helpers.ts`)**

#### `fileToBase64(file: File)`

Converts uploaded image file to Base64 string for API transmission.

**Why Base64?**
- HTTP APIs can't send binary data directly
- Base64 encodes binary as text string
- Gemini API accepts Base64-encoded images

**Process**:
```
File (binary) → FileReader → Data URL → Extract Base64 → Return
```

#### `decode(base64: string)`

Converts Base64 string back to binary data (Uint8Array).

#### `decodeAudioData()`

Converts audio bytes into Web Audio API format for playback.

**Audio Processing**:
- Reads 16-bit integer audio samples
- Converts to floating-point (-1.0 to 1.0 range)
- Creates AudioBuffer for Web Audio API
- Handles sample rate and channel configuration

### 4. **Build Configuration (`vite.config.ts`)**

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',  // Allows access from network
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
  };
});
```

**Key Configuration Points**:

1. **Environment Variables**:
   - `loadEnv(mode, '.', '')` - Loads variables from `.env.local`
   - Vite automatically looks for `.env.local` file
   - Variables prefixed with `VITE_` are exposed to frontend
   - But we're using `define` to inject them directly

2. **Define Property**:
   - Replaces `process.env.API_KEY` in code with actual value at build time
   - JSON.stringify ensures it's treated as a string
   - These become compile-time constants

3. **Server Configuration**:
   - `host: '0.0.0.0'` - Makes dev server accessible from network (not just localhost)
   - Useful for testing on mobile devices

---

## 🤖 AI Configuration Deep Dive

### Gemini Models Used

#### 1. **gemini-2.5-flash** (Vision & Text)

**Use Cases in this app**:
- Image recognition (identifyLandmark)
- Text generation with web search (fetchLandmarkHistory)

**Capabilities**:
- ✅ Multimodal: Can process images + text together
- ✅ Fast inference: Optimized for speed
- ✅ Context understanding: Understands spatial relationships in images
- ✅ Tool calling: Can use Google Search for real-time information

**Prompt Engineering**:
```typescript
// For identification:
"Identify the primary landmark in this photo. Respond with only the name 
and city/country of the landmark. If no landmark is present, say 'Unknown'."

// Why specific?
- "Primary landmark" - Focuses on main subject
- "Only the name and city/country" - Constrains output format
- "Say 'Unknown'" - Handles edge cases explicitly
```

#### 2. **gemini-2.5-flash-preview-tts** (Text-to-Speech)

**Use Case**: Audio narration generation

**Special Features**:
- Multimodal output: Returns audio data, not text
- Voice selection: Can choose from prebuilt voices
- Natural speech: Generates human-like intonation

**Voice Options**:
- `Kore`: Used in this app (natural, conversational voice)
- Other voices available: Various personalities and accents

### API Request Flow

```
1. User Action → 2. Frontend Call → 3. Service Function → 4. Gemini API → 5. Response → 6. Frontend Update
```

**Example Flow (Identify Landmark)**:

```
1. User uploads photo.jpg
2. App.tsx calls identifyLandmark(base64, 'image/jpeg')
3. geminiService.ts builds request:
   {
     model: 'gemini-2.5-flash',
     contents: [
       { inlineData: { mimeType: 'image/jpeg', data: 'base64...' } },
       { text: 'Identify the landmark...' }
     ]
   }
4. Google Gemini API processes:
   - Analyzes image pixels
   - Understands context
   - Matches to landmarks
5. API responds:
   {
     text: "Eiffel Tower, Paris, France"
   }
6. App updates UI with landmark name
```

### Error Handling

The app handles errors at multiple levels:

1. **API Key Missing**: 
   - Checked lazily (only when AI is called)
   - Shows clear error message

2. **Landmark Not Found**:
   - AI returns "Unknown"
   - App throws user-friendly error

3. **Network/API Errors**:
   - Caught in try-catch blocks
   - Status set to `Error`
   - Error message displayed to user

---

## 🔐 Security & Configuration

### API Key Storage

**`.env.local` File**:
```
GEMINI_API_KEY=AIzaSy...
```

**Why `.env.local`?**
- ✅ Not committed to git (in `.gitignore`)
- ✅ Loaded automatically by Vite
- ✅ Keeps secrets out of codebase

**Important**: Never commit API keys to version control!

### Environment Variable Injection

Vite's `define` replaces environment variables at **build time**:

```typescript
// In your code:
const apiKey = process.env.API_KEY;

// After Vite processing:
const apiKey = "AIzaSy...";  // Actual value injected
```

This means:
- ⚠️ Values are visible in bundled JavaScript
- ✅ Fine for client-side apps
- ⚠️ Use API key restrictions in Google Cloud Console

---

## 🎨 UI/UX Features

### State-Based UI Rendering

The app uses status to show different views:

```typescript
const showUploader = status === Status.Idle;
const showError = status === Status.Error;
const showResult = !showUploader && !showError && !!imageUrl;
```

### Audio Playback

Uses Web Audio API for client-side audio processing:

```typescript
const audioContext = new AudioContext({ sampleRate: 24000 });
// Decodes base64 audio → AudioBuffer → Play through speakers
```

**Why Web Audio API?**
- Full control over playback
- Can pause/resume
- Works entirely in browser (no server needed)

### Markdown Rendering

Converts AI-generated markdown to HTML:

```typescript
landmarkInfo
  .replace(/## (.*)/g, '<h3>...</h3>')      // Headers
  .replace(/\* (.*)/g, '<li>...</li>')      // Lists
  .replace(/\n/g, '<br />')                 // Line breaks
```

**Note**: Uses `dangerouslySetInnerHTML` (React warning, but safe here since content is from trusted AI source)

---

## 📊 Data Flow Summary

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │ 1. User uploads image
       │ 2. Convert to Base64
       ▼
┌──────────────────┐
│  geminiService   │
│  (AI Interface)  │
└──────┬───────────┘
       │ 3. API Request
       ▼
┌──────────────────┐
│  Google Gemini   │
│      API         │
│                  │
│  ┌─────────────┐ │
│  │ Vision AI   │ │ ← Identify landmark
│  └─────────────┘ │
│  ┌─────────────┐ │
│  │ Search AI   │ │ ← Fetch history (with web search)
│  └─────────────┘ │
│  ┌─────────────┐ │
│  │ TTS AI      │ │ ← Generate audio
│  └─────────────┘ │
└──────┬───────────┘
       │ 4. API Response
       ▼
┌──────────────────┐
│  Browser Display │
│  Image + Text     │
│  + Audio Player   │
│  + Sources        │
└───────────────────┘
```

---

## 🚀 Performance Optimizations

1. **Lazy AI Initialization**: AI client created only when needed
2. **Memoized Components**: `React.memo` prevents unnecessary re-renders
3. **Efficient Audio Decoding**: Processes audio in chunks
4. **Status-Based Rendering**: Only renders active UI components

---

## 🛠️ Troubleshooting

### Common Issues

1. **"API key not set"**
   - Check `.env.local` exists
   - Verify key is correct
   - Restart dev server after adding key

2. **"Unknown landmark"**
   - Image may not contain a recognizable landmark
   - Try a clearer, more iconic photo

3. **Audio not playing**
   - Check browser audio permissions
   - Verify audio data was generated successfully

4. **Web search not working**
   - Ensure Google Search tool is enabled in API
   - Check API quota/billing

---

## 📚 Key Concepts Explained

### Multimodal AI
AI that can process multiple types of data (text, images, audio) together. Gemini can see an image AND understand a text prompt simultaneously.

### Grounding
When AI provides sources for its information. This app uses Google Search grounding to cite where information came from.

### Text-to-Speech (TTS)
Converting written text into spoken audio. The TTS model generates natural-sounding speech with proper intonation.

### Base64 Encoding
A way to represent binary data (like images) as text strings. Required for sending images through HTTP APIs.

---

## 🔗 Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

This documentation provides a comprehensive understanding of how the system works, from user interaction to AI processing and back to display. Each component is designed to work together seamlessly to create an intelligent photo tour guide experience.


