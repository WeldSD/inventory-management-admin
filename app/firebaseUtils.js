// app/firebaseUtils.js
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';

export const getReportsData = async () => {
  const q = query(collection(db, "demoreport"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const sendEmailReport = async (email, reportData) => {
  // Implement your email sending logic here
  console.log(`Would send email to ${email} with report data`, reportData);
  return Promise.resolve();
};