import type {
  CreateJobInput,
  JobListResponse,
  JobResponse,
} from "@fluximage/types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `Request failed: ${res.status}`;

    try {
      const json = JSON.parse(text);
      errorMessage = json.message || json.error || errorMessage;
    } catch {
      if (text) {
        errorMessage = text;
      }
    }

    if (res.status === 503) {
      throw new Error(
        errorMessage.includes("Queue system")
          ? "⚠️ Service temporarily unavailable. Please try again in a moment."
          : "⚠️ Service temporarily unavailable. Please try again later."
      );
    } else if (res.status === 400) {
      throw new Error(errorMessage);
    } else if (res.status === 404) {
      throw new Error("🔍 Resource not found.");
    } else if (res.status === 429) {
      throw new Error("⏱️ Too many requests. Please slow down.");
    } else if (res.status >= 500) {
      throw new Error(
        "❌ Server error occurred. Please try again or contact support if the issue persists."
      );
    }

    throw new Error(errorMessage);
  }
  return res.json();
}

export async function createJob(input: CreateJobInput): Promise<JobResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse<JobResponse>(res);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("Failed to fetch") || error.name === "TypeError")
    ) {
      throw new Error(
        "🌐 Cannot connect to server. Please check your internet connection."
      );
    }
    throw error;
  }
}

export async function getJob(id: string): Promise<JobResponse> {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`);
  return handleResponse<JobResponse>(res);
}

export async function listJobs(): Promise<JobListResponse> {
  const res = await fetch(`${API_BASE}/api/jobs`);
  return handleResponse<JobListResponse>(res);
}

export async function retryJob(id: string): Promise<JobResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/jobs/${id}/retry`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<JobResponse>(res);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("Failed to fetch") || error.name === "TypeError")
    ) {
      throw new Error(
        "🌐 Cannot connect to server. Please check your internet connection."
      );
    }
    throw error;
  }
}

export async function deleteJob(
  id: string
): Promise<{ success: boolean; message: string; id: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
      method: "DELETE",
    });
    return handleResponse<{ success: boolean; message: string; id: string }>(
      res
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("Failed to fetch") || error.name === "TypeError")
    ) {
      throw new Error(
        "🌐 Cannot connect to server. Please check your internet connection."
      );
    }
    throw error;
  }
}
