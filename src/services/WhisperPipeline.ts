import {
  AutoTokenizer,
  AutoProcessor,
  WhisperForConditionalGeneration,
  full,
} from '@huggingface/transformers';

export class WhisperPipeline {
  private static instance: WhisperPipeline;
  private model_id = 'onnx-community/whisper-base';
  private tokenizer: any = null;
  private processor: any = null;
  private model: any = null;

  private constructor() {}

  static async getInstance(progress_callback?: (progress: any) => void): Promise<WhisperPipeline> {
    if (!this.instance) {
      this.instance = new WhisperPipeline();
      await this.instance.initialize(progress_callback);
    }
    return this.instance;
  }

  private async initialize(progress_callback?: (progress: any) => void) {
    this.tokenizer = await AutoTokenizer.from_pretrained(this.model_id, {
      progress_callback,
    });
    
    this.processor = await AutoProcessor.from_pretrained(this.model_id, {
      progress_callback,
    });

    this.model = await WhisperForConditionalGeneration.from_pretrained(this.model_id, {
      dtype: {
        encoder_model: 'fp32',
        decoder_model_merged: 'q4',
      },
      device: 'webgpu',
      progress_callback,
    });
  }

  async warmup() {
    await this.model.generate({
      input_features: full([1, 80, 3000], 0.0),
      max_new_tokens: 1,
    });
  }

  getTokenizer() {
    return this.tokenizer;
  }

  getProcessor() {
    return this.processor;
  }

  getModel() {
    return this.model;
  }
}