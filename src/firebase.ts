import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANIB0iUDFOl7oizMSyrY4NIlwtSsORJkw",
  authDomain: "spring-fuze-l8gvj.firebaseapp.com",
  projectId: "spring-fuze-l8gvj",
  storageBucket: "spring-fuze-l8gvj.firebasestorage.app",
  messagingSenderId: "277632064994",
  appId: "1:277632064994:web:2e63758e27123dbaafedbb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-3f1a3c7f-6d33-4c99-a400-d8be55c4ccba");
