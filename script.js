import { signOutUser, getCurrentUser, checkAuthState } from "./auth.js"
import {
  addFavorite,
  removeFavorite,
  getUserRating,
  getAverageRating,
  addRating,
  isMealFavorited,
} from "./firebase-db.js"

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
    } else if (!window.location.href.includes("index.html")) {
      // If not logged in and not on index page, redirect to login
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

  // Toggle sign in/register view
  const container = document.querySelector(".container")
  const registerBtn = document.querySelector(".registerr-btn")
  const loginBtn = document.querySelector(".loginn-btn")

  if (registerBtn && loginBtn && container) {
    registerBtn.addEventListener("click", () => {
      container.classList.add("active")
    })

    loginBtn.addEventListener("click", () => {
      container.classList.remove("active")
    })
  }

  // Header slider
  const listInfo = document.querySelector(".list-info")
  const listImgs = document.querySelectorAll(".list-img .item")
  const nextBtn = document.querySelector(".next-btn")
  const prevBtn = document.querySelector(".prev-btn")

  let index = 0

  if (nextBtn && prevBtn && listImgs.length > 0) {
    nextBtn.addEventListener("click", () => {
      // Remove current active image
      listImgs[index].classList.remove("active")

      // Update index
      index = (index + 1) % listImgs.length

      // Add active to new image
      listImgs[index].classList.add("active")

      // Move listInfo (if you have multiple sections for text)
      if (listInfo) {
        listInfo.style.transform = `translateY(${index * -20}%)`
      }
    })

    prevBtn.addEventListener("click", () => {
      listImgs[index].classList.remove("active")
      index = (index - 1 + listImgs.length) % listImgs.length
      listImgs[index].classList.add("active")
      if (listInfo) {
        listInfo.style.transform = `translateY(${index * -20}%)`
      }
    })
  }

  // Initialize Swiper if it exists on the page
  const swiperElement = document.querySelector(".mySwiper")
  if (swiperElement && typeof Swiper !== "undefined") {
    // Swiper is available, initialize it
    const swiper = new Swiper(".mySwiper", {
      slidesPerView: 3,
      spaceBetween: 30,
      loop: false,
      pagination: {
        el: ".my-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        640: {
          slidesPerView: 2,
          spaceBetween: 20,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 30,
        },
      },
    })
  }

  // Load featured meals (top 5 highest rated)
  loadTopRatedMeals()

  // Load all meals (first page)
  loadAllMeals()

  // Load cuisines if on cuisines page
  if (document.getElementById("cuisines-grid")) {
    loadAllCuisines()
  }

  // Check if we need to load a specific cuisine from URL parameter
  const urlParams = new URLSearchParams(window.location.search)
  const area = urlParams.get("area")
  if (area && document.getElementById("cuisine-meals-section")) {
    loadCuisineMeals(area)
  }

  // Set up back to cuisines button
  const backToCuisinesBtn = document.getElementById("back-to-cuisines")
  if (backToCuisinesBtn) {
    backToCuisinesBtn.addEventListener("click", () => {
      const cuisinesGridSection = document.getElementById("cuisines-grid-section")
      const cuisineMealsSection = document.getElementById("cuisine-meals-section")

      if (cuisinesGridSection && cuisineMealsSection) {
        cuisinesGridSection.style.display = "block"
        cuisineMealsSection.style.display = "none"

        // Update URL parameter without reloading the page
        const url = new URL(window.location)
        url.searchParams.delete("area")
        window.history.pushState({}, "", url)
      }
    })
  }

  // Set up sorting and filtering
  const sortSelect = document.getElementById("sort-select")
  const categoryFilter = document.getElementById("category-filter")

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      sortMeals(sortSelect.value)
    })
  }

  if (categoryFilter) {
    // Load categories first
    loadCategories()

    categoryFilter.addEventListener("change", () => {
      filterMealsByCategory(categoryFilter.value)
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

// API Functions
async function fetchMealsByFirstLetter(letter) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`)
    const data = await response.json()
    return data.meals || []
  } catch (error) {
    console.error("Error fetching meals by letter:", error)
    return []
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

async function fetchRandomMeals(count = 6) {
  try {
    const meals = []
    for (let i = 0; i < count; i++) {
      const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php")
      const data = await response.json()
      if (data.meals && data.meals[0]) {
        meals.push(data.meals[0])
      }
    }
    return meals
  } catch (error) {
    console.error("Error fetching random meals:", error)
    return []
  }
}

async function fetchMealsByArea(area) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`)
    const data = await response.json()
    return data.meals || []
  } catch (error) {
    console.error("Error fetching meals by area:", error)
    return []
  }
}

async function fetchAllAreas() {
  try {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list")
    const data = await response.json()
    return data.meals || []
  } catch (error) {
    console.error("Error fetching areas:", error)
    return []
  }
}

