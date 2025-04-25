document.addEventListener('DOMContentLoaded', () => {
  // Toggle mobile nav
  const menuBtn = document.querySelector(".menuBtn");
  const navlink = document.querySelector(".nav-link");

  if (menuBtn && navlink) {
    menuBtn.addEventListener("click", () => {
      navlink.classList.toggle("mobile-menu");
    });
  }

  // Load user's favorite meals
  loadFavoriteMeals();

  // Load user's rated meals
  loadRatedMeals();

  // Set up search functionality
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performSearch();
      }
    });
  }

  // Close modal when clicking the close button or outside the modal
  document.addEventListener("click", (e) => {
    const profileMealDetailModal = document.getElementById("profileMealDetailModal");

    if (e.target.classList.contains("close-profile-modal")) {
      profileMealDetailModal.style.display = "none";
    }

    if (e.target === profileMealDetailModal) {
      profileMealDetailModal.style.display = "none";
    }
  });
});

// API Functions
async function fetchMealById(id) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await response.json();
    return data.meals ? data.meals[0] : null;
  } catch (error) {
    console.error("Error fetching meal details:", error);
    return null;
  }
}

async function fetchMealsByName(name) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${name}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Error fetching meals by name:", error);
    return [];
  }
}

// Get user's favorites
async function getFavorites() {
  try {
    const response = await fetch("get-favorites.php");
    const data = await response.json();
    return data.favorites || [];
  } catch (error) {
    console.error("Error getting favorites:", error);
    return [];
  }
}

// Get user's ratings
async function getRatings() {
  try {
    const response = await fetch("get-ratings.php");
    const data = await response.json();
    return data.ratings || [];
  } catch (error) {
    console.error("Error getting ratings:", error);
    return [];
  }
}

// Get user's rating for a meal
async function getUserRating(mealId) {
  try {
    const response = await fetch(`get-rating.php?meal_id=${mealId}`);
    const data = await response.json();
    return data.rating || 0;
  } catch (error) {
    console.error("Error getting user rating:", error);
    return 0;
  }
}

// Load favorite meals
async function loadFavoriteMeals() {
  const favoriteMealsContainer = document.getElementById("favorite-meals");
  const noFavorites = document.getElementById("no-favorites");
  
  if (!favoriteMealsContainer || !noFavorites) return;

  favoriteMealsContainer.innerHTML = ""; // Clear skeleton loaders

  try {
    const favorites = await getFavorites();

    if (favorites.length === 0) {
      favoriteMealsContainer.style.display = "none";
      noFavorites.style.display = "block";
      return;
    }

    noFavorites.style.display = "none";
    favoriteMealsContainer.style.display = "grid";

    for (const mealId of favorites) {
      const meal = await fetchMealById(mealId);
      if (meal) {
        const mealCard = createMealCard(meal, true);
        favoriteMealsContainer.appendChild(mealCard);
      }
    }
  } catch (error) {
    console.error("Error loading favorite meals:", error);
    favoriteMealsContainer.innerHTML = "<p>Error loading favorite meals. Please try again.</p>";
  }
}

// Load rated meals
async function loadRatedMeals() {
  const ratedMealsContainer = document.getElementById("rated-meals");
  const noRatings = document.getElementById("no-ratings");
  
  if (!ratedMealsContainer || !noRatings) return;

  ratedMealsContainer.innerHTML = ""; // Clear skeleton loaders

  try {
    const ratings = await getRatings();

    if (ratings.length === 0) {
      ratedMealsContainer.style.display = "none";
      noRatings.style.display = "block";
      return;
    }

    noRatings.style.display = "none";
    ratedMealsContainer.style.display = "grid";

    for (const rating of ratings) {
      const meal = await fetchMealById(rating.meal_id);
      if (meal) {
        const mealCard = createMealCard(meal, false, rating.rating);
        ratedMealsContainer.appendChild(mealCard);
      }
    }
  } catch (error) {
    console.error("Error loading rated meals:", error);
    ratedMealsContainer.innerHTML = "<p>Error loading rated meals. Please try again.</p>";
  }
}

