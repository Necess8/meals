// index.js - Updated to fix login and registration
import { registerUser, signIn, checkAuthState } from "./auth.js"

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  checkAuthState((user) => {
    if (user) {
      // User is signed in, redirect to userpage
      window.location.href = "userpage.html"
    }
  })

  // Login form handler
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const username = document.getElementById("loginUsername").value
      const password = document.getElementById("loginPassword").value
      const errorElement = document.getElementById("loginError")

      // Clear previous errors
      if (errorElement) errorElement.style.display = "block"
      if (errorElement) errorElement.textContent = ""

      try {
        // Validate inputs
        if (!username || !password) {
          if (errorElement) errorElement.textContent = "Username and password are required"
          return
        }

        // Attempt login
        const result = await signIn(username, password)

        if (result.success) {
          // Redirect to user page on successful login
          window.location.href = "userpage.html"
        } else {
          // Display error message
          if (errorElement) {
            if (result.error.includes("user-not-found") || result.error.includes("wrong-password")) {
              errorElement.textContent = "Invalid username or password"
            } else {
              errorElement.textContent = result.error
            }
          }
        }
      } catch (error) {
        console.error("Login error:", error)
        if (errorElement) errorElement.textContent = "An unexpected error occurred. Please try again."
      }
    })
  }

  // Registration form handler
  const registerForm = document.getElementById("registerForm")
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const username = document.getElementById("registerUsername").value
      const password = document.getElementById("registerPassword").value
      const errorElement = document.getElementById("registerError")

      // Clear previous errors
      if (errorElement) errorElement.style.display = "block"
      if (errorElement) errorElement.textContent = ""

      try {
        // Validate inputs
        if (!username || !password) {
          if (errorElement) errorElement.textContent = "Username and password are required"
          return
        }

        if (username.length < 3) {
          if (errorElement) errorElement.textContent = "Username must be at least 3 characters"
          return
        }

        if (password.length < 6) {
          if (errorElement) errorElement.textContent = "Password must be at least 6 characters"
          return
        }

        // Attempt registration
        const result = await registerUser(username, password)

        if (result.success) {
          // Redirect to user page on successful registration
          window.location.href = "userpage.html"
        } else {
          // Display error message
          if (errorElement) {
            if (result.error.includes("email-already-in-use")) {
              errorElement.textContent = "Username already exists"
            } else {
              errorElement.textContent = result.error
            }
          }
        }
      } catch (error) {
        console.error("Registration error:", error)
        if (errorElement) errorElement.textContent = "An unexpected error occurred. Please try again."
      }
    })
  }

  // Toggle between login and register forms
  const container = document.querySelector(".container")
  const registerBtn = document.querySelector(".registerr-btn")
  const loginBtn = document.querySelector(".loginn-btn")

  if (container && registerBtn && loginBtn) {
    registerBtn.addEventListener("click", () => {
      container.classList.add("active")
    })

    loginBtn.addEventListener("click", () => {
      container.classList.remove("active")
    })
  }
})
