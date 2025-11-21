export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  grayscale?: boolean;
  blur?: number;
  sharpen?: boolean;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  quality?: number;
}

export interface Job {
  id: string;
  inputUrl: string;
  outputUrl?: string;
  status: JobStatus;
  progress: number; // 0-100
  error?: string;
  transformations?: TransformationOptions;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface CreateJobInput {
  inputUrl: string;
  transformations?: TransformationOptions;
}

export interface JobResponse {
  id: string;
  status: JobStatus;
  inputUrl: string;
  outputUrl?: string;
  progress: number; // 0-100
  error?: string;
  transformations?: TransformationOptions;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface JobListResponse {
  jobs: JobResponse[];
  total: number;
}
