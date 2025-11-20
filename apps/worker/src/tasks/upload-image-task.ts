import { getStorage } from '../lib/storage-client';

export const uploadImage = async (jobId: string, buffer: Buffer): Promise<string> => {
  const storage = getStorage();
  const bucket = storage.bucket();
  const fileName = `processed/${jobId}.jpg`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: {
      contentType: 'image/jpeg',
    },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};
