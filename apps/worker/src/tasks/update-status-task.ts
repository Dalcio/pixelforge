import { JobStatus } from '@fluximage/types';
import { getFirestore } from '../lib/firestore-client';
import { formatDate } from '@fluximage/utils';

export const updateJobStatus = async (jobId: string, status: JobStatus): Promise<void> => {
  const db = getFirestore();

  await db.collection('jobs').doc(jobId).update({
    status,
    updatedAt: formatDate(new Date()),
  });
};

export const updateJobProgress = async (jobId: string, progress: number): Promise<void> => {
  const db = getFirestore();

  await db.collection('jobs').doc(jobId).update({
    progress,
    updatedAt: formatDate(new Date()),
  });
};
