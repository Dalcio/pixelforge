import { useEffect, useState, useCallback } from "react";
import type { JobResponse } from "@fluximage/types";
import { subscribeToJobs } from "../lib/firestore-client";

interface UseJobListReturn {
  jobs: JobResponse[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  clearError: () => void;
}

export function useJobList(): UseJobListReturn {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToJobs(
      (updatedJobs) => {
        setJobs(updatedJobs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        const errorMessage = err.message || "Failed to load jobs";
        setError(errorMessage);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return { jobs, loading, error, reload, clearError };
}
