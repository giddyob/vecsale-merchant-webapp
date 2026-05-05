import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCoCv7SlZ95quCGEfxBputIpx65GA_BYNI",
  authDomain: "vecsale-6ff3a.firebaseapp.com",
  databaseURL: "https://vecsale-6ff3a-default-rtdb.firebaseio.com",
  projectId: "vecsale-6ff3a",
  storageBucket: "vecsale-6ff3a.firebasestorage.app",
  messagingSenderId: "934764662043",
  appId: "1:934764662043:web:36b9f84a6790f3d1a997be",
  measurementId: "G-R2ZN2XZ25T",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
