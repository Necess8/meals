import { db } from "./firebase-config.js"
import { signOutUser, getCurrentUser, checkAuthState } from "./auth.js"
import {
  getUserFavorites,
  getUserRatings,
  addFavorite,
  removeFavorite,
  getUserRating,
  getAverageRating,
  addRating,
  isMealFavorited,
} from "./firebase-db.js"
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  checkAuthState((user) => {
    if (user) {
      // Display username in navbar
      const usernameDisplay = document.getElementById("usernameDisplay")
      if (usernameDisplay) {
        // Get username from email (remove @mealfinder.example)
        const email = user.email
        const username = email.split("@")[0]
        usernameDisplay.textContent = username
      }

      // Load profile data
      loadProfileData(user)

      // Load favorites and ratings
      loadFavorites(user.uid)
      loadRatings(user.uid)
    } else {
      // If not logged in, redirect to login
      window.location.href = "index.html"
    }
  })

  // Toggle mobile nav
  const menuBtn = document.querySelector(".menuBtn")
  const navlink = document.querySelector(".nav-link")

  if (menuBtn && navlink) {
    menuBtn.addEventListener("click", () => {
      navlink.classList.toggle("mobile-menu")
    })
  }

  // Sign out button
  const signOutBtn = document.getElementById("signOutBtn")
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      try {
        const result = await signOutUser()
        if (result.success) {
          window.location.href = "index.html"
        } else {
          console.error("Sign out failed:", result.error)
        }
      } catch (error) {
        console.error("Error during sign out:", error)
      }
    })
  }
})

async function loadProfileData(user) {
  const profileUsername = document.getElementById("profile-username")
  const profileEmail = document.getElementById("profile-email")
  const profileJoined = document.getElementById("profile-joined")

  if (!profileUsername || !profileEmail || !profileJoined) return

  try {
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid))

    if (userDoc.exists()) {
      const userData = userDoc.data()

      // Display username
      profileUsername.textContent = userData.username || "User"

      // Display email (or username if no email)
      profileEmail.textContent = userData.email || user.email || ""

      // Display join date
      if (userData.createdAt) {
        const joinDate = new Date(userData.createdAt.seconds * 1000)
        profileJoined.textContent = `Joined: ${joinDate.toLocaleDateString()}`
      } else {
        profileJoined.textContent = "Joined: Recently"
      }
    } else {
      // If no user document exists, display basic info
      const username = user.email ? user.email.split("@")[0] : "User"
      profileUsername.textContent = username
      profileEmail.textContent = user.email || ""
      profileJoined.textContent = "Joined: Recently"
    }
  } catch (error) {
    console.error("Error loading profile data:", error)
    profileUsername.textContent = "Error loading profile"
    profileEmail.textContent = ""
    profileJoined.textContent = ""
  }
}

async function loadFavorites(userId) {
  const favoritesContainer = document.getElementById("favorites-container")
  const noFavorites = document.getElementById("no-favorites")

  if (!favoritesContainer || !noFavorites) return

  try {
    // Get user's favorites
    const favorites = await getUserFavorites(userId)

    // Clear loading skeletons
    favoritesContainer.innerHTML = ""

    if (favorites.length === 0) {
      // Show no favorites message
      noFavorites.style.display = "block"
      return
    }

    // Hide no favorites message
    noFavorites.style.display = "none"

    // Load meal details for each favorite
    for (const favorite of favorites) {
      const meal = await fetchMealById(favorite.mealId)
      if (meal) {
        // Get average rating
        const avgRating = await getAverageRating(meal.idMeal)
        meal.avgRating = avgRating

        // Create meal card
        const mealCard = await createProfileMealCard(meal)
        favoritesContainer.appendChild(mealCard)
      }
    }
  } catch (error) {
    console.error("Error loading favorites:", error)
    favoritesContainer.innerHTML = "<p>Error loading favorites. Please try again.</p>"
  }
}

async function loadRatings(userId) {
  const ratingsContainer = document.getElementById("ratings-container")
  const noRatings = document.getElementById("no-ratings")

  if (!ratingsContainer || !noRatings) return

  try {
    // Get user's ratings
    const ratings = await getUserRatings(userId)

    // Clear loading skeletons
    ratingsContainer.innerHTML = ""

    if (ratings.length === 0) {
      // Show no ratings message
      noRatings.style.display = "block"
      return
    }

    // Hide no ratings message
    noRatings.style.display = "none"

    // Load meal details for each rated meal
    for (const ratingItem of ratings) {
      const meal = await fetchMealById(ratingItem.mealId)
      if (meal) {
        // Add user's rating to meal object
        meal.userRating = ratingItem.rating

        // Get average rating
        const avgRating = await getAverageRating(meal.idMeal)
        meal.avgRating = avgRating

        // Create meal card
        const mealCard = await createProfileMealCard(meal, true)
        ratingsContainer.appendChild(mealCard)
      }
    }
  } catch (error) {
    console.error("Error loading ratings:", error)
    ratingsContainer.innerHTML = "<p>Error loading ratings. Please try again.</p>"
  }
}

