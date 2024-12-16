import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface AudioUploaderProps {
  onAudioSelect: (audio: ArrayBuffer) => void;
  onProgress: (progress: number) => void;
  disabled?: boolean;
  uploadProgress: number;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ 
  onAudioSelect, 
  onProgress,
  disabled,
  uploadProgress 
}) => {
  const { toast } = useToast();
  const audioContextRef = React.useRef<AudioContext | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a valid audio file.",
      });
      return;
    }

    try {
      onProgress(0);
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      reader.onload = async () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        onAudioSelect(audioBuffer.getChannelData(0));
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while processing the audio file.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="audio">Upload Audio File</Label>
        <input
          id="audio"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('audio')?.click()}
          disabled={disabled}
          className="w-full"
        >
          Choose File
        </Button>
      </div>
      
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Uploading file...</div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        Supported formats: MP3, WAV, M4A, AAC
      </p>
    </div>
  );
};