import { useState, useCallback } from "react";
import { createJob } from "../lib/api-client";
import type { JobResponse, TransformationOptions } from "@fluximage/types";

interface UseJobSubmissionReturn {
  submit: (
    url: string,
    transformations?: TransformationOptions
  ) => Promise<JobResponse | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useJobSubmission(
  onSuccess?: (job: JobResponse) => void
): UseJobSubmissionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (
      url: string,
      transformations?: TransformationOptions
    ): Promise<JobResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const job = await createJob({ inputUrl: url, transformations });
        if (onSuccess) {
          onSuccess(job);
        }
        return job;
      } catch (err: unknown) {
        let errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to submit job. Please try again.";

        // Enhance specific error messages for better UX
        if (errorMessage.includes("exceeds maximum allowed size")) {
          // Extract file size if available
          const sizeMatch = errorMessage.match(/(\d+\.\d+)MB/);
          const size = sizeMatch ? sizeMatch[1] : "Unknown";
          errorMessage = `📦 File too large (${size}MB). Maximum allowed size is 10MB.`;
        } else if (errorMessage.includes("Invalid image format")) {
          errorMessage =
            "🖼️ Invalid image format. Please use JPG, PNG, GIF, or WebP.";
        } else if (errorMessage.includes("URL is not reachable")) {
          errorMessage =
            "🔗 Image URL is not accessible. Please check the URL and try again.";
        } else if (errorMessage.includes("timeout")) {
          errorMessage =
            "⏱️ Request timed out. The image may be too large or the server is slow.";
        } else if (errorMessage.includes("Network error")) {
          errorMessage =
            "🌐 Network error. Please check your connection and try again.";
        }

        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { submit, loading, error, clearError };
}
