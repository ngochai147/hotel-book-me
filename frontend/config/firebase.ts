import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration from backend
const firebaseConfig = {
  apiKey: "AIzaSyCmJFXOAMfZUVwh_Qnwp1docVrcB_7n7eo",
  authDomain: "hotel-booking-app-70dce.firebaseapp.com",
  projectId: "hotel-booking-app-70dce",
  storageBucket: "hotel-booking-app-70dce.firebasestorage.app",
  messagingSenderId: "373122582661",
  appId: "1:373122582661:web:72d6c40165f6a8ce6541ec",
  measurementId: "G-DCDWR6B8LC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
