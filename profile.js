import { getCurrentUser } from "./auth.js"
import { getUserFavorites, getUserRatings, removeFavorite, rateMeal, getUserRating } from "./firebase-db.js"

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

// Show meal detail
async function showMealDetail(meal, isFavorite, activeTab = "recipe") {
  if (!profileMealDetailModal || !profileMealDetailContent) return

  // Show loading state
  profileMealDetailContent.innerHTML = `
    <div class="meal-detail-skeleton">
      <div class="meal-image skeleton-loader"></div>
      <div class="meal-title skeleton-loader"></div>
      <div class="meal-category skeleton-loader"></div>
      <div class="meal-ingredients skeleton-loader"></div>
      <div class="meal-instructions skeleton-loader"></div>
    </div>
  `

  profileMealDetailModal.style.display = "block"

  try {
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
    const user = await getCurrentUser()
    let userRating = 0
    if (user) {
      userRating = await getUserRating(user.uid, meal.idMeal)
    }

    // Create HTML content
    profileMealDetailContent.innerHTML = `
      <div class="meal-detail-header">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-detail-header-content">
          <h2>${meal.strMeal}</h2>
          <p>Category: ${meal.strCategory}</p>
          <p>Origin: ${meal.strArea}</p>
          
          <div class="meal-detail-ratings">
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

    if (recipeTab && ingredientsTab && recipeContent && ingredientsContent) {
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
    }

    // Set up rating functionality in modal
    const ratingStars = profileMealDetailContent.querySelectorAll(".meal-detail-rating .stars i")
    ratingStars.forEach((star) => {
      star.addEventListener("click", async (e) => {
        if (user) {
          const rating = Number.parseInt(e.target.dataset.rating)
          await rateMeal(user.uid, meal.idMeal, rating)

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
          profileMealDetailContent.querySelector(".meal-detail-rating").dataset.userRating = rating

          // Reload rated meals to reflect changes
          loadRatedMeals(user.uid)
        } else {
          alert("Please log in to rate meals.")
        }
      })
    })

    // Set up watch video button
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

    // Set up remove from favorites button
    if (removeFromFavoritesBtn) {
      if (isFavorite) {
        removeFromFavoritesBtn.dataset.id = meal.idMeal
        removeFromFavoritesBtn.style.display = "block"

        // Clear previous event listeners
        const newRemoveBtn = removeFromFavoritesBtn.cloneNode(true)
        removeFromFavoritesBtn.parentNode.replaceChild(newRemoveBtn, removeFromFavoritesBtn)

        // Add new event listener
        newRemoveBtn.addEventListener("click", async () => {
          await handleRemoveFavorite(meal.idMeal)
          profileMealDetailModal.style.display = "none"
        })
      } else {
        removeFromFavoritesBtn.style.display = "none"
      }
    }
  } catch (error) {
    console.error("Error showing meal details:", error)
    profileMealDetailContent.innerHTML = "<p>Error loading meal details. Please try again.</p>"
  }
}

// Handle remove favorite
async function handleRemoveFavorite(mealId) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      alert("Please log in to manage favorites.")
      return
    }

    const confirmed = confirm("Are you sure you want to remove this meal from your favorites?")
    if (!confirmed) return

    await removeFavorite(user.uid, mealId)

    // Reload favorites to reflect changes
    loadFavoriteMeals(user.uid)

    // Close modal if open
    if (profileMealDetailModal && profileMealDetailModal.style.display === "block") {
      profileMealDetailModal.style.display = "none"
    }
  } catch (error) {
    console.error("Error removing favorite:", error)
    alert("Error removing favorite. Please try again.")
  }
}

// Set up event listeners
function setupEventListeners() {
  // Close modal
  if (closeProfileModalBtn) {
    closeProfileModalBtn.addEventListener("click", () => {
      profileMealDetailModal.style.display = "none"
    })
  }

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === profileMealDetailModal) {
      profileMealDetailModal.style.display = "none"
    }
  })

  // Search functionality
  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      const query = searchInput.value.trim()
      if (query) {
        window.location.href = `userpage.html?search=${encodeURIComponent(query)}`
      }
    })

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim()
        if (query) {
          window.location.href = `userpage.html?search=${encodeURIComponent(query)}`
        }
      }
    })
  }

  // Sign out button
  const signOutBtn = document.getElementById("signOutBtn")
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async (e) => {
      e.preventDefault()
      try {
        // Import the signOut function from auth.js
        const { signOut } = await import("./auth.js")
        await signOut()
        window.location.href = "index.html"
      } catch (error) {
        console.error("Error signing out:", error)
      }
    })
  }

  // Mobile menu
  const menuBtn = document.querySelector(".menuBtn")
  const navLinks = document.querySelector(".nav-link")

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active")
    })
  }
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

  // Store the current rating
  container.querySelector(".user-rating").dataset.userRating = rating
}

// Fetch meal by ID
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
