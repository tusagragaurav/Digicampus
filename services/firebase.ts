import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getDatabase, ref, set, onValue, push, update, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDuGUNBIyxrK8XtCm9ZP8y_rj9Scd2kbQo",
  authDomain: "digicampus200.firebaseapp.com",
  databaseURL: "https://digicampus200-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "digicampus200",
  storageBucket: "digicampus200.firebasestorage.app",
  messagingSenderId: "431874669516",
  appId: "1:431874669516:web:adef22b269cd49d0167b69",
  measurementId: "G-WX56R46G90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export { auth, database, googleProvider, signInWithPopup, signOut, onAuthStateChanged, ref, set, onValue, push, update, remove };
export type { User };
