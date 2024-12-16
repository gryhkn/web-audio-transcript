import { useEffect, useRef } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  mimeType: string;
}

export default function AudioPlayer({ audioUrl, mimeType }: AudioPlayerProps) {
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const audioSource = useRef<HTMLSourceElement>(null);

  useEffect(() => {
    if (audioPlayer.current && audioSource.current) {
      audioSource.current.src = audioUrl;
      audioPlayer.current.load();
    }
  }, [audioUrl]);

  return (
    <div className="flex relative z-10 p-4 w-full mt-4">
      <audio
        ref={audioPlayer}
        controls
        className="w-full h-14 rounded-lg bg-white shadow-xl shadow-black/5 ring-1 ring-slate-700/10"
      >
        <source ref={audioSource} type={mimeType}></source>
      </audio>
    </div>
  );
}
