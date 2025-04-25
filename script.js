// Toggle mobile nav
const menuBtn = document.querySelector(".menuBtn")
const navlink = document.querySelector(".nav-link")

menuBtn.addEventListener("click", () => {
  navlink.classList.toggle("mobile-menu")
})

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

// Initialize Swiper for featured meals
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Swiper if it exists on the page
  const swiperElement = document.querySelector(".mySwiper")
  let swiper // Declare swiper variable
  if (swiperElement) {
    swiper = new Swiper(".mySwiper", {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
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

  // Load featured meals
  loadFeaturedMeals()

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

  // Add this at the end of the existing DOMContentLoaded function:

  // Check for search parameter in URL
  const urlParams2 = new URLSearchParams(window.location.search)
  const searchQuery = urlParams2.get("search")

  if (searchQuery && document.getElementById("search-results-section")) {
    // If we have a search query in the URL, perform the search
    performSearch(searchQuery)

    // Scroll to search results
    document.getElementById("search-results-section").scrollIntoView({ behavior: "smooth" })
  }
})

// API Functions
async function fetchMealsByName(name) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${name}`)
    const data = await response.json()
    return data.meals || []
  } catch (error) {
    console.error("Error fetching meals by name:", error)
    return []
  }
}

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
  if (!id) {
    console.error("Invalid meal ID provided:", id)
    return null
  }

  try {
    console.log("Fetching meal from API with ID:", id)
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.meals || data.meals.length === 0) {
      console.log("No meal found with ID:", id)
      return null
    }

    return data.meals[0]
  } catch (error) {
    console.error(`Error fetching meal with ID ${id}:`, error)
    throw error // Rethrow to handle in the calling function
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

// UI Functions
async function loadFeaturedMeals() {
  const featuredContainer = document.getElementById("featured-meals-container")
  if (!featuredContainer) return

  featuredContainer.innerHTML = "" // Clear skeleton loaders

  try {
    const meals = await fetchRandomMeals(6)

    meals.forEach((meal) => {
      const mealCard = createFeaturedMealCard(meal)
      featuredContainer.appendChild(mealCard)
    })
  } catch (error) {
    console.error("Error loading featured meals:", error)
  }
}

function createFeaturedMealCard(meal) {
  const card = document.createElement("div")
  card.className = "swiper-slide card"

  // Get user ratings if available
  getUserRating(meal.idMeal).then((userRating) => {
    // Generate 5 stars with user rating or random 3-5 filled if no rating
    const filledStars = userRating || Math.floor(Math.random() * 3) + 3 // Random number between 3-5 if no rating
    let starsHTML = ""
    for (let i = 1; i <= 5; i++) {
      if (i <= filledStars) {
        starsHTML += '<i class="ri-poker-hearts-fill" data-rating="' + i + '"></i>'
      } else {
        starsHTML += '<i class="ri-poker-hearts-line" data-rating="' + i + '"></i>'
      }
    }

    card.innerHTML = `
      <div class="card-content">
        <div class="image">
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        </div>
        <div class="name-category">
          <span class="name">${meal.strMeal}</span>
          <span class="category">${meal.strCategory}</span>
        </div>
        <div class="rating" data-meal-id="${meal.idMeal}">
          ${starsHTML}
        </div>
        <div class="button">
          <button class="recipe" data-id="${meal.idMeal}">See Recipe</button>
          <button class="ingredient" data-id="${meal.idMeal}">Ingredients</button>
        </div>
      </div>
    `

    // Add event listeners
    const recipeBtn = card.querySelector(".recipe")
    const ingredientBtn = card.querySelector(".ingredient")
    const ratingStars = card.querySelectorAll(".rating i")

    recipeBtn.addEventListener("click", () => showMealDetail(meal.idMeal))
    ingredientBtn.addEventListener("click", () => showMealDetail(meal.idMeal, "ingredients"))

    // Add rating functionality
    ratingStars.forEach((star) => {
      star.addEventListener("click", (e) => {
        e.stopPropagation()
        const rating = Number.parseInt(star.getAttribute("data-rating"))
        const mealId = star.parentElement.getAttribute("data-meal-id")
        rateMeal(mealId, rating, star.parentElement)
      })
    })
  })

  return card
}

// Get user rating for a meal
async function getUserRating(mealId) {
  try {
    const response = await fetch("get-user-data.php")
    const data = await response.json()

    if (data.success && data.ratings && data.ratings[mealId]) {
      return data.ratings[mealId]
    }
    return 0
  } catch (error) {
    console.error("Error getting user rating:", error)
    return 0
  }
}

// Rate a meal
async function rateMeal(mealId, rating, ratingElement) {
  try {
    const response = await fetch("rate-meal.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `meal_id=${mealId}&rating=${rating}`,
    })

    const result = await response.json()

    if (result.success) {
      // Update the stars in the UI
      const stars = ratingElement.querySelectorAll("i")
      stars.forEach((star, index) => {
        if (index < rating) {
          star.className = "ri-poker-hearts-fill"
        } else {
          star.className = "ri-poker-hearts-line"
        }
      })

      // Show success message
      alert(result.message)
    } else {
      alert(result.message)
    }
  } catch (error) {
    console.error("Error rating meal:", error)
    alert("Error rating meal. Please try again.")
  }
}

let currentPage = 1
const mealsPerPage = 12
let allMealsList = []

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
    }

    // Display current page
    displayMealsPage(currentPage)

    // Set up load more button
    const loadMoreBtn = document.getElementById("load-more")
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => {
        currentPage++
        displayMealsPage(currentPage, true)
      })
    }
  } catch (error) {
    console.error("Error loading all meals:", error)
  }
}

function displayMealsPage(page, append = false) {
  const allMealsContainer = document.getElementById("all-meals")
  if (!allMealsContainer) return

  const startIndex = (page - 1) * mealsPerPage
  const endIndex = startIndex + mealsPerPage
  const mealsToDisplay = allMealsList.slice(startIndex, endIndex)

  if (!append) {
    allMealsContainer.innerHTML = ""
  }

  mealsToDisplay.forEach((meal) => {
    const mealCard = createMealCard(meal)
    allMealsContainer.appendChild(mealCard)
  })

  // Hide load more button if we've displayed all meals
  const loadMoreBtn = document.getElementById("load-more")
  if (loadMoreBtn) {
    loadMoreBtn.style.display = endIndex >= allMealsList.length ? "none" : "block"
  }
}

function createMealCard(meal) {
  const card = document.createElement("div")
  card.className = "meal-card"
  card.dataset.id = meal.idMeal

  // Get user rating
  getUserRating(meal.idMeal).then((userRating) => {
    let ratingHTML = ""
    if (userRating > 0) {
      ratingHTML = '<div class="meal-rating">'
      for (let i = 1; i <= 5; i++) {
        if (i <= userRating) {
          ratingHTML += '<i class="ri-poker-hearts-fill"></i>'
        } else {
          ratingHTML += '<i class="ri-poker-hearts-line"></i>'
        }
      }
      ratingHTML += "</div>"
    }

    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <div class="meal-card-content">
        <h3>${meal.strMeal}</h3>
        <p>${meal.strCategory || "Category not available"}</p>
        ${ratingHTML}
        <div class="meal-card-actions">
          <button class="view-recipe" data-id="${meal.idMeal}">View Recipe</button>
          <button class="view-ingredients" data-id="${meal.idMeal}">Ingredients</button>
        </div>
      </div>
    `

    // Add event listeners
    card.addEventListener("click", () => showMealDetail(meal.idMeal))

    const viewRecipeBtn = card.querySelector(".view-recipe")
    const viewIngredientsBtn = card.querySelector(".view-ingredients")

    viewRecipeBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      showMealDetail(meal.idMeal, "recipe")
    })

    viewIngredientsBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      showMealDetail(meal.idMeal, "ingredients")
    })
  })

  return card
}

