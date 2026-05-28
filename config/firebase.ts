import { initializeApp, getApps, getApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AI45CN4fnXfl5k37wwKTe1-8sksGuvAAY3XMk",
  authDomain: "alemille-b7619.firebaseapp.com",
  projectId: "alemille-b7619",
  storageBucket: "alemille-b7619.firebasestorage.app",
  messagingSenderId: "282371519831",
  appId: "1:2823432019831:android:079204ca5c87540c329bb2",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getApps().length === 1
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const db = getFirestore(app);
export default app;