async function fetchAllCategories() {
  try {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list")
    const data = await response.json()
    return data.meals || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

async function fetchMealsByCategory(category) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`)
    const data = await response.json()
    return data.meals || []
  } catch (error) {
    console.error("Error fetching meals by category:", error)
    return []
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

// UI Functions
async function loadTopRatedMeals() {
  const featuredContainer = document.getElementById("featured-meals-container")
  if (!featuredContainer) return

  featuredContainer.innerHTML = "" // Clear skeleton loaders

  try {
    // Get random meals instead of trying to sort by rating
    const meals = await fetchRandomMeals(5)

    // For each meal, get its average rating
    for (const meal of meals) {
      const avgRating = await getAverageRating(meal.idMeal)
      meal.avgRating = avgRating
    }

    // Sort by rating (highest first)
    meals.sort((a, b) => b.avgRating - a.avgRating)

    for (const meal of meals) {
      const mealCard = await createFeaturedMealCard(meal)
      featuredContainer.appendChild(mealCard)
    }
  } catch (error) {
    console.error("Error loading top rated meals:", error)
  }
}

async function createFeaturedMealCard(meal) {
  const card = document.createElement("div");
  card.className = "swiper-slide card";
  card.dataset.id = meal.idMeal;

  const avgRating = meal.avgRating || 0;

  let isFavorite = false;
  const currentUser = getCurrentUser();
  if (currentUser) {
    isFavorite = await isMealFavorited(currentUser.uid, meal.idMeal);
  }

  card.innerHTML = `
    <div class="card-content">
      <div class="image">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      </div>
      <div class="name-category">
        <span class="name" title="${meal.strMeal}">${meal.strMeal}</span>
        <span class="category">${meal.strCategory}</span>
      </div>

      <div class="rating-container">
        <div class="avg-rating" title="Average rating: ${avgRating}">
          <span class="avg-rating-label">Avg: ${avgRating}</span>
          <div class="avg-rating-stars">
            ${generateRatingStars(avgRating)}
          </div>
        </div>

        <div class="rating" data-meal-id="${meal.idMeal}">
          <span class="your-rating-label">Your rating:</span>
          <i class="ri-poker-hearts-line" data-rating="1"></i>
          <i class="ri-poker-hearts-line" data-rating="2"></i>
          <i class="ri-poker-hearts-line" data-rating="3"></i>
          <i class="ri-poker-hearts-line" data-rating="4"></i>
          <i class="ri-poker-hearts-line" data-rating="5"></i>
        </div>
      </div>

      <div class="button">
        <button class="recipe" data-id="${meal.idMeal}">See Recipe</button>
        <button class="ingredient" data-id="${meal.idMeal}">Ingredients</button>
        <button class="favorite" data-id="${meal.idMeal}">
          <i class="ri-heart-${isFavorite ? "fill" : "line"}"></i>
        </button>
      </div>
    </div>
  `;

  // Event listeners
  const recipeBtn = card.querySelector(".recipe");
  const ingredientBtn = card.querySelector(".ingredient");
  const favoriteBtn = card.querySelector(".favorite");
  const ratingStars = card.querySelectorAll(".rating i");

  recipeBtn.addEventListener("click", () => showMealDetail(meal.idMeal));
  ingredientBtn.addEventListener("click", () => showMealDetail(meal.idMeal, "ingredients"));

  favoriteBtn.addEventListener("click", async () => {
    const loggedInUser = getCurrentUser();
    if (!loggedInUser) {
      alert("Please log in to add favorites");
      return;
    }

    const icon = favoriteBtn.querySelector("i");
    const isFilled = icon.classList.contains("ri-heart-fill");

    if (isFilled) {
      const result = await removeFavorite(loggedInUser.uid, meal.idMeal);
      if (result.success) {
        icon.classList.remove("ri-heart-fill");
        icon.classList.add("ri-heart-line");
        alert(result.message);
      } else {
        alert(result.error || "Error removing from favorites");
      }
    } else {
      const result = await addFavorite(loggedInUser.uid, meal.idMeal);
      if (result.success) {
        icon.classList.remove("ri-heart-line");
        icon.classList.add("ri-heart-fill");
        alert(result.message);
      } else {
        alert(result.error || "Error adding to favorites");
      }
    }
  });

  // Rating interactions
  ratingStars.forEach((star) => {
    star.addEventListener("click", async (e) => {
      const loggedInUser = getCurrentUser();
      if (!loggedInUser) {
        alert("Please log in to rate meals");
        return;
      }

      const rating = Number.parseInt(e.target.dataset.rating);
      await addRating(loggedInUser.uid, meal.idMeal, rating);
      updateStarDisplay(card, rating);

      const newAvgRating = await getAverageRating(meal.idMeal);
      updateAverageRatingDisplay(meal.idMeal, newAvgRating);
    });

    star.addEventListener("mouseover", (e) => {
      const rating = Number.parseInt(e.target.dataset.rating);
      ratingStars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add("ri-poker-hearts-fill");
          s.classList.remove("ri-poker-hearts-line");
        } else {
          s.classList.add("ri-poker-hearts-line");
          s.classList.remove("ri-poker-hearts-fill");
        }
      });
    });

    star.addEventListener("mouseout", () => {
      const currentRating = Number.parseInt(card.querySelector(".rating").dataset.userRating || "0");
      updateStarDisplay(card, currentRating);
    });
  });

  // Fetch and display user's rating
  if (currentUser) {
    const rating = await getUserRating(currentUser.uid, meal.idMeal);
    if (rating > 0) {
      card.querySelector(".rating").dataset.userRating = rating;
      updateStarDisplay(card, rating);
    }
  }

  return card;
}



function updateStarDisplay(container, rating) {
  const stars = container.querySelectorAll(".rating i, .meal-rating i")

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
  const ratingContainer = container.querySelector(".rating, .meal-rating")
  if (ratingContainer) {
    ratingContainer.dataset.userRating = rating
  }
}

async function rateMeal(mealId, rating) {
  try {
    const loggedInUser = getCurrentUser()
    if (!loggedInUser) {
      alert("Please log in to rate meals")
      return
    }

    await addRating(loggedInUser.uid, mealId, rating)

    // Get new average rating
    const avgRating = await getAverageRating(mealId)

    // Update UI
    updateAverageRatingDisplay(mealId, avgRating)

    console.log(`Meal ${mealId} rated ${rating} stars`)
  } catch (error) {
    console.error("Error rating meal:", error)
    alert("Error rating meal. Please try again.")
  }
}

function updateAverageRatingDisplay(mealId, avgRating) {
  // Update average rating in all meal cards with this ID
  document.querySelectorAll(`[data-id="${mealId}"]`).forEach((card) => {
    const avgRatingElement = card.querySelector(".avg-rating")
    if (avgRatingElement) {
      avgRatingElement.querySelector(".avg-rating-label").textContent = `Avg: ${avgRating}`
      avgRatingElement.title = `Average rating: ${avgRating}`
      avgRatingElement.querySelector(".avg-rating-stars").innerHTML = generateRatingStars(avgRating)
    }
  })

  // Update in modal if open
  const modal = document.getElementById("mealDetailModal")
  if (modal && modal.style.display === "block") {
    const modalAvgRating = modal.querySelector(".meal-detail-avg-rating")
    if (modalAvgRating && modalAvgRating.dataset.mealId === mealId) {
      modalAvgRating.querySelector("p").textContent = `Average Rating: ${avgRating}`
      modalAvgRating.querySelector(".stars").innerHTML = generateRatingStars(avgRating)
    }
  }
}

let currentPage = 1
const mealsPerPage = 12
let allMealsList = []
let filteredMealsList = []
let currentSortOption = "default"
let currentCategoryFilter = "all"

async function loadAllMeals() {
  const allMealsContainer = document.getElementById("all-meals")
  if (!allMealsContainer) return

  allMealsContainer.innerHTML = "" // Clear skeleton loaders

  try {
    // If we haven't loaded meals yet, fetch them
    if (allMealsList.length === 0) {
      // Get meals starting with different letters to get a good variety
      const letters = ["a", "b", "c", "s", "m", "p"]
      for (const letter of letters) {
        const meals = await fetchMealsByFirstLetter(letter)
        allMealsList = [...allMealsList, ...meals]
      }

      // Remove duplicates
      allMealsList = [...new Map(allMealsList.map((meal) => [meal.idMeal, meal])).values()]

      // Initialize filtered list
      filteredMealsList = [...allMealsList]
    }

    // Display current page
    displayMealsPage(currentPage)

    // Set up pagination
    setupPagination()
  } catch (error) {
    console.error("Error loading all meals:", error)
  }
}

async function displayMealsPage(page, append = false) {
  const allMealsContainer = document.getElementById("all-meals")
  if (!allMealsContainer) return

  const startIndex = (page - 1) * mealsPerPage
  const endIndex = startIndex + mealsPerPage
  const mealsToDisplay = filteredMealsList.slice(startIndex, endIndex)

  if (!append) {
    allMealsContainer.innerHTML = ""
  }

  for (const meal of mealsToDisplay) {
    // Get average rating for each meal
    const avgRating = await getAverageRating(meal.idMeal)
    meal.avgRating = avgRating

    const mealCard = await createMealCard(meal)
    allMealsContainer.appendChild(mealCard)
  }
}

function setupPagination() {
  const paginationContainer = document.getElementById("pagination")
  if (!paginationContainer) return

  paginationContainer.innerHTML = ""

  const totalPages = Math.ceil(filteredMealsList.length / mealsPerPage)

  // Previous button
  if (currentPage > 1) {
    const prevButton = document.createElement("button")
    prevButton.className = "pagination-button"
    prevButton.innerHTML = "&laquo; Prev"
    prevButton.addEventListener("click", () => {
      currentPage--
      displayMealsPage(currentPage)
      setupPagination()
      window.scrollTo(0, document.getElementById("all-meals-section").offsetTop - 100)
    })
    paginationContainer.appendChild(prevButton)
  }

  // Page numbers
  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, currentPage + 2)

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button")
    pageButton.className = `pagination-button ${i === currentPage ? "active" : ""}`
    pageButton.textContent = i
    pageButton.addEventListener("click", () => {
      currentPage = i
      displayMealsPage(currentPage)
      setupPagination()
      window.scrollTo(0, document.getElementById("all-meals-section").offsetTop - 100)
    })
    paginationContainer.appendChild(pageButton)
  }

  // Next button
  if (currentPage < totalPages) {
    const nextButton = document.createElement("button")
    nextButton.className = "pagination-button"
    nextButton.innerHTML = "Next &raquo;"
    nextButton.addEventListener("click", () => {
      currentPage++
      displayMealsPage(currentPage)
      setupPagination()
      window.scrollTo(0, document.getElementById("all-meals-section").offsetTop - 100)
    })
    paginationContainer.appendChild(nextButton)
  }
}

async function createMealCard(meal) {
  if (!meal || !meal.idMeal || !meal.strMeal) {
    console.error("Invalid meal data:", meal)
    return document.createElement("div") // Return empty div to avoid errors
  }

  const card = document.createElement("div")
  card.className = "meal-card"
  card.dataset.id = meal.idMeal

  // Get the average rating
  const avgRating = meal.avgRating || 0

  // Check if meal is favorited by current user
  let isFavorite = false
  const loggedInUser = getCurrentUser()
  if (loggedInUser) {
    isFavorite = await isMealFavorited(loggedInUser.uid, meal.idMeal)
  }

  card.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
    <div class="meal-card-content">
      <h3>${meal.strMeal}</h3>
      <p>${meal.strCategory || "Category not available"}</p>
      
      <div class="rating-container">
        <div class="avg-rating" title="Average rating: ${avgRating}">
          <span class="avg-rating-label">Avg: ${avgRating}</span>
          <div class="avg-rating-stars">
            ${generateRatingStars(avgRating)}
          </div>
        </div>
        
        <div class="meal-rating" data-meal-id="${meal.idMeal}">
          <span class="your-rating-label">Your rating:</span>
          <i class="ri-poker-hearts-line" data-rating="1"></i>
          <i class="ri-poker-hearts-line" data-rating="2"></i>
          <i class="ri-poker-hearts-line" data-rating="3"></i>
          <i class="ri-poker-hearts-line" data-rating="4"></i>
          <i class="ri-poker-hearts-line" data-rating="5"></i>
        </div>
      </div>
      
      <div class="meal-card-actions">
        <button class="view-recipe" data-id="${meal.idMeal}">View Recipe</button>
        <button class="view-ingredients" data-id="${meal.idMeal}">Ingredients</button>
        <button class="${isFavorite ? "remove-favorite" : "add-favorite"}" data-id="${meal.idMeal}">
          <i class="ri-heart-${isFavorite ? "fill" : "line"}"></i>
        </button>
      </div>
    </div>
  `

  // Add event listeners
  card.addEventListener("click", (e) => {
    // Only trigger if the click is directly on the card (not on a button or other interactive element)
    if (e.target === card || e.target.tagName === "IMG" || e.target.tagName === "H3" || e.target.tagName === "P") {
      showMealDetail(meal.idMeal)
    }
  })

  const viewRecipeBtn = card.querySelector(".view-recipe")
  const viewIngredientsBtn = card.querySelector(".view-ingredients")
  const favoriteBtn = card.querySelector(".add-favorite, .remove-favorite")
  const ratingStars = card.querySelectorAll(".meal-rating i")

  viewRecipeBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    showMealDetail(meal.idMeal, "recipe")
  })

  viewIngredientsBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    showMealDetail(meal.idMeal, "ingredients")
  })

  favoriteBtn.addEventListener("click", async (e) => {
    e.stopPropagation()

    const loggedInUser = getCurrentUser()
    if (!loggedInUser) {
      alert("Please log in to manage favorites")
      return
    }

    const isAdding = favoriteBtn.classList.contains("add-favorite")

    if (isAdding) {
      // Add to favorites
      const result = await addFavorite(loggedInUser.uid, meal.idMeal)
      if (result.success) {
        favoriteBtn.classList.remove("add-favorite")
        favoriteBtn.classList.add("remove-favorite")
        favoriteBtn.innerHTML = '<i class="ri-heart-fill"></i>'
        alert(result.message)
      } else {
        alert(result.error || "Error adding to favorites")
      }
    } else {
      // Remove from favorites
      const result = await removeFavorite(loggedInUser.uid, meal.idMeal)
      if (result.success) {
        favoriteBtn.classList.remove("remove-favorite")
        favoriteBtn.classList.add("add-favorite")
        favoriteBtn.innerHTML = '<i class="ri-heart-line"></i>'
        alert(result.message)
      } else {
        alert(result.error || "Error removing from favorites")
      }
    }
  })

  // Set up rating functionality
  ratingStars.forEach((star) => {
    star.addEventListener("click", async (e) => {
      e.stopPropagation()

      const loggedInUser = getCurrentUser()
      if (!loggedInUser) {
        alert("Please log in to rate meals")
        return
      }

      const rating = Number.parseInt(e.target.dataset.rating)
      await addRating(loggedInUser.uid, meal.idMeal, rating)
      updateStarDisplay(card, rating)

      // Update average rating
      const newAvgRating = await getAverageRating(meal.idMeal)
      updateAverageRatingDisplay(meal.idMeal, newAvgRating)
    })

    // Hover effect
    star.addEventListener("mouseover", (e) => {
      e.stopPropagation()
      const rating = Number.parseInt(e.target.dataset.rating)
      const stars = card.querySelectorAll(".meal-rating i")

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
      const currentRating = Number.parseInt(card.querySelector(".meal-rating").dataset.userRating || "0")
      updateStarDisplay(card, currentRating)
    })
  })

  // Get and display user's rating
  if (loggedInUser) {
    const rating = await getUserRating(loggedInUser.uid, meal.idMeal)
    if (rating > 0) {
      card.querySelector(".meal-rating").dataset.userRating = rating
      updateStarDisplay(card, rating)
    }
  }

  return card
}

