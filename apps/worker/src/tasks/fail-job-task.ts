import { JobStatus } from "@fluximage/types";
import { getFirestore } from "../lib/firestore-client";
import { formatDate } from "@fluximage/utils";

export const failJob = async (jobId: string, error: string): Promise<void> => {
  const db = getFirestore();

  await db
    .collection("jobs")
    .doc(jobId)
    .update({
      status: JobStatus.FAILED,
      progress: 100, // Job processing is complete even if it failed
      error,
      updatedAt: formatDate(new Date()),
    });
};
