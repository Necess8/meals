// auth.js - Updated to fix login functionality and prevent duplicate usernames
import { auth, db } from "./firebase-config.js"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

// Check if username already exists
async function usernameExists(username) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking username:", error);
    return false;
  }
}

// User registration with Firestore integration
export async function registerUser(username, password) {
  try {
    // Check if username already exists
    const exists = await usernameExists(username);
    if (exists) {
      return {
        success: false,
        error: "Username already exists. Please choose a different username."
      };
    }

    // Create a pseudo email from username (Firebase requires email format)
    const email = `${username}@mealfinder.example`

    // 1. Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // 2. Create user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      username: username,
      email: email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    })

    return {
      success: true,
      user: userCredential.user,
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// User login
export async function signIn(username, password) {
  try {
    // Create a pseudo email from username
    const email = `${username}@mealfinder.example`

    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    // Update last login time
    await setDoc(
      doc(db, "users", userCredential.user.uid),
      {
        lastLogin: serverTimestamp(),
      },
      { merge: true },
    )

    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: error.message }
  }
}

// Sign out
export async function signOutUser() {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return { success: false, error: error.message }
  }
}

// Auth state listener
export function checkAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user)
  })
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser
}