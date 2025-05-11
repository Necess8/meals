// index.js
import { registerUser, signIn, checkAuthState } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const username = document.getElementById("registerUsername").value;
    const errorElement = document.getElementById("registerError");

    try {
      // Clear previous errors
      errorElement.textContent = "";
      
      // Frontend validation
      if (!email || !password || !username) {
        errorElement.textContent = "All fields are required!";
        return;
      }

      if (username.length < 3) {
        errorElement.textContent = "Username must be at least 3 characters long.";
        return;
      }

      if (password.length < 6) {
        errorElement.textContent = "Password must be at least 6 characters long.";
        return;
      }

      errorElement.textContent = "Creating account...";
      
      // Call registration function
      const result = await registerUser(email, password, username);

      if (result.success) {
        alert("Account created successfully!");
      } else {
        errorElement.textContent = result.error || "Registration failed. Please try again.";
      }
    } catch (error) {
      console.error("Registration error:", error);
      errorElement.textContent = "An unexpected error occurred. Please try again.";
    }
  });
});