// Create meal card
function createMealCard(meal, isFavorite = false, userRating = 0) {
  const card = document.createElement("div");
  card.className = "meal-card";
  card.dataset.id = meal.idMeal;

  // Generate rating stars HTML
  let ratingHTML = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= userRating) {
      ratingHTML += `<i class="ri-poker-hearts-fill" data-rating="${i}"></i>`;
    } else {
      ratingHTML += `<i class="ri-poker-hearts-line" data-rating="${i}"></i>`;
    }
  }

  card.innerHTML = `
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
    <div class="meal-card-content">
      <h3>${meal.strMeal}</h3>
      <p>${meal.strCategory || "Category not available"}</p>
      <div class="meal-rating" data-meal-id="${meal.idMeal}" data-user-rating="${userRating}">
        ${ratingHTML}
      </div>
      <div class="meal-card-actions">
        <button class="view-recipe" data-id="${meal.idMeal}">View Recipe</button>
        <button class="view-ingredients" data-id="${meal.idMeal}">Ingredients</button>
        ${isFavorite ? 
          `<button class="remove-favorite" data-id="${meal.idMeal}"><i class="ri-heart-fill"></i></button>` : 
          `<button class="add-favorite" data-id="${meal.idMeal}"><i class="ri-heart-line"></i></button>`
        }
      </div>
    </div>
  `;

  // Add event listeners
  card.addEventListener("click", () => showMealDetail(meal.idMeal));

  const viewRecipeBtn = card.querySelector(".view-recipe");
  const viewIngredientsBtn = card.querySelector(".view-ingredients");
  const favoriteBtn = card.querySelector(".add-favorite, .remove-favorite");
  const ratingStars = card.querySelectorAll(".meal-rating i");

  viewRecipeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showMealDetail(meal.idMeal, "recipe");
  });

  viewIngredientsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showMealDetail(meal.idMeal, "ingredients");
  });

  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (favoriteBtn.classList.contains("remove-favorite")) {
        removeFavorite(meal.idMeal);
      } else {
        addToFavorites(meal.idMeal);
      }
    });
  }

  // Set up rating functionality
  ratingStars.forEach(star => {
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      const rating = parseInt(e.target.dataset.rating);
      rateMeal(meal.idMeal, rating);
      updateStarDisplay(card, rating);
    });

    // Hover effect
    star.addEventListener("mouseover", (e) => {
      e.stopPropagation();
      const rating = parseInt(e.target.dataset.rating);
      const stars = card.querySelectorAll(".meal-rating i");
      
      stars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add("ri-poker-hearts-fill");
          s.classList.remove("ri-poker-hearts-line");
        } else {
          s.classList.add("ri-poker-hearts-line");
          s.classList.remove("ri-poker-hearts-fill");
        }
      });
    });

    // Reset on mouseout if not rated
    star.addEventListener("mouseout", (e) => {
      e.stopPropagation();
      const currentRating = parseInt(card.querySelector(".meal-rating").dataset.userRating || "0");
      updateStarDisplay(card, currentRating);
    });
  });

  return card;
}

// Update star display
function updateStarDisplay(container, rating) {
  const stars = container.querySelectorAll(".meal-rating i");
  
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("ri-poker-hearts-fill");
      star.classList.remove("ri-poker-hearts-line");
    } else {
      star.classList.add("ri-poker-hearts-line");
      star.classList.remove("ri-poker-hearts-fill");
    }
  });
  
  // Store the current rating
  container.querySelector(".meal-rating").dataset.userRating = rating;
}

