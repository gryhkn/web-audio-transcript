interface GPU {
  requestAdapter(): Promise<GPUAdapter | null>;
}

interface Navigator {
  gpu?: GPU;
}