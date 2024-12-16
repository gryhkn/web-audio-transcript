import { TextStreamer } from "@huggingface/transformers";
import { WhisperPipeline } from "./services/WhisperPipeline";
import { cleanTranscriptionOutput } from "./utils/transcriptionUtils";

let processing = false;
const MAX_CHUNK_DURATION = 30; // saniye cinsinden maksimum chunk süresi

async function splitAudioIntoChunks(audio, chunkDuration) {
  const chunks = [];
  const samplesPerChunk = chunkDuration * 16000; // 16kHz sampling rate

  for (let i = 0; i < audio.length; i += samplesPerChunk) {
    chunks.push(audio.slice(i, i + samplesPerChunk));
  }

  return chunks;
}

async function generate({ audio, language, timestamps = false }) {
  if (processing) return;
  processing = true;

  try {
    self.postMessage({ status: "start" });

    const pipeline = await WhisperPipeline.getInstance();
    const tokenizer = pipeline.getTokenizer();
    const processor = pipeline.getProcessor();
    const model = pipeline.getModel();

    // Ses dosyasını chunklara böl
    const audioChunks = await splitAudioIntoChunks(audio, MAX_CHUNK_DURATION);
    let completeTranscription = "";
    let totalChunks = audioChunks.length;

    for (let i = 0; i < audioChunks.length; i++) {
      let startTime = performance.now();
      let numTokens = 0;

      const callback_function = (output) => {
        startTime ??= performance.now();
        let tps;
        if (numTokens++ > 0) {
          tps = (numTokens / (performance.now() - startTime)) * 1000;
        }

        if (output && typeof output === "string") {
          self.postMessage({
            status: "update",
            output: cleanTranscriptionOutput(output),
            tps,
            numTokens,
            progress: ((i + 1) / totalChunks) * 100,
          });
        }
      };

      const streamer = new TextStreamer(tokenizer, {
        skip_prompt: true,
        callback_function,
      });

      const inputs = await processor(audioChunks[i], {
        sampling_rate: 16000,
        return_tensors: "pt",
      });

      if (!inputs || !inputs.input_features) {
        throw new Error(`Failed to process audio chunk ${i + 1}`);
      }

      const outputs = await model.generate({
        ...inputs,
        language,
        return_timestamps: timestamps,
        streamer,
      });

      const chunkText = tokenizer.batch_decode(outputs);
      completeTranscription += chunkText + " ";

      // Her chunk sonrası ilerleme durumunu bildir
      self.postMessage({
        status: "progress",
        progress: ((i + 1) / totalChunks) * 100,
        currentChunk: i + 1,
        totalChunks,
      });
    }

    self.postMessage({
      status: "complete",
      output: cleanTranscriptionOutput(completeTranscription),
    });
  } catch (error) {
    self.postMessage({
      status: "error",
      error: error.message,
    });
    console.error("Transcription error:", error);
  } finally {
    processing = false;
  }
}

async function load() {
  try {
    self.postMessage({
      status: "loading",
      data: "Model loading...",
    });

    const pipeline = await WhisperPipeline.getInstance((x) => {
      self.postMessage(x);
    });

    self.postMessage({
      status: "loading",
      data: "Compiling shaders and preparing model...",
    });

    await pipeline.warmup();

    self.postMessage({ status: "ready" });
  } catch (error) {
    self.postMessage({
      status: "error",
      error: error.message,
    });
    console.error("Model loading error:", error);
  }
}

self.addEventListener("message", async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case "load":
      load();
      break;

    case "generate":
      generate(data);
      break;
  }
});
