/**
 * CORE / DATA.JS
 * Configuration Firebase (Firestore + Storage)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 🔥 إعدادات Firebase الحقيقية (صحيحة)
const firebaseConfig = {
  apiKey: "AIzaSyAJQyAOJ-K5jBbS8w52Cp1CUSHOQko1HF8",
  authDomain: "dashboard-menu-dapinos.firebaseapp.com",
  projectId: "dashboard-menu-dapinos",
  storageBucket: "dashboard-menu-dapinos.firebasestorage.app",
  messagingSenderId: "144285023821",
  appId: "1:144285023821:web:7cf1f385f59ceb3801a604",
 
};

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ Export (مهم جدًا)
export {
  db, storage,
  collection, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, where, serverTimestamp,
  ref, uploadBytes, getDownloadURL, deleteObject
};
