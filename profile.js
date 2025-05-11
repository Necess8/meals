// profile.js

// DOM elements
const favoritesMealsContainer = document.getElementById("favorite-meals")
const ratedMealsContainer = document.getElementById("rated-meals")
const noFavoritesMessage = document.getElementById("no-favorites")
const noRatingsMessage = document.getElementById("no-ratings")
const profileMealDetailModal = document.getElementById("profileMealDetailModal")
const profileMealDetailContent = document.getElementById("profileMealDetailContent")
const closeProfileModalBtn = document.querySelector(".close-profile-modal")
const removeFromFavoritesBtn = document.getElementById("profile-remove-favorite")
const watchVideoBtn = document.getElementById("profile-watch-video")
const searchInput = document.getElementById("searchInput")
const searchBtn = document.getElementById("searchBtn")

// Initialize profile page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Check if user is logged in
    const user = await getCurrentUser()
    if (!user) {
      window.location.href = "index.html"
      return
    }

    // Display username
    const usernameDisplay = document.getElementById("usernameDisplay")
    if (usernameDisplay) {
      usernameDisplay.textContent = user.displayName || user.email
    }

    // Load user's favorite meals
    loadFavoriteMeals(user.uid)

    // Load user's rated meals
    loadRatedMeals(user.uid)

    // Set up event listeners
    setupEventListeners()
  } catch (error) {
    console.error("Error initializing profile page:", error)
  }
})

// Load user's favorite meals
async function loadFavoriteMeals(userId) {
  try {
    if (!favoritesMealsContainer) return

    // Show loading state
    favoritesMealsContainer.innerHTML = `
      <div class="meal-card skeleton-loader"></div>
      <div class="meal-card skeleton-loader"></div>
      <div class="meal-card skeleton-loader"></div>
    `

    // Get user's favorites
    const favorites = await getUserFavorites(userId)

    if (favorites.length === 0) {
      favoritesMealsContainer.innerHTML = ""
      if (noFavoritesMessage) {
        noFavoritesMessage.style.display = "block"
      }
      return
    }

    // Hide no favorites message
    if (noFavoritesMessage) {
      noFavoritesMessage.style.display = "none"
    }

    // Fetch meal details for each favorite
    const mealPromises = favorites.map(async (favorite) => {
      const mealData = await fetchMealById(favorite.mealId)
      if (mealData) {
        // Get user's rating for this meal
        const userRating = await getUserRating(userId, favorite.mealId)
        mealData.userRating = userRating
        return mealData
      }
      return null
    })

    const meals = (await Promise.all(mealPromises)).filter((meal) => meal !== null)

    // Display favorite meals
    favoritesMealsContainer.innerHTML = ""
    meals.forEach((meal) => {
      const mealCard = createMealCard(meal, true)
      favoritesMealsContainer.appendChild(mealCard)
    })
  } catch (error) {
    console.error("Error loading favorite meals:", error)
    favoritesMealsContainer.innerHTML = "<p>Error loading favorite meals. Please try again.</p>"
  }
}

// Load user's rated meals
async function loadRatedMeals(userId) {
  try {
    if (!ratedMealsContainer) return

    // Show loading state
    ratedMealsContainer.innerHTML = `
      <div class="meal-card skeleton-loader"></div>
      <div class="meal-card skeleton-loader"></div>
      <div class="meal-card skeleton-loader"></div>
    `

    // Get user's ratings
    const ratings = await getUserRatings(userId)

    if (ratings.length === 0) {
      ratedMealsContainer.innerHTML = ""
      if (noRatingsMessage) {
        noRatingsMessage.style.display = "block"
      }
      return
    }

    // Hide no ratings message
    if (noRatingsMessage) {
      noRatingsMessage.style.display = "none"
    }

    // Fetch meal details for each rated meal
    const mealPromises = ratings.map(async (rating) => {
      const mealData = await fetchMealById(rating.mealId)
      if (mealData) {
        mealData.userRating = rating.rating
        return mealData
      }
      return null
    })

    const meals = (await Promise.all(mealPromises)).filter((meal) => meal !== null)

    // Sort by rating (highest first)
    meals.sort((a, b) => b.userRating - a.userRating)

    // Display rated meals
    ratedMealsContainer.innerHTML = ""
    meals.forEach((meal) => {
      const mealCard = createMealCard(meal, false)
      ratedMealsContainer.appendChild(mealCard)
    })
  } catch (error) {
    console.error("Error loading rated meals:", error)
    ratedMealsContainer.innerHTML = "<p>Error loading rated meals. Please try again.</p>"
  }
}

