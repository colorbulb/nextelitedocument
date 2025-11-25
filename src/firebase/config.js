import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyADGpgValITKs6zCNqkJTz2Dc5eENVh6-Y",
  authDomain: "nextelite-89f47.firebaseapp.com",
  databaseURL: "https://nextelite-89f47-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nextelite-89f47",
  storageBucket: "nextelite-89f47.firebasestorage.app",
  messagingSenderId: "106713038598",
  appId: "1:106713038598:web:c1a9935adf82053fe96887",
  measurementId: "G-MR0ENN9BY6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

export { db, auth, storage, analytics };

