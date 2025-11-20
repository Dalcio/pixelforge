import { JobSubmitForm } from "../components/JobSubmitForm";
import { JobList } from "../components/JobList";
import { useJobList } from "../hooks/use-job-list";

export function HomePage() {
  const { jobs, loading, error, reload } = useJobList();

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
          />
        </div>
      )}
    </main>
  );
}
