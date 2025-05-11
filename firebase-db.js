// firebase-db.js
import { db } from "./firebase-config.js";
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Add user to Firestore
export async function addUserToDatabase(user, username) {
  try {
    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: user.email,
      createdAt: serverTimestamp()
    });
    console.log("User added to Firestore");
  } catch (error) {
    console.error("Error adding user to Firestore:", error);
    throw error;
  }
}

// Update user last login time in Firestore
export async function updateUserLastLogin(userId) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating last login:", error);
    return { success: false, error: error.message };
  }
}

// Get user data by UID
export async function getUserData(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data();  // Returns user data
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}