async function fetchMealById(id) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
    const data = await response.json()
    return data.meals ? data.meals[0] : null
  } catch (error) {
    console.error("Error fetching meal details:", error)
    return null
  }
}

// Helper function to generate rating stars HTML based on a rating value
function generateRatingStars(rating) {
  let starsHTML = ""
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      starsHTML += '<i class="ri-poker-hearts-fill"></i>'
    } else if (i === fullStars + 1 && hasHalfStar) {
      starsHTML += '<i class="ri-poker-hearts-fill half"></i>'
    } else {
      starsHTML += '<i class="ri-poker-hearts-line"></i>'
    }
  }

  return starsHTML
}

async function createProfileMealCard(meal, isRated = false) {
  const card = document.createElement("div")
  card.className = "meal-card"
  card.dataset.id = meal.idMeal

  // Get the average rating
  const avgRating = meal.avgRating || 0

  // Get user's rating if not provided
  let userRating = meal.userRating || 0
  if (!userRating) {
    const loggedInUser = getCurrentUser()
    if (loggedInUser) {
      userRating = await getUserRating(loggedInUser.uid, meal.idMeal)
    }
  }

  // Check if meal is favorited (should be true for favorites tab)
  let isFavorite = true
  if (!isRated) {
    // For ratings tab, we need to check if it's also a favorite
    const loggedInUser = getCurrentUser()
    if (loggedInUser) {
      isFavorite = await isMealFavorited(loggedInUser.uid, meal.idMeal)
    }
  }

  card.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
    <div class="meal-card-content">
      <h3>${meal.strMeal}</h3>
      <p>${meal.strCategory || "Category not available"}</p>
      
      <div class="meal-card-actions">
        <button class="view-recipe" data-id="${meal.idMeal}">See Recipe</button>
        <button class="view-ingredients" data-id="${meal.idMeal}">Ingredients</button>
        <button class="${isFavorite ? "remove-favorite" : "add-favorite"}" data-id="${meal.idMeal}">
          <i class="ri-heart-${isFavorite ? "fill" : "line"}"></i>
        </button>
      </div>
    </div>
  `

  // Add event listeners
  card.addEventListener("click", () => showProfileMealDetail(meal.idMeal))

  const viewRecipeBtn = card.querySelector(".view-recipe")
  const viewIngredientsBtn = card.querySelector(".view-ingredients")
  const favoriteBtn = card.querySelector(".add-favorite, .remove-favorite")

  viewRecipeBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    showProfileMealDetail(meal.idMeal, "recipe")
  })

  viewIngredientsBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    showProfileMealDetail(meal.idMeal, "ingredients")
  })

  favoriteBtn.addEventListener("click", async (e) => {
    e.stopPropagation()

    const loggedInUser = getCurrentUser()
    if (!loggedInUser) {
      alert("Please log in to manage favorites")
      return
    }

    const icon = favoriteBtn.querySelector("i")
    const isFilled = icon.classList.contains("ri-heart-fill")

    if (isFilled) {
      // Remove from favorites
      const result = await removeFavorite(loggedInUser.uid, meal.idMeal)
      if (result.success) {
        icon.classList.remove("ri-heart-fill")
        icon.classList.add("ri-heart-line")
        favoriteBtn.classList.remove("remove-favorite")
        favoriteBtn.classList.add("add-favorite")

        // If we're in the favorites section, remove this card
        if (!isRated) {
          card.remove()

          // Check if there are any favorites left
          const favoritesContainer = document.getElementById("favorites-container")
          if (favoritesContainer && favoritesContainer.children.length === 0) {
            document.getElementById("no-favorites").style.display = "block"
          }
        }

        alert(result.message)
      } else {
        alert(result.error || "Error removing from favorites")
      }
    } else {
      // Add to favorites
      const result = await addFavorite(loggedInUser.uid, meal.idMeal)
      if (result.success) {
        icon.classList.remove("ri-heart-line")
        icon.classList.add("ri-heart-fill")
        favoriteBtn.classList.remove("add-favorite")
        favoriteBtn.classList.add("remove-favorite")
        alert(result.message)
      } else {
        alert(result.error || "Error adding to favorites")
      }
    }
  })

  return card
}

async function showProfileMealDetail(id, activeTab = "recipe") {
  const modal = document.getElementById("profileMealDetailModal")
  const modalContent = document.getElementById("profileMealDetailContent")

  if (!modal || !modalContent) return

  // Show loading state
  modalContent.innerHTML = `
    <div class="meal-detail-skeleton">
      <div class="meal-image skeleton-loader"></div>
      <div class="meal-title skeleton-loader"></div>
      <div class="meal-category skeleton-loader"></div>
      <div class="meal-ingredients skeleton-loader"></div>
      <div class="meal-instructions skeleton-loader"></div>
    </div>
  `

  modal.style.display = "block"

  try {
    const meal = await fetchMealById(id)
    if (!meal) {
      modalContent.innerHTML = "<p>Meal details not found.</p>"
      return
    }

    // Get ingredients and measurements
    const ingredients = []
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`]
      const measure = meal[`strMeasure${i}`]

      if (ingredient && ingredient.trim() !== "") {
        ingredients.push({
          name: ingredient,
          measure: measure || "",
        })
      }
    }

    // Get user's rating
    let userRating = 0
    const loggedInUser = getCurrentUser()
    if (loggedInUser) {
      userRating = await getUserRating(loggedInUser.uid, id)
    }

    // Get average rating
    const avgRating = await getAverageRating(id)

    // Check if meal is favorited
    let isFavorite = false
    if (loggedInUser) {
      isFavorite = await isMealFavorited(loggedInUser.uid, id)
    }

    // Create HTML content
    modalContent.innerHTML = `
      <div class="meal-detail-header">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-detail-header-content">
          <h2>${meal.strMeal}</h2>
          <p>Category: ${meal.strCategory}</p>
          <p>Origin: ${meal.strArea}</p>
          
          <div class="meal-detail-ratings">
            <div class="meal-detail-avg-rating" title="Average rating: ${avgRating}" data-meal-id="${meal.idMeal}">
              <p>Average Rating: ${avgRating}</p>
              <div class="stars">
                ${generateRatingStars(avgRating)}
              </div>
            </div>
            
            <div class="meal-detail-rating" data-meal-id="${meal.idMeal}" data-user-rating="${userRating}">
              <p>Your Rating:</p>
              <div class="stars">
                <i class="ri-poker-hearts-${userRating >= 1 ? "fill" : "line"}" data-rating="1"></i>
                <i class="ri-poker-hearts-${userRating >= 2 ? "fill" : "line"}" data-rating="2"></i>
                <i class="ri-poker-hearts-${userRating >= 3 ? "fill" : "line"}" data-rating="3"></i>
                <i class="ri-poker-hearts-${userRating >= 4 ? "fill" : "line"}" data-rating="4"></i>
                <i class="ri-poker-hearts-${userRating >= 5 ? "fill" : "line"}" data-rating="5"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="meal-detail-tabs">
        <button id="profile-recipe-tab" class="${activeTab === "recipe" ? "active" : ""}">Recipe</button>
        <button id="profile-ingredients-tab" class="${activeTab === "ingredients" ? "active" : ""}">Ingredients</button>
      </div>
      
      <div class="meal-detail-content">
        <div id="profile-recipe-content" style="display: ${activeTab === "recipe" ? "block" : "none"}">
          <h3>Instructions</h3>
          <div class="instructions">
            ${meal.strInstructions.replace(/\n/g, "<br>")}
          </div>
        </div>
        
        <div id="profile-ingredients-content" style="display: ${activeTab === "ingredients" ? "block" : "none"}">
          <h3>Ingredients</h3>
          <div class="ingredients-grid">
            ${ingredients
              .map(
                (ing) => `
              <div class="ingredient-item">
                <img src="https://www.themealdb.com/images/ingredients/${ing.name}-Small.png" alt="${ing.name}">
                <div>
                  <p>${ing.name}</p>
                  <small>${ing.measure}</small>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `

    // Set up tab switching
    const recipeTab = document.getElementById("profile-recipe-tab")
    const ingredientsTab = document.getElementById("profile-ingredients-tab")
    const recipeContent = document.getElementById("profile-recipe-content")
    const ingredientsContent = document.getElementById("profile-ingredients-content")

    recipeTab.addEventListener("click", () => {
      recipeTab.classList.add("active")
      ingredientsTab.classList.remove("active")
      recipeContent.style.display = "block"
      ingredientsContent.style.display = "none"
    })

    ingredientsTab.addEventListener("click", () => {
      ingredientsTab.classList.add("active")
      recipeTab.classList.remove("active")
      ingredientsContent.style.display = "block"
      recipeContent.style.display = "none"
    })

    // Set up rating functionality in modal
    const ratingStars = modalContent.querySelectorAll(".meal-detail-rating .stars i")
    ratingStars.forEach((star) => {
      star.addEventListener("click", async (e) => {
        const loggedInUser = getCurrentUser()
        if (!loggedInUser) {
          alert("Please log in to rate meals")
          return
        }

        const rating = Number.parseInt(e.target.dataset.rating)
        await addRating(loggedInUser.uid, meal.idMeal, rating)

        // Update stars in modal
        ratingStars.forEach((s, index) => {
          if (index < rating) {
            s.classList.add("ri-poker-hearts-fill")
            s.classList.remove("ri-poker-hearts-line")
          } else {
            s.classList.add("ri-poker-hearts-line")
            s.classList.remove("ri-poker-hearts-fill")
          }
        })

        // Update user rating data attribute
        modalContent.querySelector(".meal-detail-rating").dataset.userRating = rating

        // Update average rating
        const newAvgRating = await getAverageRating(meal.idMeal)
        const avgRatingElement = modalContent.querySelector(".meal-detail-avg-rating p")
        if (avgRatingElement) {
          avgRatingElement.textContent = `Average Rating: ${newAvgRating}`
        }

        const avgRatingStars = modalContent.querySelector(".meal-detail-avg-rating .stars")
        if (avgRatingStars) {
          avgRatingStars.innerHTML = generateRatingStars(newAvgRating)
        }

        // Reload ratings to reflect changes
        loadRatings(loggedInUser.uid)
      })
    })

    // Set up watch video button
    const watchVideoBtn = document.getElementById("profile-watch-video")
    if (watchVideoBtn) {
      if (meal.strYoutube) {
        watchVideoBtn.addEventListener("click", () => {
          window.open(meal.strYoutube, "_blank")
        })
        watchVideoBtn.style.display = "block"
      } else {
        watchVideoBtn.style.display = "none"
      }
    }

    // Set up add to favorites button
    const addToFavoritesBtn = document.getElementById("profile-add-to-favorites")
    if (addToFavoritesBtn) {
      addToFavoritesBtn.dataset.id = meal.idMeal

      // Update button text and icon based on favorite status
      if (isFavorite) {
        addToFavoritesBtn.innerHTML = '<i class="ri-heart-fill"></i> Remove from Favorites'
      } else {
        addToFavoritesBtn.innerHTML = '<i class="ri-heart-line"></i> Add to Favorites'
      }

      addToFavoritesBtn.addEventListener("click", async () => {
        const loggedInUser = getCurrentUser()
        if (!loggedInUser) {
          alert("Please log in to manage favorites")
          return
        }

        if (isFavorite) {
          // Remove from favorites
          const result = await removeFavorite(loggedInUser.uid, meal.idMeal)
          if (result.success) {
            isFavorite = false
            addToFavoritesBtn.innerHTML = '<i class="ri-heart-line"></i> Add to Favorites'
            alert(result.message)

            // Reload favorites to reflect changes
            loadFavorites(loggedInUser.uid)
          } else {
            alert(result.error || "Error removing from favorites")
          }
        } else {
          // Add to favorites
          const result = await addFavorite(loggedInUser.uid, meal.idMeal)
          if (result.success) {
            isFavorite = true
            addToFavoritesBtn.innerHTML = '<i class="ri-heart-fill"></i> Remove from Favorites'
            alert(result.message)

            // Reload favorites to reflect changes
            loadFavorites(loggedInUser.uid)
          } else {
            alert(result.error || "Error adding to favorites")
          }
        }
      })
    }
  } catch (error) {
    console.error("Error showing meal details:", error)
    modalContent.innerHTML = "<p>Error loading meal details. Please try again.</p>"
  }
}

// Close modal when clicking the close button or outside the modal
document.addEventListener("click", (e) => {
  const profileMealDetailModal = document.getElementById("profileMealDetailModal")

  if (e.target.classList.contains("close-profile-modal") && profileMealDetailModal) {
    profileMealDetailModal.style.display = "none"
  }

  if (e.target === profileMealDetailModal) {
    profileMealDetailModal.style.display = "none"
  }
})
