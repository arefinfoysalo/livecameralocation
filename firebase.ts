
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDWe17Aa43xItON7VKompFpmt423ilTqyU",
  authDomain: "livecameralocation.firebaseapp.com",
  projectId: "livecameralocation",
  storageBucket: "livecameralocation.firebasestorage.app",
  messagingSenderId: "328029978770",
  appId: "1:328029978770:web:4435a0399b0593a535664b",
  measurementId: "G-0H1PF72X4J"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
