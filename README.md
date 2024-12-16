# WebGPU Speech Recognition with Whisper

## Overview

This project demonstrates real-time speech recognition using Transformers.js and OpenAI's Whisper model, accelerated with WebGPU. It allows users to transcribe both uploaded audio files and live microphone input directly in the browser.

## Key Features

- Real-time speech recognition using Whisper model
- Hardware-accelerated inference with WebGPU
- Support for both audio file upload and microphone input
- Multiple language support
- Timestamp options for transcriptions
- Modern React-based UI with Tailwind CSS

## Technologies Used

- WebGPU for hardware acceleration
- Transformers.js for running the Whisper model
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Vite

## Getting Started

### Prerequisites

- Node.js & npm installed
- A browser that supports WebGPU (e.g., Chrome Canary with WebGPU flags enabled)

### Installation

1. Clone the repository:

```bash
bash
git clone https://github.com/gryhkn/web-whisper-transcriber.git
cd webgpu-whisper
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## Usage

1. Open the application in your WebGPU-enabled browser
2. Click "Load Model" to initialize the Whisper model
3. Choose between:
   - Uploading an audio file
   - Using your microphone for live transcription
4. Select your desired language and timestamp options
5. Click "Transcribe" to begin speech recognition

## Browser Compatibility

This project requires WebGPU support. Currently supported in:

- Chrome Canary with WebGPU flags enabled
- Other modern browsers with experimental WebGPU features enabled

## Building for Production

To create a production build:

```bash
npm run build
```

This will generate a production build in the `dist` directory.
