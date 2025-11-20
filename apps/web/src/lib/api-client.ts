import type {
  CreateJobInput,
  JobListResponse,
  JobResponse,
} from "@fluximage/types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(
        json.message || json.error || `Request failed: ${res.status}`
      );
    } catch (e: any) {
      throw new Error(text || `Request failed: ${res.status}`);
    }
  }
  return res.json();
}

export async function createJob(input: CreateJobInput): Promise<JobResponse> {
  const res = await fetch(`${API_BASE}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse<JobResponse>(res);
}

export async function getJob(id: string): Promise<JobResponse> {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`);
  return handleResponse<JobResponse>(res);
}

export async function listJobs(): Promise<JobListResponse> {
  const res = await fetch(`${API_BASE}/api/jobs`);
  return handleResponse<JobListResponse>(res);
}