// This is the fixed version of the showMealDetail function
async function showMealDetail(id, activeTab = "recipe") {
  console.log(`Showing meal detail for ID: ${id}, tab: ${activeTab}`)

  // First, check if we're on the right page and if the modals exist
  const modal = document.getElementById("mealDetailModal")
  const modalContent = document.getElementById("mealDetailContent")
  const cuisineModal = document.getElementById("cuisineMealDetailModal")
  const cuisineModalContent = document.getElementById("cuisineMealDetailContent")

  // Create modals if they don't exist
  if (!modal && !cuisineModal) {
    // Create a generic modal if none exists
    const newModal = document.createElement("div")
    newModal.id = "mealDetailModal"
    newModal.className = "modal"
    newModal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div id="mealDetailContent"></div>
      </div>
    `
    document.body.appendChild(newModal)

    // Now we can get the elements
    const modal = document.getElementById("mealDetailModal")
    const modalContent = document.getElementById("mealDetailContent")

    // Use these for the rest of the function
    var useModal = modal
    var useModalContent = modalContent
  } else {
    // Determine which modal to use based on context
    let useModal, useModalContent
    if (window.location.href.includes("cuisines.html") && cuisineModal && cuisineModalContent) {
      useModal = cuisineModal
      useModalContent = cuisineModalContent
    } else if (modal && modalContent) {
      useModal = modal
      useModalContent = modalContent
    } else {
      console.error("Modal elements not found")
      return
    }

    // Show loading state
    useModalContent.innerHTML = `
      <div class="meal-detail-skeleton">
        <div class="meal-image skeleton-loader"></div>
        <div class="meal-title skeleton-loader"></div>
        <div class="meal-category skeleton-loader"></div>
        <div class="meal-ingredients skeleton-loader"></div>
        <div class="meal-instructions skeleton-loader"></div>
      </div>
    `

    useModal.style.display = "block"

    try {
      const meal = await fetchMealById(id)
      if (!meal) {
        useModalContent.innerHTML = "<p>Meal details not found.</p>"
        return
      }

      // Rest of your existing showMealDetail function...
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
      useModalContent.innerHTML = `
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
          <button id="${useModal.id === "cuisineMealDetailModal" ? "cuisine-" : ""}recipe-tab" class="${activeTab === "recipe" ? "active" : ""}">Recipe</button>
          <button id="${useModal.id === "cuisineMealDetailModal" ? "cuisine-" : ""}ingredients-tab" class="${activeTab === "ingredients" ? "active" : ""}">Ingredients</button>
        </div>
        
        <div class="meal-detail-content">
          <div id="${useModal.id === "cuisineMealDetailModal" ? "cuisine-" : ""}recipe-content" style="display: ${activeTab === "recipe" ? "block" : "none"}">
            <h3>Instructions</h3>
            <div class="instructions">
              ${meal.strInstructions.replace(/\n/g, "<br>")}
            </div>
          </div>
          
          <div id="${useModal.id === "cuisineMealDetailModal" ? "cuisine-" : ""}ingredients-content" style="display: ${activeTab === "ingredients" ? "block" : "none"}">
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
      const recipeTabId = useModal.id === "cuisineMealDetailModal" ? "cuisine-recipe-tab" : "recipe-tab"
      const ingredientsTabId = useModal.id === "cuisineMealDetailModal" ? "cuisine-ingredients-tab" : "ingredients-tab"
      const recipeContentId = useModal.id === "cuisineMealDetailModal" ? "cuisine-recipe-content" : "recipe-content"
      const ingredientsContentId =
        useModal.id === "cuisineMealDetailModal" ? "cuisine-ingredients-content" : "ingredients-content"

      const recipeTab = document.getElementById(recipeTabId)
      const ingredientsTab = document.getElementById(ingredientsTabId)
      const recipeContent = document.getElementById(recipeContentId)
      const ingredientsContent = document.getElementById(ingredientsContentId)

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
      const ratingStars = useModalContent.querySelectorAll(".meal-detail-rating .stars i")
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
          useModalContent.querySelector(".meal-detail-rating").dataset.userRating = rating

          // Update average rating
          const newAvgRating = await getAverageRating(meal.idMeal)
          updateAverageRatingDisplay(meal.idMeal, newAvgRating)
        })
      })

      // Set up watch video button
      const watchVideoBtn = useModal.querySelector(
        useModal.id === "cuisineMealDetailModal" ? "#cuisine-watch-video" : "#watch-video",
      )
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
      const addToFavoritesBtn = useModal.querySelector(
        useModal.id === "cuisineMealDetailModal" ? "#cuisine-add-to-favorites" : "#add-to-favorites",
      )
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

              // Update heart icon in all meal cards
              document.querySelectorAll(`.meal-card[data-id="${meal.idMeal}"] .remove-favorite i`).forEach((icon) => {
                icon.classList.remove("ri-heart-fill")
                icon.classList.add("ri-heart-line")
                icon.parentElement.classList.remove("remove-favorite")
                icon.parentElement.classList.add("add-favorite")
              })
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

              // Update heart icon in all meal cards
              document.querySelectorAll(`.meal-card[data-id="${meal.idMeal}"] .add-favorite i`).forEach((icon) => {
                icon.classList.remove("ri-heart-line")
                icon.classList.add("ri-heart-fill")
                icon.parentElement.classList.remove("add-favorite")
                icon.parentElement.classList.add("remove-favorite")
              })
            } else {
              alert(result.error || "Error adding to favorites")
            }
          }
        })
      }
    } catch (error) {
      console.error("Error showing meal details:", error)
      useModalContent.innerHTML = "<p>Error loading meal details. Please try again.</p>"
    }
  }
}

