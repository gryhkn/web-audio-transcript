import { TextStreamer } from "@huggingface/transformers";
import { WhisperPipeline } from "./services/WhisperPipeline";
import {
  cleanTranscriptionOutput,
  MAX_NEW_TOKENS,
} from "./utils/transcriptionUtils";

let processing = false;

async function generate({ audio, language, timestamps = false }) {
  if (processing) return;
  processing = true;

  try {
    self.postMessage({ status: "start" });

    const pipeline = await WhisperPipeline.getInstance();
    const tokenizer = pipeline.getTokenizer();
    const processor = pipeline.getProcessor();
    const model = pipeline.getModel();

    let startTime;
    let numTokens = 0;

    const callback_function = (output: any) => {
      startTime ??= performance.now();

      let tps;
      if (numTokens++ > 0) {
        tps = (numTokens / (performance.now() - startTime)) * 1000;
      }

      if (output && typeof output === "string") {
        const progress = (numTokens / MAX_NEW_TOKENS) * 100;
        self.postMessage({
          status: "update",
          output: cleanTranscriptionOutput(output),
          tps,
          numTokens,
          progress: Math.min(progress, 100),
        });
      }
    };

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      callback_function,
    });

    const inputs = await processor(audio, {
      sampling_rate: 16000,
      return_tensors: "pt",
    });

    if (!inputs || !inputs.input_features) {
      throw new Error("Failed to process audio input");
    }

    const outputs = await model.generate({
      ...inputs,
      max_new_tokens: MAX_NEW_TOKENS,
      language,
      return_timestamps: timestamps,
      streamer,
    });

    const outputText = tokenizer.batch_decode(outputs);

    self.postMessage({
      status: "complete",
      output: cleanTranscriptionOutput(outputText),
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
