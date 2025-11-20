import { getFirestore, collection, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import type { JobResponse } from '@fluximage/types';

export interface FirestoreJob {
  id: string;
  inputUrl: string;
  outputUrl?: string;
  status: string;
  error?: string;
  transformations?: Record<string, unknown>;
  createdAt: { seconds: number; nanoseconds: number } | string;
  updatedAt: { seconds: number; nanoseconds: number } | string;
  processedAt?: { seconds: number; nanoseconds: number } | string;
}

function convertTimestamp(timestamp: { seconds: number; nanoseconds: number } | string): string {
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date(timestamp.seconds * 1000).toISOString();
}

function mapFirestoreJobToResponse(doc: FirestoreJob): JobResponse {
  return {
    id: doc.id,
    status: doc.status as JobResponse['status'],
    inputUrl: doc.inputUrl,
    outputUrl: doc.outputUrl,
    error: doc.error,
    transformations: doc.transformations,
    createdAt: convertTimestamp(doc.createdAt),
    updatedAt: convertTimestamp(doc.updatedAt),
    processedAt: doc.processedAt ? convertTimestamp(doc.processedAt) : undefined,
  };
}

export function subscribeToJobs(
  onUpdate: (jobs: JobResponse[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  try {
    const db = getFirestore();
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobs: JobResponse[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<FirestoreJob, 'id'>;
          jobs.push(mapFirestoreJobToResponse({ id: doc.id, ...data }));
        });
        onUpdate(jobs);
      },
      (error) => {
        onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Failed to subscribe to jobs'));
    return () => {};
  }
}
