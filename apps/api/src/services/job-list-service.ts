import { JobListResponse } from '@fluximage/types';
import { getFirestore } from '../lib/firestore-client';

export const getAllJobs = async (): Promise<JobListResponse> => {
  const db = getFirestore();
  const snapshot = await db.collection('jobs')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  const jobs = snapshot.docs.map(doc => doc.data() as JobListResponse['jobs'][number]);

  return {
    jobs,
    total: jobs.length,
  };
};
