import { JobResponse } from '@fluximage/types';
import { getFirestore } from '../lib/firestore-client';

export const getJobById = async (id: string): Promise<JobResponse | null> => {
  const db = getFirestore();
  const doc = await db.collection('jobs').doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as JobResponse;
};
