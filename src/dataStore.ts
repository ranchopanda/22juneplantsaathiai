import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const config = {
  apiKey: import.meta.env.VITE_DATASTORE_API_KEY,
  authDomain: import.meta.env.VITE_DATASTORE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_DATASTORE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_DATASTORE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_DATASTORE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_DATASTORE_APP_ID,
  measurementId: import.meta.env.VITE_DATASTORE_MEASUREMENT_ID,
};

const app = initializeApp(config);

export const dataStore = getFirestore(app);
export const fileStore = getStorage(app); 