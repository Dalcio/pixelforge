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
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to submit job. Please try again.";
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
