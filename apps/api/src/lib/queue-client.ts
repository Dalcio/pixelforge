import { Queue } from 'bullmq';
import { getRedisClient } from './redis-client';

let queue: Queue | null = null;

export const getQueue = (): Queue => {
  if (queue) {
    return queue;
  }

  const connection = getRedisClient();

  queue = new Queue('image-processing', {
    connection,
  });

  return queue;
};