async function showMealDetail(id, activeTab = "recipe") {
  const modal = document.getElementById("mealDetailModal")
  const modalContent = document.getElementById("mealDetailContent")

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
    console.log("Fetching meal with ID:", id)
    const meal = await fetchMealById(id)

    if (!meal) {
      console.error("Meal not found for ID:", id)
      modalContent.innerHTML = "<p>Meal details not found. Please try a different meal.</p>"
      return
    }

    console.log("Meal data retrieved:", meal)

    // Get user data to check if meal is favorited and rated
    let userData = { favorites: [], ratings: {} }
    try {
      const userDataResponse = await fetch("get-user-data.php")
      userData = await userDataResponse.json()
      console.log("User data retrieved:", userData)
    } catch (userDataError) {
      console.error("Error fetching user data:", userDataError)
      // Continue with empty user data rather than failing completely
    }

    const isFavorited = userData.favorites && userData.favorites.includes(meal.idMeal)
    const userRating = userData.ratings && userData.ratings[meal.idMeal] ? userData.ratings[meal.idMeal] : 0

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

    // Create HTML content
    modalContent.innerHTML = `
      <div class="meal-detail-header">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-detail-header-content">
          <h2>${meal.strMeal}</h2>
          <p>Category: ${meal.strCategory}</p>
          <p>Origin: ${meal.strArea}</p>
        </div>
      </div>
      
      <div class="rating-container">
        <p>Your Rating:</p>
        <div class="rating-stars" data-meal-id="${meal.idMeal}">
          <i class="ri-poker-hearts-${userRating >= 1 ? "fill" : "line"}" data-rating="1"></i>
          <i class="ri-poker-hearts-${userRating >= 2 ? "fill" : "line"}" data-rating="2"></i>
          <i class="ri-poker-hearts-${userRating >= 3 ? "fill" : "line"}" data-rating="3"></i>
          <i class="ri-poker-hearts-${userRating >= 4 ? "fill" : "line"}" data-rating="4"></i>
          <i class="ri-poker-hearts-${userRating >= 5 ? "fill" : "line"}" data-rating="5"></i>
        </div>
      </div>
      
      <div class="meal-detail-tabs">
        <button id="recipe-tab" class="${activeTab === "recipe" ? "active" : ""}">Recipe</button>
        <button id="ingredients-tab" class="${activeTab === "ingredients" ? "active" : ""}">Ingredients</button>
      </div>
      
      <div class="meal-detail-content">
        <div id="recipe-content" style="display: ${activeTab === "recipe" ? "block" : "none"}">
          <h3>Instructions</h3>
          <div class="instructions">
            ${meal.strInstructions.replace(/\n/g, "<br>")}
          </div>
        </div>
        
        <div id="ingredients-content" style="display: ${activeTab === "ingredients" ? "block" : "none"}">
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
    const recipeTab = document.getElementById("recipe-tab")
    const ingredientsTab = document.getElementById("ingredients-tab")
    const recipeContent = document.getElementById("recipe-content")
    const ingredientsContent = document.getElementById("ingredients-content")

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

    // Set up watch video button
    const watchVideoBtn = document.getElementById("watch-video")
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
    const addToFavoritesBtn = document.getElementById("add-to-favorites")
    if (addToFavoritesBtn) {
      if (isFavorited) {
        addToFavoritesBtn.innerHTML = '<i class="ri-heart-fill"></i> Remove from Favorites'
      } else {
        addToFavoritesBtn.innerHTML = '<i class="ri-heart-line"></i> Add to Favorites'
      }

      addToFavoritesBtn.dataset.id = meal.idMeal
      addToFavoritesBtn.addEventListener("click", () => {
        toggleFavorite(meal.idMeal, isFavorited)
      })
    }

    // Set up rating functionality
    const ratingStars = document.querySelectorAll(".rating-stars i")
    ratingStars.forEach((star) => {
      star.addEventListener("click", async () => {
        const rating = Number.parseInt(star.getAttribute("data-rating"))
        const mealId = star.parentElement.getAttribute("data-meal-id")

        try {
          const response = await fetch("rate-meal.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `meal_id=${mealId}&rating=${rating}`,
          })

          const result = await response.json()

          if (result.success) {
            // Update the stars
            ratingStars.forEach((s, index) => {
              if (index < rating) {
                s.classList.remove("ri-poker-hearts-line")
                s.classList.add("ri-poker-hearts-fill")
              } else {
                s.classList.remove("ri-poker-hearts-fill")
                s.classList.add("ri-poker-hearts-line")
              }
            })

            alert(result.message)
          } else {
            alert(result.message)
          }
        } catch (error) {
          console.error("Error rating meal:", error)
          alert("Error rating meal. Please try again.")
        }
      })
    })
  } catch (error) {
    console.error("Error showing meal details:", error)
    modalContent.innerHTML = `
    <div class="error-message">
      <h3>Error Loading Meal Details</h3>
      <p>We encountered a problem while loading the meal details. This might be due to:</p>
      <ul>
        <li>Network connectivity issues</li>
        <li>The meal ID may be invalid</li>
        <li>The API service may be temporarily unavailable</li>
      </ul>
      <p>Please try again later or select a different meal.</p>
    </div>
  `
  }
}

// Toggle favorite status
async function toggleFavorite(mealId, isCurrentlyFavorited) {
  try {
    if (isCurrentlyFavorited) {
      // Remove from favorites
      const response = await fetch("remove-favorite.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `meal_id=${mealId}`,
      })

      const result = await response.text()
      alert(result)

      // Update button
      const addToFavoritesBtn = document.getElementById("add-to-favorites")
      if (addToFavoritesBtn) {
        addToFavoritesBtn.innerHTML = '<i class="ri-heart-line"></i> Add to Favorites'
      }
    } else {
      // Add to favorites
      const response = await fetch("add-favorite.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `meal_id=${mealId}`,
      })

      const result = await response.text()
      alert(result)

      // Update button
      const addToFavoritesBtn = document.getElementById("add-to-favorites")
      if (addToFavoritesBtn) {
        addToFavoritesBtn.innerHTML = '<i class="ri-heart-fill"></i> Remove from Favorites'
      }
    }
  } catch (error) {
    console.error("Error toggling favorite:", error)
    alert("Error updating favorites. Please try again.")
  }
}

// Close modal when clicking the close button or outside the modal
document.addEventListener("click", (e) => {
  const mealDetailModal = document.getElementById("mealDetailModal")
  const cuisineMealDetailModal = document.getElementById("cuisineMealDetailModal")

  if (e.target.classList.contains("close-modal")) {
    mealDetailModal.style.display = "none"
  }

  if (e.target.classList.contains("close-cuisine-modal")) {
    cuisineMealDetailModal.style.display = "none"
  }

  if (e.target === mealDetailModal) {
    mealDetailModal.style.display = "none"
  }

  if (e.target === cuisineMealDetailModal) {
    cuisineMealDetailModal.style.display = "none"
  }
})

// Search functionality
document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn")
  const searchInput = document.getElementById("searchInput")
  const cuisineSearchBtn = document.getElementById("cuisineSearchBtn")
  const cuisineSearchInput = document.getElementById("cuisineSearchInput")

  // Set up search functionality for main search bar
  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      const query = searchInput.value.trim()
      if (query) {
        // If we're on the home page, perform search directly
        if (
          window.location.pathname.includes("index.html") ||
          window.location.pathname === "/" ||
          window.location.pathname.endsWith("/")
        ) {
          performSearch(query)
        } else {
          // Otherwise, redirect to index.html with search parameter
          window.location.href = `index.html?search=${encodeURIComponent(query)}`
        }
      }
    })

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim()
        if (query) {
          if (
            window.location.pathname.includes("index.html") ||
            window.location.pathname === "/" ||
            window.location.pathname.endsWith("/")
          ) {
            performSearch(query)
          } else {
            window.location.href = `index.html?search=${encodeURIComponent(query)}`
          }
        }
      }
    })
  }

  // Set up search functionality for cuisine search bar
  if (cuisineSearchBtn && cuisineSearchInput) {
    cuisineSearchBtn.addEventListener("click", () => {
      const query = cuisineSearchInput.value.trim()
      if (query) {
        // If we're on the cuisines page, try to filter cuisines first
        if (window.location.pathname.includes("cuisines.html")) {
          // Try to filter cuisines first
          const cuisineCards = document.querySelectorAll(".cuisine-card")
          let cuisineFound = false

          cuisineCards.forEach((card) => {
            const cuisineName = card.querySelector("h3").textContent.toLowerCase()
            if (cuisineName.toLowerCase() === query.toLowerCase()) {
              cuisineFound = true
              // If exact match, load that cuisine's meals
              loadCuisineMeals(cuisineName)
              return
            }
          })

          // If no exact cuisine match, redirect to index for general search
          if (!cuisineFound) {
            window.location.href = `index.html?search=${encodeURIComponent(query)}`
          }
        } else {
          // If not on cuisines page, redirect to index with search parameter
          window.location.href = `index.html?search=${encodeURIComponent(query)}`
        }
      }
    })

    cuisineSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = cuisineSearchInput.value.trim()
        if (query) {
          if (window.location.pathname.includes("cuisines.html")) {
            // Try to filter cuisines first
            const cuisineCards = document.querySelectorAll(".cuisine-card")
            let cuisineFound = false

            cuisineCards.forEach((card) => {
              const cuisineName = card.querySelector("h3").textContent.toLowerCase()
              if (cuisineName.toLowerCase() === query.toLowerCase()) {
                cuisineFound = true
                // If exact match, load that cuisine's meals
                loadCuisineMeals(cuisineName)
                return
              }
            })

            // If no exact cuisine match, redirect to index for general search
            if (!cuisineFound) {
              window.location.href = `index.html?search=${encodeURIComponent(query)}`
            }
          } else {
            // If not on cuisines page, redirect to index with search parameter
            window.location.href = `index.html?search=${encodeURIComponent(query)}`
          }
        }
      }
    })
  }

  // Check for search parameter in URL
  const urlParams = new URLSearchParams(window.location.search)
  const searchQuery = urlParams.get("search")

  if (searchQuery && document.getElementById("search-results-section")) {
    // If we have a search query in the URL, perform the search
    performSearch(searchQuery)

    // Scroll to search results
    document.getElementById("search-results-section").scrollIntoView({ behavior: "smooth" })
  }
})

// Update the performSearch function to accept a query parameter
async function performSearch(searchQuery = null) {
  const query =
    searchQuery || (document.getElementById("searchInput") ? document.getElementById("searchInput").value.trim() : "")
  if (!query) return

  const searchResultsSection = document.getElementById("search-results-section")
  const searchResults = document.getElementById("search-results")
  const noResults = document.getElementById("no-results")
  const allMealsSection = document.getElementById("all-meals-section")
  const featuredMealsSection = document.getElementById("featured-meals")

  if (!searchResultsSection || !searchResults || !noResults) return

  // Show search results section, hide others
  searchResultsSection.style.display = "block"
  if (allMealsSection) allMealsSection.style.display = "none"
  if (featuredMealsSection) featuredMealsSection.style.display = "none"

  // Update the search input if it exists and the query was passed as parameter
  const searchInput = document.getElementById("searchInput")
  if (searchInput && searchQuery) {
    searchInput.value = query
  }

  // Show loading state
  searchResults.innerHTML = `
    <div class="search-heading">
      <h2>Searching for "${query}"...</h2>
    </div>
    <div class="meals-grid">
      <div class="meal-card skeleton-loader"></div>
      <div class="meal-card skeleton-loader"></div>
      <div class="meal-card skeleton-loader"></div>
    </div>
  `
  noResults.style.display = "none"

  try {
    // First try to search by meal name
    let meals = await fetchMealsByName(query)

    // If no results, try to search by area/cuisine
    if (meals.length === 0) {
      meals = await fetchMealsByArea(query)
    }

    // If still no results, try to search by ingredient
    if (meals.length === 0) {
      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${query}`)
        const data = await response.json()
        meals = data.meals || []
      } catch (error) {
        console.error("Error searching by ingredient:", error)
      }
    }

    if (meals.length === 0) {
      searchResults.innerHTML = `
        <div class="search-heading">
          <h2>Results for "${query}"</h2>
        </div>
      `
      noResults.innerHTML = `
        <p>No meals found for "${query}".</p>
        <div class="suggestions">
          <p>Try searching for:</p>
          <ul>
            <li>Cuisine names like "Italian", "Indian", or "Mexican"</li>
            <li>Ingredients like "Chicken", "Beef", or "Potato"</li>
            <li>Meal names like "Pasta", "Curry", or "Stew"</li>
          </ul>
        </div>
      `
      noResults.style.display = "block"
      return
    }

    // Display results
    searchResults.innerHTML = `
      <div class="search-heading">
        <h2>Results for "${query}"</h2>
      </div>
    `

    // Create a container for the meal cards
    const mealsContainer = document.createElement("div")
    mealsContainer.className = "meals-grid"
    searchResults.appendChild(mealsContainer)

    for (const meal of meals) {
      // For meals that might not have full details (like from ingredient search)
      // we need to fetch the full meal details
      let fullMeal = meal
      if (!meal.strCategory || !meal.strArea) {
        try {
          fullMeal = (await fetchMealById(meal.idMeal)) || meal
        } catch (error) {
          console.error("Error fetching full meal details:", error)
        }
      }

      const mealCard = createMealCard(fullMeal)
      mealsContainer.appendChild(mealCard)
    }
  } catch (error) {
    console.error("Error performing search:", error)
    searchResults.innerHTML = `
      <div class="search-heading">
        <h2>Results for "${query}"</h2>
      </div>
      <p>Error performing search. Please try again.</p>
    `
  }
}

