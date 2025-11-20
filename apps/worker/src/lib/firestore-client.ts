import * as admin from 'firebase-admin';

export const getFirestore = (): admin.firestore.Firestore => {
  return admin.firestore();
};
