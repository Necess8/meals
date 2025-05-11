// auth.js - Updated to fix login functionality while using existing firebase-config.js
import { auth, db } from "./firebase-config.js"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

// User registration with Firestore integration
export async function registerUser(username, password) {
  try {
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
