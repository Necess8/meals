// auth.js
import { auth, db } from "./firebase-config.js";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// User registration with Firestore integration
export async function registerUser(email, password, username) {
  try {
    // 1. Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 2. Create user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      username: username,
      email: email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    return { 
      success: true, 
      user: userCredential.user 
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// User login
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Auth state listener
export function checkAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}