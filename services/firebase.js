import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDRQ69j_25mPhr5e-LTSW4uNma6MwY1bbo",
  authDomain: "glossia-325c1.firebaseapp.com",
  projectId: "glossia-325c1",
  storageBucket: "glossia-325c1.firebasestorage.app",
  messagingSenderId: "765172556238",
  appId: "1:765172556238:web:0452532025599e065bcb9f",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