// Add a new function to fetch meals by ingredient
async function fetchMealsByIngredient(ingredient) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`)
    const data = await response.json()
    return data.meals || []
  } catch (error) {
    console.error("Error fetching meals by ingredient:", error)
    return []
  }
}

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

    // Display meals
    cuisineMeals.innerHTML = ""

    for (const meal of meals) {
      // For each meal in the list, we need to fetch full details to get category
      const fullMeal = await fetchMealById(meal.idMeal)

      const mealCard = document.createElement("div")
      mealCard.className = "meal-card"
      mealCard.dataset.id = meal.idMeal

      mealCard.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-card-content">
          <h3>${meal.strMeal}</h3>
          <p>${fullMeal?.strCategory || "Category not available"}</p>
          <div class="meal-card-actions">
            <button class="view-recipe" data-id="${meal.idMeal}">View Recipe</button>
            <button class="view-ingredients" data-id="${meal.idMeal}">Ingredients</button>
          </div>
        </div>
      `

      // Add event listeners
      mealCard.addEventListener("click", () => {
        showCuisineMealDetail(meal.idMeal)
      })

      const viewRecipeBtn = mealCard.querySelector(".view-recipe")
      const viewIngredientsBtn = mealCard.querySelector(".view-ingredients")

      viewRecipeBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        showCuisineMealDetail(meal.idMeal, "recipe")
      })

      viewIngredientsBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        showCuisineMealDetail(meal.idMeal, "ingredients")
      })

      cuisineMeals.appendChild(mealCard)
    }
  } catch (error) {
    console.error("Error loading cuisine meals:", error)
    cuisineMeals.innerHTML = `<p>Error loading meals for ${area} cuisine. Please try again.</p>`
  }
}

