import { JobStatus, TransformationOptions } from "@fluximage/types";
import { getFirestore } from "../lib/firestore-client";
import { formatDate } from "@fluximage/utils";

export const createJobDocument = async (
  id: string,
  inputUrl: string,
  transformations?: TransformationOptions
): Promise<void> => {
  const db = getFirestore();

  const jobData = {
    id,
    inputUrl,
    status: JobStatus.PENDING,
    transformations: transformations || null,
    createdAt: formatDate(new Date()),
    updatedAt: formatDate(new Date()),
  };

  await db.collection("jobs").doc(id).set(jobData);
};