// Also add this HTML to your page if it doesn't exist
function ensureModalsExist() {
  if (!document.getElementById("mealDetailModal")) {
    const modalHTML = `
      <div id="mealDetailModal" class="modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <div id="mealDetailContent"></div>
          <div class="modal-actions">
            <button id="watch-video" class="modal-action-button">
              <i class="ri-youtube-line"></i> Watch Video
            </button>
            <button id="add-to-favorites" class="modal-action-button">
              <i class="ri-heart-line"></i> Add to Favorites
            </button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML("beforeend", modalHTML)
  }

  if (!document.getElementById("cuisineMealDetailModal")) {
    const cuisineModalHTML = `
      <div id="cuisineMealDetailModal" class="modal">
        <div class="modal-content">
          <span class="close-cuisine-modal">&times;</span>
          <div id="cuisineMealDetailContent"></div>
          <div class="modal-actions">
            <button id="cuisine-watch-video" class="modal-action-button">
              <i class="ri-youtube-line"></i> Watch Video
            </button>
            <button id="cuisine-add-to-favorites" class="modal-action-button">
              <i class="ri-heart-line"></i> Add to Favorites
            </button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML("beforeend", cuisineModalHTML)
  }
}

// Call this function when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Your existing DOMContentLoaded code...

  // Add this line to ensure modals exist
  ensureModalsExist()
})

