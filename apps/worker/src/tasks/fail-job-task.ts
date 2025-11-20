import { JobStatus } from '@fluximage/types';
import { getFirestore } from '../lib/firestore-client';
import { formatDate } from '@fluximage/utils';

export const failJob = async (jobId: string, error: string): Promise<void> => {
  const db = getFirestore();

  await db.collection('jobs').doc(jobId).update({
    status: JobStatus.FAILED,
    error,
    updatedAt: formatDate(new Date()),
  });
};
