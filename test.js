// Test Firestore read
import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get inputs
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const errorElement = document.getElementById('registerError');

    // Validation
    if (!username || !password) {
        errorElement.textContent = "Username and password are required!";
        return;
    }

    if (username.length < 3) {
        errorElement.textContent = "Username must be at least 3 characters";
        return;
    }

    if (password.length < 6) {
        errorElement.textContent = "Password must be at least 6 characters";
        return;
    }

        errorElement.textContent = "Creating account...";
        

        // Store username separately in Firestore
        await addDoc(collection(db, "users"), {
            username: username,
            password: password,
            createdAt: new Date()
        });

        window.location.href = 'userpage.html';


});



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