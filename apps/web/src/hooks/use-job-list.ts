import { useEffect, useState, useCallback, useRef } from "react";
import type { JobResponse } from "@fluximage/types";
import { listJobs } from "../lib/api-client";

interface UseJobListReturn {
  jobs: JobResponse[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  clearError: () => void;
}

export function useJobList(refreshMs = 5000): UseJobListReturn {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const load = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);

        const data = await listJobs();

        // Sort by createdAt desc
        const sortedJobs = data.jobs.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setJobs(sortedJobs);
        setHasLoadedOnce(true);
      } catch (err: any) {
        // Only show error if we've successfully loaded before
        if (hasLoadedOnce) {
          const errorMessage = err.message || "Failed to load jobs";
          console.error("Failed to load jobs:", err);
          setError(errorMessage);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [hasLoadedOnce]
  );

  const reload = useCallback(async () => {
    await load(false);
  }, [load]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    load(false);

    const id = setInterval(() => {
      load(true);
    }, refreshMs);
    intervalRef.current = id;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [load, refreshMs]);

  return { jobs, loading, error, reload, clearError };
}
