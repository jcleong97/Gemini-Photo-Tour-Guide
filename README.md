<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🌍 Gemini Photo Tour Guide

An AI-powered web application that identifies landmarks from photos and provides historical information with audio narration using Google's Gemini AI.

## 🎯 What It Does

Upload a photo of any famous landmark, and the app will:

1. **Identify the Landmark** - Uses Gemini's vision AI to recognize the landmark in your photo
2. **Research History** - Fetches detailed historical information using Google Search
3. **Generate Audio Guide** - Creates a natural-sounding audio narration
4. **Show Sources** - Displays web sources where the information came from

### Features

- 📸 Image upload with drag-and-drop
- 🔍 AI-powered landmark recognition
- 📚 Historical information with citations
- 🎙️ Text-to-speech audio narration
- 🎨 Beautiful, modern UI with smooth animations
- 🔗 Source links for verification

---

**View your app in AI Studio:** https://ai.studio/apps/drive/1Yqf2L6vr92VhlkGzDHTlGdwWveYO3Ce6

## Run Locally

**Prerequisites:** Node.js (v18 or higher)

### Step-by-Step Setup:

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file** in the project root:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```
   
   Or manually create `.env.local` with:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   
   **Get your API key from:** https://aistudio.google.com/apikey

4. **Run the app:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

### Quick Start (If Node.js is already installed):
```bash
npm install
# Create .env.local file with your GEMINI_API_KEY
npm run dev
```

## 📖 Documentation

For detailed technical documentation explaining:
- How the system works
- Code architecture and structure
- AI configuration and models
- API usage and data flow

👉 **[Read the Technical Documentation](./TECHNICAL_DOCUMENTATION.md)**

## 🛠️ Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Google Gemini AI** - Vision, text generation, and TTS
- **Tailwind CSS** - Styling
- **Web Audio API** - Audio playback

## 📝 How It Works

1. User uploads a photo → Image converted to Base64
2. **Gemini Vision AI** (`gemini-2.5-flash`) identifies the landmark
3. **Gemini with Google Search** fetches historical information
4. **Gemini TTS** (`gemini-2.5-flash-preview-tts`) generates audio narration
5. Results displayed with image, text, audio player, and source links

See [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) for in-depth explanations.
