// firebase-config.js (no import, uses global firebase from script tags)

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXNL0Ej13pnDdCjvgSD6qx100R4miE8vU",
  authDomain: "meals-db-9a613.firebaseapp.com",
  databaseURL: "https://meals-db-9a613-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "meals-db-9a613",
  storageBucket: "meals-db-9a613.appspot.com",
  messagingSenderId: "275589977323",
  appId: "1:275589977323:web:113b9eacc2431582709aae",
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Global references (can be used in other script files)
const database = firebase.database();
const auth = firebase.auth();
