import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  remove,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


// 1) Firebase Console -> Project settings -> Your apps -> Web app
// 2) Вставьте сюда firebaseConfig своего проекта.
// ВАЖНО: databaseURL обязателен для Realtime Database.
const firebaseConfig = {
  apiKey: "AIzaSyA-g2kjDDfjytNyOCMmkX-143OODkv5u_I",
  authDomain: "wedding-money-counter.firebaseapp.com",
  databaseURL: "https://wedding-money-counter-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wedding-money-counter",
  storageBucket: "wedding-money-counter.firebasestorage.app",
  messagingSenderId: "67592230816",
  appId: "1:67592230816:web:e7755ab15998cf8471b6c5",
  measurementId: "G-FX254GVE43"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export {
  db,
  ref,
  push,
  set,
  onValue,
  remove,
  serverTimestamp
};
