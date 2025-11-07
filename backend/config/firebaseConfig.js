// firebaseConfig.tsx
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth"

// const firebaseConfig = {
//   apiKey: "AIzaSyCpIwm0DidmuGAMQRfVTmNFrgyuIqmZvjs",
//   authDomain: "hotel-book-me.firebaseapp.com",
//   projectId: "hotel-book-me",
//   storageBucket: "hotel-book-me.firebasestorage.app",
//   messagingSenderId: "921572618541",
//   appId: "1:921572618541:android:5ed91a08c5754e761ee3a4",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// const auth = getAuth(app)

// export { app, analytics, auth };

export default {
  apiKey: "AIzaSyExample12345",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcd1234",
};