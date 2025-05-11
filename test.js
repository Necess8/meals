// Test Firestore read
import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Add a new document with auto-generated ID
async function addData() {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      name: "Ada Lovelace",
      email: "ada@example.com",
      createdAt: new Date()
    });
    console.log("Document written with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding document:", error);
  }
}

addData();