// Close modal when clicking the close button or outside the modal
document.addEventListener("click", (e) => {
  const mealDetailModal = document.getElementById("mealDetailModal")
  const cuisineMealDetailModal = document.getElementById("cuisineMealDetailModal")
  const profileMealDetailModal = document.getElementById("profileMealDetailModal")

  if (e.target.classList.contains("close-modal") && mealDetailModal) {
    mealDetailModal.style.display = "none"
  }

  if (e.target.classList.contains("close-cuisine-modal") && cuisineMealDetailModal) {
    cuisineMealDetailModal.style.display = "none"
  }

  if (e.target.classList.contains("close-profile-modal") && profileMealDetailModal) {
    profileMealDetailModal.style.display = "none"
  }

  if (e.target === mealDetailModal) {
    mealDetailModal.style.display = "none"
  }

  if (e.target === cuisineMealDetailModal) {
    cuisineMealDetailModal.style.display = "none"
  }

  if (e.target === profileMealDetailModal) {
    profileMealDetailModal.style.display = "none"
  }
})

// Cuisines page functionality
async function loadAllCuisines() {
  const cuisinesGrid = document.getElementById("cuisines-grid")
  if (!cuisinesGrid) return

  cuisinesGrid.innerHTML = "" // Clear skeleton loaders

  try {
    const areas = await fetchAllAreas()

    // Define some cuisine images (you can add more or use real images)
    const cuisineImages = {
      American: "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg",
      British: "https://www.themealdb.com/images/media/meals/sxxpst1468569714.jpg",
      Canadian: "https://www.themealdb.com/images/media/meals/wpputp1511812960.jpg",
      Chinese: "https://www.themealdb.com/images/media/meals/1529446137.jpg",
      Dutch: "https://www.themealdb.com/images/media/meals/lhqev81565090111.jpg",
      Egyptian: "https://www.themealdb.com/images/media/meals/g373701551209149.jpg",
      French: "https://www.themealdb.com/images/media/meals/qpxvuq1511798906.jpg",
      Greek: "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
      Indian: "https://www.themealdb.com/images/media/meals/2dsltq1560461468.jpg",
      Irish: "https://www.themealdb.com/images/media/meals/adxcbq1619787919.jpg",
      Italian: "https://www.themealdb.com/images/media/meals/x0fhfp1583141949.jpg",
      Jamaican: "https://www.themealdb.com/images/media/meals/qqwypw1504642429.jpg",
      Japanese: "https://www.themealdb.com/images/media/meals/g046bb1663960946.jpg",
      Kenyan: "https://www.themealdb.com/images/media/meals/7mxnzz1593350801.jpg",
      Malaysian: "https://www.themealdb.com/images/media/meals/wai9bw1619788844.jpg",
      Mexican: "https://www.themealdb.com/images/media/meals/uuyrrx1487327597.jpg",
      Moroccan: "https://www.themealdb.com/images/media/meals/58oia61564916529.jpg",
      Polish: "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg",
      Portuguese: "https://www.themealdb.com/images/media/meals/do7zps1614349775.jpg",
      Russian: "https://www.themealdb.com/images/media/meals/0206h11699013358.jpg",
      Spanish: "https://www.themealdb.com/images/media/meals/quuxsx1511476154.jpg",
      Thai: "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
      Tunisian: "https://www.themealdb.com/images/media/meals/7mxnzz1593350801.jpg",
      Turkish: "https://www.themealdb.com/images/media/meals/58oia61564916529.jpg",
      Vietnamese: "https://www.themealdb.com/images/media/meals/rvypwy1503069308.jpg",
    }

    areas.forEach((area) => {
      const cuisineCard = document.createElement("div")
      cuisineCard.className = "cuisine-card"
      cuisineCard.dataset.area = area.strArea

      // Get image for this cuisine or use a placeholder
      const cuisineImage = cuisineImages[area.strArea] || "https://www.themealdb.com/images/category/beef.png"

      cuisineCard.innerHTML = `
        <img src="${cuisineImage}" alt="${area.strArea} cuisine">
        <h3>${area.strArea}</h3>
        <p>Explore ${area.strArea} cuisine</p>
      `

      cuisineCard.addEventListener("click", () => {
        loadCuisineMeals(area.strArea)
      })

      cuisinesGrid.appendChild(cuisineCard)
    })
  } catch (error) {
    console.error("Error loading cuisines:", error)
    cuisinesGrid.innerHTML = "<p>Error loading cuisines. Please try again.</p>"
  }
}