// Back to cuisines button
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

// Cuisine search functionality
const cuisineSearchBtn = document.getElementById("cuisineSearchBtn")
const cuisineSearchInputElem = document.getElementById("cuisineSearchInput")

if (cuisineSearchBtn && cuisineSearchInputElem) {
  cuisineSearchBtn.addEventListener("click", searchCuisines)
  cuisineSearchInputElem.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchCuisines()
    }
  })
}

function searchCuisines() {
  const cuisineSearchInputElem = document.getElementById("cuisineSearchInput")
  if (!cuisineSearchInputElem) return

  const query = cuisineSearchInputElem.value.trim().toLowerCase()
  if (!query) return

  const cuisineCards = document.querySelectorAll(".cuisine-card")
  let found = false

  cuisineCards.forEach((card) => {
    const cuisineName = card.querySelector("h3").textContent.toLowerCase()

    if (cuisineName.includes(query)) {
      card.style.display = "block"
      found = true
    } else {
      card.style.display = "none"
    }
  })

  // If no cuisines match, show message
  const cuisinesGrid = document.getElementById("cuisines-grid")
  if (cuisinesGrid) {
    const noResultsMsg = cuisinesGrid.querySelector(".no-results-msg")

    if (!found) {
      if (!noResultsMsg) {
        const msg = document.createElement("p")
        msg.className = "no-results-msg"
        msg.textContent = `No cuisines found matching "${query}".`
        cuisinesGrid.appendChild(msg)
      }
    } else if (noResultsMsg) {
      noResultsMsg.remove()
    }
  }
}

