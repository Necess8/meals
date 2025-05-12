// firebase-config.js - DO NOT CHANGE THIS FILE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXNL0Ej13pnDdCjvgSD6qxl00R4miE0vU",
  authDomain: "meals-db-9a613.firebaseapp.com",
  projectId: "meals-db-9a613",
  storageBucket: "meals-db-9a613.appspot.com",
  messagingSenderId: "275589977323",
  appId: "1:275589977323:web:113b9eacc2431582709aae"
};

const app = initializeApp(firebaseConfig);
console.log("Firebase App:", app);  // Should log Firebase app instance
const auth = getAuth(app);
console.log("Firebase Auth:", auth); // Should log auth instance
const db = getFirestore(app);
console.log("Firestore DB:", db); // Should log Firestore instance

export { auth, db }; 