// Store cuisine meals for sorting
let cuisineMealsList = []
let currentCuisineSortOption = "default"
let currentCuisineFilter = "all"

async function loadCuisineMeals(area) {
  const cuisinesGridSection = document.getElementById("cuisines-grid-section")
  const cuisineMealsSection = document.getElementById("cuisine-meals-section")
  const cuisineMeals = document.getElementById("cuisine-meals")
  const selectedCuisineTitle = document.getElementById("selected-cuisine-title")

  if (!cuisinesGridSection || !cuisineMealsSection || !cuisineMeals || !selectedCuisineTitle) return

  // Update URL parameter without reloading the page
  const url = new URL(window.location)
  url.searchParams.set("area", area)
  window.history.pushState({}, "", url)

  // Show cuisine meals section, hide cuisines grid
  cuisinesGridSection.style.display = "none"
  cuisineMealsSection.style.display = "block"

  // Update title
  selectedCuisineTitle.textContent = `${area} Cuisine`

  // Add sort options if they don't exist
  if (!document.getElementById("cuisine-sort-container")) {
    const sortContainer = document.createElement("div")
    sortContainer.id = "cuisine-sort-container"
    sortContainer.className = "sort-container"
    sortContainer.innerHTML = `
    <label for="cuisine-sort-select">Sort by:</label>
    <select id="cuisine-sort-select" class="sort-select">
      <option value="default">Default</option>
      <option value="a-z">Name (A-Z)</option>
      <option value="z-a">Name (Z-A)</option>
    </select>
    
    <label for="cuisine-category-filter" class="ml-4">Filter by Category:</label>
    <select id="cuisine-category-filter" class="sort-select">
      <option value="all">All Categories</option>
      <!-- Categories will be loaded dynamically -->
    </select>
  `

    // Find the correct container to insert the sort options
    const cuisineHeader = cuisineMealsSection.querySelector(".cuisine-header")
    if (cuisineHeader) {
      // Insert after the cuisine header
      cuisineHeader.parentNode.insertBefore(sortContainer, cuisineHeader.nextSibling)
    } else {
      // Fallback: just append to the cuisine meals section
      cuisineMealsSection.appendChild(sortContainer)
    }
  }

  // Show loading state
  cuisineMeals.innerHTML = `
    <div class="meal-card skeleton-loader"></div>
    <div class="meal-card skeleton-loader"></div>
    <div class="meal-card skeleton-loader"></div>
    <div class="meal-card skeleton-loader"></div>
  `

  try {
    const meals = await fetchMealsByArea(area)

    if (meals.length === 0) {
      cuisineMeals.innerHTML = `<p>No meals found for ${area} cuisine.</p>`
      return
    }

    // Reset and clear the cuisineMealsList
    cuisineMealsList = []

    // Fetch full details for each meal
    for (const meal of meals) {
      const fullMeal = await fetchMealById(meal.idMeal)
      if (fullMeal) {
        // Get average rating
        const avgRating = await getAverageRating(meal.idMeal)
        fullMeal.avgRating = avgRating
        cuisineMealsList.push(fullMeal)
      }
    }

    // Set up the event listeners for sorting and filtering
    const cuisineSortSelect = document.getElementById("cuisine-sort-select")
    const cuisineCategoryFilter = document.getElementById("cuisine-category-filter")

    if (cuisineSortSelect) {
      // Remove existing event listeners by cloning and replacing
      const newSortSelect = cuisineSortSelect.cloneNode(true)
      cuisineSortSelect.parentNode.replaceChild(newSortSelect, cuisineSortSelect)

      // Add new event listener
      newSortSelect.addEventListener("change", () => {
        currentCuisineSortOption = newSortSelect.value
        displayCuisineMeals()
      })
    }

    if (cuisineCategoryFilter) {
      // Load categories
      await loadCuisineCategories(area)

      // Remove existing event listeners by cloning and replacing
      const newCategoryFilter = cuisineCategoryFilter.cloneNode(true)
      cuisineCategoryFilter.parentNode.replaceChild(newCategoryFilter, cuisineCategoryFilter)

      // Add new event listener
      newCategoryFilter.addEventListener("change", () => {
        currentCuisineFilter = newCategoryFilter.value
        displayCuisineMeals()
      })
    }

    // Reset sort and filter options
    currentCuisineSortOption = "default"
    currentCuisineFilter = "all"

    // Display meals
    displayCuisineMeals()
  } catch (error) {
    console.error("Error loading cuisine meals:", error)
    cuisineMeals.innerHTML = `<p>Error loading meals for ${area} cuisine. Please try again.</p>`
  }
}

