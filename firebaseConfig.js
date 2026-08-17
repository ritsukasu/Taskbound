import firebase from 'firebase';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBNXx8PtMyjcSR3_DVtn6k2Vg_EcuzH9B4",
  authDomain: "proky-ee389.firebaseapp.com",
  projectId: "proky-ee389",
  storageBucket: "proky-ee389.firebasestorage.app",
  messagingSenderId: "905089047409",
  appId: "1:905089047409:web:165a71b0c9c81ce6b334d0"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
export default firebase;