// Create meal card
function createMealCard(meal, isFavorite) {
  const card = document.createElement("div")
  card.className = "meal-card"
  card.dataset.id = meal.idMeal
  card.dataset.isFavorite = isFavorite

  card.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
    <div class="meal-card-content">
      <h3>${meal.strMeal}</h3>
      <p>${meal.strCategory || "Category not available"}</p>
      
      <div class="rating-container">
        <div class="user-rating" data-meal-id="${meal.idMeal}" data-user-rating="${meal.userRating || 0}">
          <span class="your-rating-label">Your rating:</span>
          <div class="stars">
            ${generateRatingStars(meal.userRating || 0)}
          </div>
        </div>
      </div>
      
      <div class="meal-card-actions">
        <button class="view-recipe" data-id="${meal.idMeal}">View Recipe</button>
        ${
          isFavorite
            ? `<button class="remove-favorite" data-id="${meal.idMeal}"><i class="ri-heart-fill"></i> Remove</button>`
            : `<button class="view-ingredients" data-id="${meal.idMeal}">Ingredients</button>`
        }
      </div>
    </div>
  `

  // Add event listeners
  card.addEventListener("click", () => showMealDetail(meal, isFavorite))

  const viewRecipeBtn = card.querySelector(".view-recipe")
  viewRecipeBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    showMealDetail(meal, isFavorite, "recipe")
  })

  if (isFavorite) {
    const removeFavoriteBtn = card.querySelector(".remove-favorite")
    removeFavoriteBtn.addEventListener("click", async (e) => {
      e.stopPropagation()
      await handleRemoveFavorite(meal.idMeal)
    })
  } else {
    const viewIngredientsBtn = card.querySelector(".view-ingredients")
    viewIngredientsBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      showMealDetail(meal, isFavorite, "ingredients")
    })
  }

  // Set up rating functionality
  const ratingStars = card.querySelectorAll(".user-rating .stars i")
  ratingStars.forEach((star) => {
    star.addEventListener("click", async (e) => {
      e.stopPropagation()
      const user = await getCurrentUser()
      if (user) {
        const rating = Number.parseInt(e.target.dataset.rating)
        await rateMeal(user.uid, meal.idMeal, rating)
        updateStarDisplay(card, rating)

        // Reload rated meals to reflect changes
        loadRatedMeals(user.uid)
      }
    })

    // Hover effect
    star.addEventListener("mouseover", (e) => {
      e.stopPropagation()
      const rating = Number.parseInt(e.target.dataset.rating)
      const stars = card.querySelectorAll(".user-rating .stars i")

      stars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add("ri-poker-hearts-fill")
          s.classList.remove("ri-poker-hearts-line")
        } else {
          s.classList.add("ri-poker-hearts-line")
          s.classList.remove("ri-poker-hearts-fill")
        }
      })
    })

    // Reset on mouseout if not rated
    star.addEventListener("mouseout", (e) => {
      e.stopPropagation()
      const currentRating = Number.parseInt(card.querySelector(".user-rating").dataset.userRating || "0")
      updateStarDisplay(card, currentRating)
    })
  })

  return card
}

// Helper function to generate rating stars HTML
function generateRatingStars(rating) {
  let starsHTML = ""

  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      starsHTML += `<i class="ri-poker-hearts-fill" data-rating="${i}"></i>`
    } else {
      starsHTML += `<i class="ri-poker-hearts-line" data-rating="${i}"></i>`
    }
  }

  return starsHTML
}

// Update star display
function updateStarDisplay(container, rating) {
  const stars = container.querySelectorAll(".user-rating .stars i")

  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("ri-poker-hearts-fill")
      star.classList.remove("ri-poker-hearts-line")
    } else {
      star.classList.add("ri-poker-hearts-line")
      star.classList.remove("ri-poker-hearts-fill")
    }
  })
}

// Show meal detail in modal
function showMealDetail(meal, isFavorite, viewMode) {
  profileMealDetailModal.style.display = "block"
  profileMealDetailContent.innerHTML = `
    <div class="meal-detail">
      <h2>${meal.strMeal}</h2>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <p>${meal.strCategory || "Category not available"}</p>
      ${
        viewMode === "recipe"
          ? `<p><strong>Instructions:</strong> ${meal.strInstructions}</p>`
          : `<p><strong>Ingredients:</strong> ${meal.strIngredients || "Ingredients not available"}</p>`
      }
      <button id="closeProfileModal" class="btn btn-secondary">Close</button>
    </div>
  `

  closeProfileModalBtn.addEventListener("click", () => {
    profileMealDetailModal.style.display = "none"
  })
}

// Remove meal from favorites
async function handleRemoveFavorite(mealId) {
  const user = await getCurrentUser()
  if (user) {
    await removeFavorite(user.uid, mealId)
    loadFavoriteMeals(user.uid)
  }
}

// Set up event listeners for search
function setupEventListeners() {
  searchBtn.addEventListener("click", () => handleSearch())

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  })
}

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase()
  if (query) {
    window.location.href = `search.html?q=${encodeURIComponent(query)}`
  }
}
