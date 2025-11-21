import { JobStatus } from '@fluximage/types';
import { getFirestore } from '../lib/firestore-client';
import { formatDate } from '@fluximage/utils';

export const completeJob = async (jobId: string, outputUrl: string): Promise<void> => {
  const db = getFirestore();

  await db.collection('jobs').doc(jobId).update({
    status: JobStatus.COMPLETED,
    progress: 100,
    outputUrl,
    processedAt: formatDate(new Date()),
    updatedAt: formatDate(new Date()),
  });
};
