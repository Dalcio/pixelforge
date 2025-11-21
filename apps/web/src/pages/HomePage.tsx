import { JobSubmitForm } from "../components/JobSubmitForm";
import { JobList } from "../components/JobList";
import { useJobList } from "../hooks/use-job-list";
import { useJobSubmission } from "../hooks/use-job-submission";
import type { JobResponse } from "@fluximage/types";

export function HomePage() {
  const { jobs, loading, error, reload } = useJobList();
  const { submit } = useJobSubmission(reload);

  const handleRetryJob = async (job: JobResponse) => {
    // Create a new job with the same parameters as the failed job
    await submit(job.inputUrl, job.transformations);
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
          />
        </div>
      )}
    </main>
  );
}
