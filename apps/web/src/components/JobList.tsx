import type { JobResponse } from "@fluximage/types";
import { JobCard } from "./JobCard";

interface JobListProps {
  jobs: JobResponse[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onRetryJob?: (job: JobResponse) => void;
  onDeleteJob?: (job: JobResponse) => void;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <svg
        className="w-16 h-16 text-[hsl(var(--color-text-secondary))] mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-[hsl(var(--color-text))] mb-1">
        No jobs yet
      </h3>
      <p className="text-sm text-[hsl(var(--color-text-secondary))]">
        Submit an image URL above to get started
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5 animate-pulse" aria-hidden="true">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[hsl(var(--color-surface-elevated))] rounded w-32" />
                <div className="h-2 bg-[hsl(var(--color-surface-elevated))] rounded w-20" />
              </div>
              <div className="h-5 bg-[hsl(var(--color-surface-elevated))] rounded-full w-20" />
            </div>
            <div className="aspect-video bg-[hsl(var(--color-surface-elevated))] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-[hsl(var(--color-error))]/10 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-[hsl(var(--color-error))]"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[hsl(var(--color-text))] mb-1">
        Could not load jobs
      </h3>
      <p className="text-sm text-[hsl(var(--color-text-secondary))] mb-4">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="btn-secondary"
        aria-label="Retry loading jobs"
      >
        Try Again
      </button>
    </div>
  );
}

export function JobList({
  jobs,
  loading,
  error,
  onRetry,
  onRetryJob,
  onDeleteJob,
}: JobListProps) {
  if (loading && jobs.length === 0) {
    return (
      <section aria-label="Loading jobs">
        <LoadingSkeleton />
      </section>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (jobs.length === 0) {
    return <EmptyState />;
  }

  return (
    <section aria-label="Job list" className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[hsl(var(--color-text))]">
          Recent Jobs
          <span className="ml-3 text-sm font-normal text-[hsl(var(--color-text-secondary))]">
            ({jobs.length})
          </span>
        </h2>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--color-primary))] hover:bg-blue-50 focus-ring rounded-xl transition-colors"
          aria-label="Refresh job list"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onRetry={onRetryJob}
            onDelete={onDeleteJob}
          />
        ))}
      </div>
    </section>
  );
}