// Show meal detail
async function showMealDetail(id, activeTab = "recipe") {
  const modal = document.getElementById("profileMealDetailModal");
  const modalContent = document.getElementById("profileMealDetailContent");

  if (!modal || !modalContent) return;

  // Show loading state
  modalContent.innerHTML = `
    <div class="meal-detail-skeleton">
      <div class="meal-image skeleton-loader"></div>
      <div class="meal-title skeleton-loader"></div>
      <div class="meal-category skeleton-loader"></div>
      <div class="meal-ingredients skeleton-loader"></div>
      <div class="meal-instructions skeleton-loader"></div>
    </div>
  `;

  modal.style.display = "block";

  try {
    const meal = await fetchMealById(id);
    if (!meal) {
      modalContent.innerHTML = "<p>Meal details not found.</p>";
      return;
    }

    // Get ingredients and measurements
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      if (ingredient && ingredient.trim() !== "") {
        ingredients.push({
          name: ingredient,
          measure: measure || "",
        });
      }
    }

    // Get user's rating
    const userRating = await getUserRating(id);

    // Create HTML content
    modalContent.innerHTML = `
      <div class="meal-detail-header">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-detail-header-content">
          <h2>${meal.strMeal}</h2>
          <p>Category: ${meal.strCategory}</p>
          <p>Origin: ${meal.strArea}</p>
          <div class="meal-detail-rating" data-meal-id="${meal.idMeal}" data-user-rating="${userRating}">
            <p>Your Rating:</p>
            <div class="stars">
              <i class="ri-poker-hearts-${userRating >= 1 ? 'fill' : 'line'}" data-rating="1"></i>
              <i class="ri-poker-hearts-${userRating >= 2 ? 'fill' : 'line'}" data-rating="2"></i>
              <i class="ri-poker-hearts-${userRating >= 3 ? 'fill' : 'line'}" data-rating="3"></i>
              <i class="ri-poker-hearts-${userRating >= 4 ? 'fill' : 'line'}" data-rating="4"></i>
              <i class="ri-poker-hearts-${userRating >= 5 ? 'fill' : 'line'}" data-rating="5"></i>
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
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    // Set up tab switching
    const recipeTab = document.getElementById("profile-recipe-tab");
    const ingredientsTab = document.getElementById("profile-ingredients-tab");
    const recipeContent = document.getElementById("profile-recipe-content");
    const ingredientsContent = document.getElementById("profile-ingredients-content");

    recipeTab.addEventListener("click", () => {
      recipeTab.classList.add("active");
      ingredientsTab.classList.remove("active");
      recipeContent.style.display = "block";
      ingredientsContent.style.display = "none";
    });

    ingredientsTab.addEventListener("click", () => {
      ingredientsTab.classList.add("active");
      recipeTab.classList.remove("active");
      ingredientsContent.style.display = "block";
      recipeContent.style.display = "none";
    });

    // Set up rating functionality in modal
    const ratingStars = modalContent.querySelectorAll(".meal-detail-rating .stars i");
    ratingStars.forEach(star => {
      star.addEventListener("click", (e) => {
        const rating = parseInt(e.target.dataset.rating);
        rateMeal(meal.idMeal, rating);
        
        // Update stars in modal
        ratingStars.forEach((s, index) => {
          if (index < rating) {
            s.classList.add("ri-poker-hearts-fill");
            s.classList.remove("ri-poker-hearts-line");
          } else {
            s.classList.add("ri-poker-hearts-line");
            s.classList.remove("ri-poker-hearts-fill");
          }
        });
        
        // Update user rating data attribute
        modalContent.querySelector(".meal-detail-rating").dataset.userRating = rating;
      });
    });

    // Set up watch video button
    const watchVideoBtn = document.getElementById("profile-watch-video");
    if (watchVideoBtn) {
      if (meal.strYoutube) {
        watchVideoBtn.addEventListener("click", () => {
          window.open(meal.strYoutube, "_blank");
        });
        watchVideoBtn.style.display = "block";
      } else {
        watchVideoBtn.style.display = "none";
      }
    }

    // Set up remove from favorites button
    const removeFavoriteBtn = document.getElementById("profile-remove-favorite");
    if (removeFavoriteBtn) {
      removeFavoriteBtn.dataset.id = meal.idMeal;
      removeFavoriteBtn.addEventListener("click", () => {
        removeFavorite(meal.idMeal);
        modal.style.display = "none";
      });
    }
  } catch (error) {
    console.error("Error showing meal details:", error);
    modalContent.innerHTML = "<p>Error loading meal details. Please try again.</p>";
  }
}

// Rate meal
async function rateMeal(mealId, rating) {
  try {
    const response = await fetch("rate-meal.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `meal_id=${mealId}&rating=${rating}`,
    });

    const result = await response.text();
    console.log(result);
    
    // Reload rated meals to reflect changes
    loadRatedMeals();
  } catch (error) {
    console.error("Error rating meal:", error);
    alert("Error rating meal. Please try again.");
  }
}

// Add to favorites
async function addToFavorites(mealId) {
  try {
    const response = await fetch("add-favorite.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `meal_id=${mealId}`,
    });

    const result = await response.text();
    alert(result);
    
    // Reload favorite meals to reflect changes
    loadFavoriteMeals();
  } catch (error) {
    console.error("Error adding to favorites:", error);
    alert("Error adding to favorites. Please try again.");
  }
}

// Remove from favorites
async function removeFavorite(mealId) {
  try {
    const response = await fetch("remove-favorite.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `meal_id=${mealId}`,
    });

    const result = await response.text();
    alert(result);
    
    // Reload favorite meals to reflect changes
    loadFavoriteMeals();
  } catch (error) {
    console.error("Error removing from favorites:", error);
    alert("Error removing from favorites. Please try again.");
  }
}

// Update the performSearch function in profile.js
async function performSearch() {
  const searchInput = document.getElementById("searchInput");
  const query = searchInput.value.trim();
  if (!query) return;

  // Store the search query in sessionStorage so we can use it across pages
  sessionStorage.setItem('lastSearchQuery', query);
  
  // Redirect to userpage with search parameter
  window.location.href = `userpage.html?search=${encodeURIComponent(query)}`;
}