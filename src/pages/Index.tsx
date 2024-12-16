import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Progress from "../components/Progress";
import { TranscriptionInterface } from "../components/TranscriptionInterface";
import { useToast } from "@/components/ui/use-toast";

const IS_WEBGPU_AVAILABLE = !!(navigator as Navigator).gpu;
const WHISPER_SAMPLING_RATE = 16000;

const Index = () => {
  const { toast } = useToast();
  const worker = useRef<Worker | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressItems, setProgressItems] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [tps, setTps] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL("../worker.ts", import.meta.url), {
        type: "module",
      });
    }

    const onMessageReceived = (e: MessageEvent) => {
      switch (e.data.status) {
        case "loading":
          setStatus("loading");
          setLoadingMessage(e.data.data);
          break;

        case "initiate":
          setProgressItems((prev) => [...prev, e.data]);
          break;

        case "progress":
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, ...e.data };
              }
              return item;
            })
          );
          break;

        case "done":
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file)
          );
          break;

        case "ready":
          setStatus("ready");
          toast({
            title: "Model loaded successfully",
            description: "You can now upload audio files for transcription.",
          });
          break;

        case "start":
          setIsProcessing(true);
          setText("");
          break;

        case "update":
          const { output, tps, progress } = e.data;
          setTps(tps);
          setText(output);
          break;

        case "complete":
          setIsProcessing(false);
          setText(e.data.output);
          setTps(null);
          break;

        case "error":
          setIsProcessing(false);
          toast({
            variant: "destructive",
            title: "Error",
            description: e.data.error,
          });
          break;
      }
    };

    worker.current.addEventListener("message", onMessageReceived);

    return () => {
      worker.current?.removeEventListener("message", onMessageReceived);
    };
  }, []);

  useEffect(() => {
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setStream(stream);
        })
        .catch((err) => {
          console.error("Error accessing microphone:", err);
          toast({
            variant: "destructive",
            title: "Microphone Error",
            description:
              "Unable to access the microphone. Please check permissions.",
          });
        });
    }
  }, []);

  if (!IS_WEBGPU_AVAILABLE) {
    return (
      <div className="fixed w-screen h-screen bg-background z-10 text-foreground text-2xl font-semibold flex justify-center items-center text-center">
        WebGPU is not supported by this browser
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Speech Recognition</h1>
          <p className="text-xl text-muted-foreground">
            {status === null ? "Load the model to get started" : loadingMessage}
          </p>
        </div>

        {status === null && (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-center max-w-lg text-muted-foreground">
              You are about to load a 73 million parameter speech recognition
              model. The model (~200 MB) will be cached for future use.
            </p>
            <Button
              onClick={() => {
                worker.current!.postMessage({ type: "load" });
                setStatus("loading");
              }}
              disabled={status !== null}
            >
              Load Model
            </Button>
          </div>
        )}

        {status === "loading" && (
          <div className="space-y-4">
            {progressItems.map(({ file, progress, total }, i) => (
              <Progress
                key={i}
                text={file}
                percentage={progress}
                total={total}
              />
            ))}
          </div>
        )}

        {status === "ready" && worker.current && (
          <TranscriptionInterface
            worker={worker.current}
            stream={stream}
            isProcessing={isProcessing}
            text={text}
            tps={tps}
            onReset={() => {
              setText("");
              setTps(null);
            }}
            fileName=""
          />
        )}
      </div>
    </div>
  );
};

export default Index;
