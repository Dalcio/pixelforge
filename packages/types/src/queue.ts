import type { TransformationOptions } from "./job";

export interface QueueJob {
  jobId: string;
  inputUrl: string;
  transformations?: TransformationOptions;
}

export interface ProcessingResult {
  success: boolean;
  outputUrl?: string;
  error?: string;
}