// Show cuisine meal details
async function showCuisineMealDetail(id, activeTab = "recipe") {
  const modal = document.getElementById("cuisineMealDetailModal")
  const modalContent = document.getElementById("cuisineMealDetailContent")

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

    // Get user data to check if meal is favorited and rated
    const userDataResponse = await fetch("get-user-data.php")
    const userData = await userDataResponse.json()

    const isFavorited = userData.favorites && userData.favorites.includes(meal.idMeal)
    const userRating = userData.ratings && userData.ratings[meal.idMeal] ? userData.ratings[meal.idMeal] : 0

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

    // Create HTML content
    modalContent.innerHTML = `
      <div class="meal-detail-header">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-detail-header-content">
          <h2>${meal.strMeal}</h2>
          <p>Category: ${meal.strCategory}</p>
          <p>Origin: ${meal.strArea}</p>
        </div>
      </div>
      
      <div class="rating-container">
        <p>Your Rating:</p>
        <div class="rating-stars" data-meal-id="${meal.idMeal}">
          <i class="ri-poker-hearts-${userRating >= 1 ? "fill" : "line"}" data-rating="1"></i>
          <i class="ri-poker-hearts-${userRating >= 2 ? "fill" : "line"}" data-rating="2"></i>
          <i class="ri-poker-hearts-${userRating >= 3 ? "fill" : "line"}" data-rating="3"></i>
          <i class="ri-poker-hearts-${userRating >= 4 ? "fill" : "line"}" data-rating="4"></i>
          <i class="ri-poker-hearts-${userRating >= 5 ? "fill" : "line"}" data-rating="5"></i>
        </div>
      </div>
      
      <div class="meal-detail-tabs">
        <button id="cuisine-recipe-tab" class="${activeTab === "recipe" ? "active" : ""}">Recipe</button>
        <button id="cuisine-ingredients-tab" class="${activeTab === "ingredients" ? "active" : ""}">Ingredients</button>
      </div>
      
      <div class="meal-detail-content">
        <div id="cuisine-recipe-content" style="display: ${activeTab === "recipe" ? "block" : "none"}">
          <h3>Instructions</h3>
          <div class="instructions">
            ${meal.strInstructions.replace(/\n/g, "<br>")}
          </div>
        </div>
        
        <div id="cuisine-ingredients-content" style="display: ${activeTab === "ingredients" ? "block" : "none"}">
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
    const recipeTab = document.getElementById("cuisine-recipe-tab")
    const ingredientsTab = document.getElementById("cuisine-ingredients-tab")
    const recipeContent = document.getElementById("cuisine-recipe-content")
    const ingredientsContent = document.getElementById("cuisine-ingredients-content")

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

    // Set up watch video button
    const watchVideoBtn = document.getElementById("cuisine-watch-video")
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
    const addToFavoritesBtn = document.getElementById("cuisine-add-to-favorites")
    if (addToFavoritesBtn) {
      if (isFavorited) {
        addToFavoritesBtn.innerHTML = '<i class="ri-heart-fill"></i> Remove from Favorites'
      } else {
        addToFavoritesBtn.innerHTML = '<i class="ri-heart-line"></i> Add to Favorites'
      }

      addToFavoritesBtn.dataset.id = meal.idMeal
      addToFavoritesBtn.addEventListener("click", () => {
        toggleFavorite(meal.idMeal, isFavorited)
      })
    }

    // Set up rating functionality
    const ratingStars = document.querySelectorAll(".rating-stars i")
    ratingStars.forEach((star) => {
      star.addEventListener("click", async () => {
        const rating = Number.parseInt(star.getAttribute("data-rating"))
        const mealId = star.parentElement.getAttribute("data-meal-id")

        try {
          const response = await fetch("rate-meal.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `meal_id=${mealId}&rating=${rating}`,
          })

          const result = await response.json()

          if (result.success) {
            // Update the stars
            ratingStars.forEach((s, index) => {
              if (index < rating) {
                s.classList.remove("ri-poker-hearts-line")
                s.classList.add("ri-poker-hearts-fill")
              } else {
                s.classList.remove("ri-poker-hearts-fill")
                s.classList.add("ri-poker-hearts-line")
              }
            })

            alert(result.message)
          } else {
            alert(result.message)
          }
        } catch (error) {
          console.error("Error rating meal:", error)
          alert("Error rating meal. Please try again.")
        }
      })
    })
  } catch (error) {
    console.error("Error showing meal details:", error)
    modalContent.innerHTML = "<p>Error loading meal details. Please try again.</p>"
  }
}

// Add to favorites functionality
async function addToFavorites(mealId) {
  try {
    const response = await fetch("add-favorite.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `meal_id=${mealId}`,
    })

    const result = await response.text()
    alert(result)
  } catch (error) {
    console.error("Error adding to favorites:", error)
    alert("Error adding to favorites. Please try again.")
  }
}