async function displayCuisineMeals() {
  const cuisineMeals = document.getElementById("cuisine-meals")
  if (!cuisineMeals) return

  // Apply sorting
  let displayMeals = [...cuisineMealsList]

  switch (currentCuisineSortOption) {
    case "a-z":
      displayMeals.sort((a, b) => a.strMeal.localeCompare(b.strMeal))
      break
    case "z-a":
      displayMeals.sort((a, b) => b.strMeal.localeCompare(a.strMeal))
      break
    default:
      // Default sorting (no change)
      break
  }

  // Apply category filtering
  if (currentCuisineFilter !== "all") {
    displayMeals = displayMeals.filter((meal) => meal.strCategory === currentCuisineFilter)
  }

  // Display meals
  cuisineMeals.innerHTML = ""

  if (displayMeals.length === 0) {
    cuisineMeals.innerHTML = `<p>No meals found matching the selected filters.</p>`
    return
  }

  console.log(`Displaying ${displayMeals.length} meals after filtering`)

  for (const meal of displayMeals) {
    try {
      const mealCard = await createMealCard(meal)
      cuisineMeals.appendChild(mealCard)
    } catch (error) {
      console.error(`Error creating card for meal ${meal.idMeal}:`, error)
    }
  }
}

async function loadCuisineCategories(area) {
  const cuisineCategoryFilter = document.getElementById("cuisine-category-filter")
  if (!cuisineCategoryFilter) return

  // Clear existing options except "All Categories"
  while (cuisineCategoryFilter.options.length > 1) {
    cuisineCategoryFilter.remove(1)
  }

  // Get unique categories from the cuisine meals list
  const categories = new Set()

  for (const meal of cuisineMealsList) {
    if (meal.strCategory) {
      categories.add(meal.strCategory)
    }
  }

  // Add options to the dropdown
  categories.forEach((category) => {
    const option = document.createElement("option")
    option.value = category
    option.textContent = category
    cuisineCategoryFilter.appendChild(option)
  })
}

