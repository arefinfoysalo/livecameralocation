
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

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
