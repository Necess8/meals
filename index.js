// index.js

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      window.location.href = "userpage.html"; // Redirect to user page if logged in
    }
  });

  // Toggle between login and register forms
  const container = document.querySelector(".container");
  const registerBtn = document.querySelector(".registerr-btn");
  const loginBtn = document.querySelector(".loginn-btn");

  if (registerBtn && loginBtn && container) {
    registerBtn.addEventListener("click", () => {
      container.classList.add("active");
    });

    loginBtn.addEventListener("click", () => {
      container.classList.remove("active");
    });
  }

  // Login form submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginUsername").value;
      const password = document.getElementById("loginPassword").value;
      const errorElement = document.getElementById("loginError");

      if (errorElement) errorElement.style.display = "block";

      try {
        if (errorElement) errorElement.textContent = "Logging in...";
        firebase.auth().signInWithEmailAndPassword(email, password)
          .then(() => {
            window.location.href = "userpage.html"; // Redirect to user page on successful login
          })
          .catch((error) => {
            if (errorElement) errorElement.textContent = error.message || "Login failed. Please try again.";
          });
      } catch (error) {
        console.error("Login error:", error);
        if (errorElement) errorElement.textContent = "An unexpected error occurred. Please try again.";
      }
    });
  }

  // Register form submission
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("registerUsername").value;
      const password = document.getElementById("registerPassword").value;
      const errorElement = document.getElementById("registerError");

      if (errorElement) errorElement.style.display = "block";

      if (!email.includes("@")) {
        if (errorElement) errorElement.textContent = "Please enter a valid email address.";
        return;
      }

      if (password.length < 6) {
        if (errorElement) errorElement.textContent = "Password must be at least 6 characters long.";
        return;
      }

      try {
        if (errorElement) errorElement.textContent = "Creating account...";
        firebase.auth().createUserWithEmailAndPassword(email, password)
          .then(() => {
            window.location.href = "userpage.html"; // Redirect to user page on successful registration
          })
          .catch((error) => {
            if (errorElement) errorElement.textContent = error.message || "Registration failed. Please try again.";
          });
      } catch (error) {
        console.error("Registration error:", error);
        if (errorElement) errorElement.textContent = "An unexpected error occurred. Please try again.";
      }
    });
  }
});
