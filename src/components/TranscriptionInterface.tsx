import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "./LanguageSelector";
import { useToast } from "@/components/ui/use-toast";
import { IconUpload } from "@/components/ui/icons";
import { TranscriptionOptions } from "./TranscriptionOptions";
// Yeni import:
import AudioPlayer from "./AudioPlayer";

interface TranscriptionInterfaceProps {
  worker: Worker;
  stream: MediaStream | null;
  isProcessing: boolean;
  text: string;
  tps: number | null;
  onReset: () => void;
  fileName?: string;
}

async function readAudioFile(file: File): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const offlineContext = new OfflineAudioContext({
    numberOfChannels: 1,
    length: Math.ceil(audioBuffer.duration * 16000),
    sampleRate: 16000,
  });
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start();
  const renderedBuffer = await offlineContext.startRendering();
  return renderedBuffer.getChannelData(0);
}

export function TranscriptionInterface({
  worker,
  stream,
  isProcessing,
  text,
  tps,
  onReset,
  fileName,
}: TranscriptionInterfaceProps) {
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [language, setLanguage] = useState("en");
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [preparedAudioData, setPreparedAudioData] =
    useState<Float32Array | null>(null);

  const handleTranscribe = () => {
    try {
      if (!preparedAudioData) {
        setError("Please select an audio file first");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select an audio file first.",
        });
        return;
      }
      setError(null);

      worker.postMessage({
        type: "generate",
        data: {
          audio: preparedAudioData,
          language,
          timestamps: showTimestamps,
        },
      });
    } catch (err) {
      setError("An error occurred while transcribing");
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while transcribing.",
      });
    }
  };

  const handleReset = () => {
    onReset();
    setUploadProgress(0);
    setSelectedAudio(null);
    setPreparedAudioData(null);
    setError(null);
  };

  return (
    <div className="w-full space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <input
            type="file"
            id="audio-upload"
            className="hidden"
            accept="audio/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  setSelectedAudio(file);
                  setUploadProgress(50);
                  const audioData = await readAudioFile(file);
                  setPreparedAudioData(audioData);
                  setUploadProgress(100);
                } catch (err) {
                  setError(
                    "Error processing audio file. Please try another file."
                  );
                  setUploadProgress(0);
                  setSelectedAudio(null);
                  setPreparedAudioData(null);
                }
              }
            }}
          />
          <Button
            variant="default"
            size="lg"
            onClick={() => document.getElementById("audio-upload")?.click()}
            className="px-8"
            disabled={isProcessing}
          >
            <IconUpload className="mr-2 h-4 w-4" /> Choose files
          </Button>
          <p className="text-sm text-muted-foreground">
            or drag and drop your file here
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supported Formats: WAV, MP3, M4A, CAF, AIFF, AVI, RMVB, FLV, MP4,
            MOV, WMV
          </p>
          <p className="text-sm text-muted-foreground">
            Max size: 1GB; Max duration: 5 hours
          </p>
        </div>
      </div>

      {(uploadProgress > 0 || text || isProcessing) && (
        <div className="border rounded-lg p-6 space-y-4">
          {selectedAudio && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {selectedAudio.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isProcessing}
              >
                Change file
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Processing audio...</span>
              </div>
              {tps && (
                <p className="text-sm text-muted-foreground">
                  Processing speed: {tps.toFixed(2)} tokens/second
                </p>
              )}
            </div>
          )}

          {text && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Transcription Result:</h3>
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                {text}
              </div>
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm flex items-center space-x-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Yüklenen ses dosyası hazırsa AudioPlayer göster */}
      {selectedAudio && preparedAudioData && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Audio Player:</h3>
          <AudioPlayer
            audioUrl={URL.createObjectURL(selectedAudio)}
            mimeType={selectedAudio.type}
          />
        </div>
      )}

      {selectedAudio && !isProcessing && !text && uploadProgress === 100 && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-sm">Transcription Options</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <LanguageSelector
                  value={language}
                  onChange={setLanguage}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex items-center justify-end">
                <TranscriptionOptions
                  showTimestamps={showTimestamps}
                  onTimestampChange={setShowTimestamps}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            <Button onClick={handleTranscribe}>Start Transcription</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function IconUpload({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
