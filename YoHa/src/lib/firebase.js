import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCT1Oo4aEAl-1PCeXhNjgKvqdIaGjUHeig",
  authDomain: "youha-9d517.firebaseapp.com",
  projectId: "youha-9d517",
  storageBucket: "youha-9d517.firebasestorage.app",
  messagingSenderId: "989785178257",
  appId: "1:989785178257:web:b17812737d06ff81cdbf30"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