// Load categories for filter dropdown
async function loadCategories() {
  const categoryFilter = document.getElementById("category-filter")
  if (!categoryFilter) return

  try {
    const categories = await fetchAllCategories()

    // Add options to the dropdown
    categories.forEach((category) => {
      const option = document.createElement("option")
      option.value = category.strCategory
      option.textContent = category.strCategory
      categoryFilter.appendChild(option)
    })
  } catch (error) {
    console.error("Error loading categories:", error)
  }
}

// Sort meals
function sortMeals(sortOption) {
  currentSortOption = sortOption

  // Apply both sort and filter
  applyFiltersAndSort()
}

// Filter meals by category
async function filterMealsByCategory(category) {
  currentCategoryFilter = category

  // Apply both sort and filter
  applyFiltersAndSort()
}

// Apply both sorting and filtering
async function applyFiltersAndSort() {
  // Start with all meals
  if (allMealsList.length === 0) {
    await loadAllMeals()
  }

  // Apply category filter first
  if (currentCategoryFilter === "all") {
    filteredMealsList = [...allMealsList]
  } else {
    // If we're filtering by category, we need to fetch those meals
    const categoryMeals = await fetchMealsByCategory(currentCategoryFilter)

    // Create a set of meal IDs for quick lookup
    const categoryMealIds = new Set(categoryMeals.map((meal) => meal.idMeal))

    // Filter the all meals list to only include meals from this category
    filteredMealsList = allMealsList.filter((meal) => categoryMealIds.has(meal.idMeal))

    // If we don't have enough meals in our all meals list, add the category meals
    if (filteredMealsList.length < categoryMeals.length) {
      const existingIds = new Set(filteredMealsList.map((meal) => meal.idMeal))
      const additionalMeals = categoryMeals.filter((meal) => !existingIds.has(meal.idMeal))

      // For each additional meal, fetch full details
      for (const meal of additionalMeals) {
        const fullMeal = await fetchMealById(meal.idMeal)
        if (fullMeal) {
          filteredMealsList.push(fullMeal)
        }
      }
    }
  }

  // Then apply sorting
  switch (currentSortOption) {
    case "a-z":
      filteredMealsList.sort((a, b) => a.strMeal.localeCompare(b.strMeal))
      break
    case "z-a":
      filteredMealsList.sort((a, b) => b.strMeal.localeCompare(a.strMeal))
      break
    default:
      // Default sorting (no change)
      break
  }

  // Reset to page 1 and display
  currentPage = 1
  displayMealsPage(currentPage)
  setupPagination()
}
