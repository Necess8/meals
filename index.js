// index.js
import { registerUser, signIn, checkAuthState } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  checkAuthState((user) => {
    if (user) {
      window.location.href = "userpage.html";
    }
  });

  // Form tab switching
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.style.display = "block";
    registerForm.style.display = "none";
  });

  registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.style.display = "block";
    loginForm.style.display = "none";
  });

  // Login form submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    const errorElement = document.getElementById("loginError");

    try {
      errorElement.textContent = "Logging in...";
      const result = await signIn(email, password);
      if (result.success) {
        window.location.href = "userpage.html";
      } else {
        errorElement.textContent = result.error || "Login failed. Please try again.";
      }
    } catch (error) {
      console.error("Login error:", error);
      errorElement.textContent = "An unexpected error occurred. Please try again.";
    }
  });

  // Register form submission
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;
    const errorElement = document.getElementById("registerError");

    if (username.length < 3) {
      errorElement.textContent = "Username must be at least 3 characters long.";
      return;
    }

    if (password.length < 6) {
      errorElement.textContent = "Password must be at least 6 characters long.";
      return;
    }

    try {
      errorElement.textContent = "Creating account...";
      const result = await registerUser(username, password);

      if (result.success) {
        window.location.href = "userpage.html";
      } else {
        errorElement.textContent = result.error || "Registration failed. Please try again.";
      }
    } catch (error) {
      console.error("Registration error:", error);
      errorElement.textContent = "An unexpected error occurred. Please try again.";
    }
  });
});
