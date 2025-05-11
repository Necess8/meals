import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCXNL0Ej13pnDdCjvgSD6qxl00R4miE0vU",
    authDomain: "meals-db-9a613.firebaseapp.com",
    projectId: "meals-db-9a613",
    storageBucket: "meals-db-9a613.appspot.com",
    messagingSenderId: "275589977323",
    appId: "1:275589977323:web:113b9eacc2431582709aae"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
