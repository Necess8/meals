// firebase-db.js - Updated to fix database operations
import { db } from "./firebase-config.js"
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

// Add user to Firestore
export async function addUserToDatabase(user, username) {
  try {
    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: user.email,
      createdAt: serverTimestamp(),
    })
    console.log("User added to Firestore")
    return { success: true }
  } catch (error) {
    console.error("Error adding user to Firestore:", error)
    return { success: false, error: error.message }
  }
}

// Update user last login time in Firestore
export async function updateUserLastLogin(userId) {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error updating last login:", error)
    return { success: false, error: error.message }
  }
}

// Get user data by UID
export async function getUserData(userId) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      return null
    }
    return userDoc.data()
  } catch (error) {
    console.error("Error getting user data:", error)
    return null
  }
}

// Add favorite to Firestore
export async function addFavorite(userId, mealId) {
  try {
    await setDoc(doc(db, "favorites", `${userId}_${mealId}`), {
      userId: userId,
      mealId: mealId,
      timestamp: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error adding favorite:", error)
    return { success: false, error: error.message }
  }
}

// Remove a meal from user's favorites
export async function removeFavorite(userId, mealId) {
  try {
    await deleteDoc(doc(db, "favorites", `${userId}_${mealId}`))
    return { success: true }
  } catch (error) {
    console.error("Error removing favorite:", error)
    return { success: false, error: error.message }
  }
}

// Get user's favorites
export async function getUserFavorites(userId) {
  try {
    const favoritesQuery = query(collection(db, "favorites"), where("userId", "==", userId))
    const favoritesSnapshot = await getDocs(favoritesQuery)

    const favorites = []
    favoritesSnapshot.forEach((doc) => {
      favorites.push(doc.data())
    })

    return favorites
  } catch (error) {
    console.error("Error getting favorites:", error)
    return []
  }
}

// Add rating to Firestore
export async function addRating(userId, mealId, rating) {
  try {
    await setDoc(doc(db, "ratings", `${userId}_${mealId}`), {
      userId: userId,
      mealId: mealId,
      rating: rating,
      timestamp: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error adding rating:", error)
    return { success: false, error: error.message }
  }
}

// Get user's rating for a meal
export async function getUserRating(userId, mealId) {
  try {
    const ratingDoc = await getDoc(doc(db, "ratings", `${userId}_${mealId}`))
    if (ratingDoc.exists()) {
      return ratingDoc.data().rating
    }
    return 0
  } catch (error) {
    console.error("Error getting user rating:", error)
    return 0
  }
}

// Get user's rated meals
export async function getUserRatings(userId) {
  try {
    const ratingsQuery = query(collection(db, "ratings"), where("userId", "==", userId))
    const ratingsSnapshot = await getDocs(ratingsQuery)

    const ratings = []
    ratingsSnapshot.forEach((doc) => {
      ratings.push(doc.data())
    })

    return ratings
  } catch (error) {
    console.error("Error getting ratings:", error)
    return []
  }
}

// Get average rating for a meal
export async function getAverageRating(mealId) {
  try {
    const ratingsQuery = query(collection(db, "ratings"), where("mealId", "==", mealId))
    const ratingsSnapshot = await getDocs(ratingsQuery)

    if (ratingsSnapshot.empty) return 0

    let totalRating = 0
    let count = 0

    ratingsSnapshot.forEach((doc) => {
      totalRating += doc.data().rating
      count++
    })

    return count > 0 ? (totalRating / count).toFixed(1) : 0
  } catch (error) {
    console.error("Error getting average rating:", error)
    return 0
  }
}
