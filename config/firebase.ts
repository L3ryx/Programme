import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCN4fnXfl5k37wwKTe1-8sksGuvAAY3XMk",
  authDomain: "alemille-b7619.firebaseapp.com",
  projectId: "alemille-b7619",
  storageBucket: "alemille-b7619.firebasestorage.app",
  messagingSenderId: "282371019831",
  appId: "1:282371019831:android:079204ca5c87540c329bb2",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
