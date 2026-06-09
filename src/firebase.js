/**
 * Firebase Configuration & Helpers
 * Spec Section 3 — Firebase config
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC2NDuJ5EoiCRSzAG7uwti0PKOroFK-0v4",
  authDomain: "portfolio-pinterest-style.firebaseapp.com",
  projectId: "portfolio-pinterest-style",
  storageBucket: "portfolio-pinterest-style.firebasestorage.app",
  messagingSenderId: "3947926345",
  appId: "1:3947926345:web:dc3990605f4acfe7738098"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
