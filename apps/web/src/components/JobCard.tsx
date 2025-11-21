import React from "react";
import type { JobResponse } from "@fluximage/types";
import { JobStatus } from "@fluximage/types";

interface JobCardProps {
  job: JobResponse;
  onRetry?: (job: JobResponse) => void;
  onDelete?: (job: JobResponse) => void;
}

function StatusBadge({ status }: { status: JobStatus }) {
  const statusConfig = {
    [JobStatus.PENDING]: {
      label: "Pending",
      className: "badge-pending",
      icon: (
        <svg
          className="w-3 h-3"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    [JobStatus.PROCESSING]: {
      label: "Processing",
      className: "badge-processing",
      icon: (
        <svg
          className="w-3 h-3 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ),
    },
    [JobStatus.COMPLETED]: {
      label: "Completed",
      className: "badge-completed",
      icon: (
        <svg
          className="w-3 h-3"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    [JobStatus.FAILED]: {
      label: "Failed",
      className: "badge-failed",
      icon: (
        <svg
          className="w-3 h-3"
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
      ),
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={config.className}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function ImageModal({
  url,
  alt,
  onClose,
}: {
  url: string;
  alt: string;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
        aria-label="Close preview"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <img
        src={url}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function JobCard({ job, onRetry, onDelete }: JobCardProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [modalImage, setModalImage] = React.useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;

    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const getUserFriendlyError = (error: string): string => {
    if (error.includes("exceeds maximum allowed size")) {
      const sizeMatch = error.match(/(\d+\.\d+)MB/);
      const size = sizeMatch ? sizeMatch[1] : "Unknown";
      return `📦 File too large (${size}MB). Maximum size is 10MB.`;
    }
    if (error.includes("Invalid image format")) {
      return "🖼️ Invalid image format. Please use JPG, PNG, GIF, or WebP.";
    }
    if (error.includes("maxContentLength")) {
      return "📦 File too large. Maximum size is 10MB.";
    }
    if (error.includes("timeout")) {
      return "⏱️ Request timed out. The image may be too large or server is slow.";
    }
    if (error.includes("Network error") || error.includes("ENOTFOUND")) {
      return "🌐 Network error. Could not download the image.";
    }
    if (error.includes("URL is not reachable") || error.includes("404")) {
      return "🔗 Image URL not accessible. Please check the link.";
    }
    if (error.includes("ECONNREFUSED")) {
      return "⚠️ Cannot connect to image server.";
    }

    return error;
  };

  const openModal = (url: string, alt: string) => {
    setModalImage({ url, alt });
    setShowModal(true);
  };

  return (
    <>
      <article
        className="card p-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
        aria-labelledby={`job-title-${job.id}`}
      >
        <div className="flex flex-col gap-4 h-full">
          {/* Image Preview */}
          <button
            onClick={() => openModal(job.inputUrl, "Input image")}
            className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
            aria-label="Preview input image"
          >
            {onDelete &&
              (job.status === JobStatus.COMPLETED ||
                job.status === JobStatus.FAILED) && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        "Are you sure you want to delete this job? This will also remove any processed images."
                      )
                    ) {
                      setIsDeleting(true);
                      try {
                        await onDelete(job);
                      } catch (error) {
                        console.error("Failed to delete job:", error);
                      } finally {
                        setIsDeleting(false);
                      }
                    }
                  }}
                  disabled={isDeleting}
                  className="absolute top-2 right-2 z-10 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Delete job"
                  title="Delete job"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            <img
              src={job.inputUrl}
              alt="Input thumbnail"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </button>

          {/* Status and Time */}
          <div className="flex items-center justify-between">
            <StatusBadge status={job.status} />
            <time
              className="text-xs font-medium text-[hsl(var(--color-text-secondary))]"
              dateTime={job.createdAt}
            >
              {formatDate(job.createdAt)}
            </time>
          </div>

          {/* Transformation Settings */}
          {job.transformations &&
            Object.keys(job.transformations).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.transformations.width && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg">
                    {job.transformations.width}×
                    {job.transformations.height || job.transformations.width}
                  </span>
                )}
                {job.transformations.grayscale && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                    Grayscale
                  </span>
                )}
                {job.transformations.blur && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs font-medium rounded-lg">
                    Blur {job.transformations.blur}
                  </span>
                )}
                {job.transformations.sharpen && (
                  <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-lg">
                    Sharpen
                  </span>
                )}
                {job.transformations.rotate && (
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg">
                    Rotate {job.transformations.rotate}°
                  </span>
                )}
                {job.transformations.flip && (
                  <span className="px-2 py-1 bg-teal-50 text-teal-600 text-xs font-medium rounded-lg">
                    Flip
                  </span>
                )}
                {job.transformations.flop && (
                  <span className="px-2 py-1 bg-cyan-50 text-cyan-600 text-xs font-medium rounded-lg">
                    Flop
                  </span>
                )}
              </div>
            )}

          <div className="flex-1"></div>

          {/* Progress Bar for Processing */}
          {job.status === JobStatus.PROCESSING && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-600">Processing</span>
                <span className="text-blue-500">{job.progress}%</span>
              </div>
              <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Pending Progress Bar */}
          {job.status === JobStatus.PENDING && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-yellow-600">Queued</span>
                <span className="text-yellow-500">{job.progress}%</span>
              </div>
              <div className="h-1.5 bg-yellow-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {job.error && job.status === JobStatus.FAILED && (
            <>
              <div
                className="p-3 bg-red-50 border border-red-100 rounded-xl"
                role="alert"
              >
                <p className="text-xs font-semibold text-red-600 mb-1">
                  Failed
                </p>
                <p className="text-xs text-red-500 line-clamp-2">
                  {getUserFriendlyError(job.error)}
                </p>
              </div>
              {/* Retry Button */}
              {onRetry && (
                <button
                  onClick={() => onRetry(job)}
                  className="w-full px-3 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-xs font-semibold hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                  aria-label="Retry failed job"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry Job
                </button>
              )}
            </>
          )}

          {/* Actions for Completed */}
          {job.outputUrl && job.status === JobStatus.COMPLETED && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openModal(job.outputUrl!, "Processed image")}
                  className="px-3 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-xs font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                  aria-label="Preview result"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Preview
                </button>
                <a
                  href={job.outputUrl}
                  download
                  className="px-3 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl text-xs font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                  aria-label="Download processed image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </a>
              </div>
            </>
          )}
        </div>
      </article>

      {showModal && modalImage && (
        <ImageModal
          url={modalImage.url}
          alt={modalImage.alt}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
