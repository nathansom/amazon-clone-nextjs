import firebase from "firebase";

const firebaseConfig = {
    apiKey: "AIzaSyDwkLcJPaxlnTC8zVtycOKHCikuHs12PdY",
    authDomain: "clone-nextjs-8adeb.firebaseapp.com",
    projectId: "clone-nextjs-8adeb",
    storageBucket: "clone-nextjs-8adeb.appspot.com",
    messagingSenderId: "88480159874",
    appId: "1:88480159874:web:1f0059a10c57aa2036bc9b"
  };

  const app = !firebase.apps.length 
  ? firebase.initializeApp(firebaseConfig) 
  : firebase.app();

  const db = app.firestore();

  export default db;