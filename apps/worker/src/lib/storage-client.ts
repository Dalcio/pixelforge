import * as admin from 'firebase-admin';

export const getStorage = (): admin.storage.Storage => {
  return admin.storage();
};
