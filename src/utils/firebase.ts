import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCc5jC-vz28i1HPUdszalezuz0RXskK81U",
  authDomain: "agriai-detection.firebaseapp.com",
  projectId: "agriai-detection",
  storageBucket: "agriai-detection.firebasestorage.app",
  messagingSenderId: "44620347817",
  appId: "1:44620347817:web:545b37b3d6ac135be56cb8",
  measurementId: "G-QDS6D1REGC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Check if we're in development mode and using dummy values
if (import.meta.env.DEV && firebaseConfig.apiKey === 'dummy-api-key') {
  console.warn('Using dummy Firebase configuration. Please set up your Firebase credentials in .env file.');
}

export default app; 