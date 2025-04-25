//user page menu toggle
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menuTog")
    const menuLinks = document.querySelector(".nav-links")
  
    if (menuToggle && menuLinks) {
      menuToggle.addEventListener("click", () => {
        menuLinks.style.display = menuLinks.style.display === "block" ? "none" : "block"
      })
    } else {
      console.log("Menu button or links not found")
    }
  })
  
  // card slider initialize
  document.addEventListener("DOMContentLoaded", () => {
    const swiper = new Swiper(".mySwiper", {
      slidesPerView: 3,
      spaceBetween: 10,
      slidesPerGroup: 1,
      loop: true,
      pagination: {
        el: ".my-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
    })
  })
  
  // Profile page functionality
  document.addEventListener("DOMContentLoaded", () => {
    // Tab switching
    const tabBtns = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")
  
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab")
  
        // Remove active class from all buttons and contents
        tabBtns.forEach((b) => b.classList.remove("active"))
        tabContents.forEach((c) => c.classList.remove("active"))
  
        // Add active class to clicked button and corresponding content
        btn.classList.add("active")
        document.getElementById(`${tabId}-tab`).classList.add("active")
      })
    })
  
    // Load user data
    loadUserData()
  
    // Close modal when clicking the close button or outside the modal
    document.addEventListener("click", (e) => {
      const profileMealDetailModal = document.getElementById("profileMealDetailModal")
  
      if (e.target.classList.contains("close-profile-modal")) {
        profileMealDetailModal.style.display = "none"
      }
  
      if (e.target === profileMealDetailModal) {
        profileMealDetailModal.style.display = "none"
      }
    })
  })
  
  // Load user data (favorites and ratings)
  async function loadUserData() {
    try {
      const response = await fetch("get-user-data.php")
      const data = await response.json()
  
      if (data.success) {
        // Update username
        document.getElementById("username-display").textContent = data.username || "User"
  
        // Update favorites count
        const favoritesCount = data.favorites.length
        document.getElementById("favorites-count").textContent = `(${favoritesCount})`
        document.getElementById("favorites-remaining").textContent = `You have ${10 - favoritesCount} slots remaining.`
  
        // Update rated count
        const ratedCount = Object.keys(data.ratings).length
        document.getElementById("rated-count").textContent = `(${ratedCount})`
  
        // Load favorites
        loadFavorites(data.favorites)
  
        // Load rated meals
        loadRatedMeals(data.ratings)
      } else {
        console.error("Error loading user data:", data.message)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }
  
  // Load favorite meals
  async function loadFavorites(favoriteIds) {
    const favoritesContainer = document.getElementById("favorites-container")
  
    if (favoriteIds.length === 0) {
      favoritesContainer.innerHTML = '<p class="no-items">You have no favorite meals yet.</p>'
      return
    }
  
    favoritesContainer.innerHTML = ""
  
    for (const mealId of favoriteIds) {
      try {
        const meal = await fetchMealById(mealId)
        if (meal) {
          const mealCard = createProfileMealCard(meal)
          favoritesContainer.appendChild(mealCard)
        }
      } catch (error) {
        console.error(`Error loading favorite meal ${mealId}:`, error)
      }
    }
  }
  
  // Load rated meals
  async function loadRatedMeals(ratings) {
    const ratedContainer = document.getElementById("rated-container")
  
    if (Object.keys(ratings).length === 0) {
      ratedContainer.innerHTML = '<p class="no-items">You have not rated any meals yet.</p>'
      return
    }
  
    ratedContainer.innerHTML = ""
  
    for (const [mealId, rating] of Object.entries(ratings)) {
      try {
        const meal = await fetchMealById(mealId)
        if (meal) {
          const mealCard = createProfileMealCard(meal, rating)
          ratedContainer.appendChild(mealCard)
        }
      } catch (error) {
        console.error(`Error loading rated meal ${mealId}:`, error)
      }
    }
  }
  
  // Create meal card for profile page
  function createProfileMealCard(meal, userRating = 0) {
    const card = document.createElement("div")
    card.className = "meal-card"
    card.dataset.id = meal.idMeal
  
    // Generate rating stars HTML
    let ratingHTML = ""
    for (let i = 1; i <= 5; i++) {
      if (i <= userRating) {
        ratingHTML += '<i class="ri-poker-hearts-fill"></i>'
      } else {
        ratingHTML += '<i class="ri-poker-hearts-line"></i>'
      }
    }
  
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <div class="meal-card-content">
        <h3>${meal.strMeal}</h3>
        <p>${meal.strCategory || "Category not available"}</p>
        ${userRating > 0 ? `<div class="meal-rating">${ratingHTML}</div>` : ""}
        <div class="meal-card-actions">
          <button class="view-recipe" data-id="${meal.idMeal}">View Recipe</button>
          <button class="rate-meal" data-id="${meal.idMeal}">Rate Meal</button>
        </div>
      </div>
    `
  
    // Add event listeners
    card.addEventListener("click", () => showProfileMealDetail(meal.idMeal))
  
    const viewRecipeBtn = card.querySelector(".view-recipe")
    const rateMealBtn = card.querySelector(".rate-meal")
  
    viewRecipeBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      showProfileMealDetail(meal.idMeal, "recipe")
    })
  
    rateMealBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      showProfileMealDetail(meal.idMeal, "rate")
    })
  
    return card
  }
  
  // Show meal detail in profile page
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
  
      // Get user data to check if meal is favorited and rated
      const userDataResponse = await fetch("get-user-data.php")
      const userData = await userDataResponse.json()
  
      const isFavorited = userData.favorites.includes(meal.idMeal)
      const userRating = userData.ratings[meal.idMeal] || 0
  
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
  
      // Set up add/remove favorites button
      const favoritesBtn = document.getElementById("profile-add-to-favorites")
      if (favoritesBtn) {
        if (isFavorited) {
          favoritesBtn.innerHTML = '<i class="ri-heart-fill"></i> <span>Remove from Favorites</span>'
        } else {
          favoritesBtn.innerHTML = '<i class="ri-heart-line"></i> <span>Add to Favorites</span>'
        }
  
        favoritesBtn.dataset.id = meal.idMeal
        favoritesBtn.addEventListener("click", () => {
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
  
              // Reload user data to update the UI
              loadUserData()
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
      }
  
      // Reload user data to update the UI
      loadUserData()
  
      // Close the modal
      document.getElementById("profileMealDetailModal").style.display = "none"
    } catch (error) {
      console.error("Error toggling favorite:", error)
      alert("Error updating favorites. Please try again.")
    }
  }
  
  // Mock fetchMealById function for demonstration purposes
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
      return null
    }
  }
  
  // Import Swiper (replace with your actual import method)
  // For example, if you're using a CDN:
  // <script src="https://unpkg.com/swiper/swiper-bundle.min.js"></script>
  // Or if you're using npm:
  // import Swiper from 'swiper/bundle';
  // For this example, I'll assume Swiper is globally available.
  