import { JobSubmitForm } from "../components/JobSubmitForm";
import { JobList } from "../components/JobList";
import { useJobList } from "../hooks/use-job-list";
import { retryJob, deleteJob } from "../lib/api-client";
import type { JobResponse } from "@fluximage/types";

export function HomePage() {
  const { jobs, loading, error, reload } = useJobList();

  const handleRetryJob = async (job: JobResponse) => {
    try {
      // Call the retry API endpoint to reset and requeue the existing job
      await retryJob(job.id);
      // No need to reload - Firestore real-time listener will update automatically
    } catch (error: any) {
      console.error("Failed to retry job:", error);
      // Optionally show error toast/notification
    }
  };

  const handleDeleteJob = async (job: JobResponse) => {
    try {
      // Call the delete API endpoint to remove job and processed image
      await deleteJob(job.id);
      // No need to reload - Firestore real-time listener will update automatically
    } catch (error: any) {
      console.error("Failed to delete job:", error);
      alert("Failed to delete job. Please try again.");
    }
  };

  return (
    <main className="min-h-screen mx-auto w-full max-w-3xl px-6 py-8">
      <JobSubmitForm onSuccess={reload} />

      {(jobs.length > 0 || (!loading && error)) && (
        <div className="mt-6">
          <JobList
            jobs={jobs}
            loading={loading}
            error={error}
            onRetry={reload}
            onRetryJob={handleRetryJob}
            onDeleteJob={handleDeleteJob}
          />
        </div>
      )}
    </main>
  );
}
