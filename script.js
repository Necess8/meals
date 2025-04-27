// Toggle mobile nav
const menuBtn = document.querySelector(".menuBtn");
const navlink = document.querySelector(".nav-link");

if (menuBtn && navlink) {
  menuBtn.addEventListener("click", () => {
    navlink.classList.toggle("mobile-menu");
  });
}

// Toggle sign in/register view
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

// Header slider
const listInfo = document.querySelector(".list-info");
const listImgs = document.querySelectorAll(".list-img .item");
const nextBtn = document.querySelector(".next-btn");
const prevBtn = document.querySelector(".prev-btn");

let index = 0;

if (nextBtn && prevBtn && listImgs.length > 0) {
  nextBtn.addEventListener("click", () => {
    // Remove current active image
    listImgs[index].classList.remove("active");

    // Update index
    index = (index + 1) % listImgs.length;

    // Add active to new image
    listImgs[index].classList.add("active");

    // Move listInfo (if you have multiple sections for text)
    if (listInfo) {
      listInfo.style.transform = `translateY(${index * -20}%)`;
    }
  });

  prevBtn.addEventListener("click", () => {
    listImgs[index].classList.remove("active");
    index = (index - 1 + listImgs.length) % listImgs.length;
    listImgs[index].classList.add("active");
    if (listInfo) {
      listInfo.style.transform = `translateY(${index * -20}%)`;
    }
  });
}

// User page menu toggle
document.addEventListener('DOMContentLoaded', () => {
  // Display username in navbar
  const usernameDisplay = document.getElementById('usernameDisplay');
  if (usernameDisplay) {
    fetch('get-username.php')
      .then(response => response.json())
      .then(data => {
        if (data.username) {
          usernameDisplay.textContent = data.username;
        }
      })
      .catch(error => console.error('Error fetching username:', error));
  }

  const menuToggle = document.querySelector('.menuTog');
  const menuLinks = document.querySelector('.nav-links');

  if (menuToggle && menuLinks) {
    menuToggle.addEventListener('click', () => {
      menuLinks.style.display = menuLinks.style.display === 'block' ? 'none' : 'block';
    });
  }

  // Initialize Swiper if it exists on the page
  const swiperElement = document.querySelector(".mySwiper");
  let swiper;
  if (swiperElement) {
    swiper = new Swiper(".mySwiper", {
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
    });
  }

  // Load featured meals (top 5 highest rated)
  loadTopRatedMeals();

  // Load all meals (first page)
  loadAllMeals();

  // Load cuisines if on cuisines page
  if (document.getElementById("cuisines-grid")) {
    loadAllCuisines();
  }

  // Check if we need to load a specific cuisine from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const area = urlParams.get("area");
  if (area && document.getElementById("cuisine-meals-section")) {
    loadCuisineMeals(area);
  }

  // Check if there's a search parameter in the URL
  const searchQuery = urlParams.get("search");
  if (searchQuery) {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.value = searchQuery;
      performSearch();
    }
  }

  // Set up back to cuisines button
  const backToCuisinesBtn = document.getElementById("back-to-cuisines");
  if (backToCuisinesBtn) {
    backToCuisinesBtn.addEventListener("click", () => {
      const cuisinesGridSection = document.getElementById("cuisines-grid-section");
      const cuisineMealsSection = document.getElementById("cuisine-meals-section");

      if (cuisinesGridSection && cuisineMealsSection) {
        cuisinesGridSection.style.display = "block";
        cuisineMealsSection.style.display = "none";

        // Update URL parameter without reloading the page
        const url = new URL(window.location);
        url.searchParams.delete("area");
        window.history.pushState({}, "", url);
      }
    });
  }

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

  // Set up cuisine search functionality
  const cuisineSearchBtn = document.getElementById("cuisineSearchBtn");
  const cuisineSearchInput = document.getElementById("cuisineSearchInput");

  if (cuisineSearchBtn && cuisineSearchInput) {
    cuisineSearchBtn.addEventListener("click", searchCuisines);
    cuisineSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchCuisines();
      }
    });
  }

  // Set up sorting and filtering
  const sortSelect = document.getElementById("sort-select");
  const categoryFilter = document.getElementById("category-filter");

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      sortMeals(sortSelect.value);
    });
  }

  if (categoryFilter) {
    // Load categories first
    loadCategories();
    
    categoryFilter.addEventListener("change", () => {
      filterMealsByCategory(categoryFilter.value);
    });
  }
});

// API Functions
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

async function fetchMealsByFirstLetter(letter) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Error fetching meals by letter:", error);
    return [];
  }
}

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

async function fetchRandomMeals(count = 6) {
  try {
    const meals = [];
    for (let i = 0; i < count; i++) {
      const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
      const data = await response.json();
      if (data.meals && data.meals[0]) {
        meals.push(data.meals[0]);
      }
    }
    return meals;
  } catch (error) {
    console.error("Error fetching random meals:", error);
    return [];
  }
}

async function fetchMealsByArea(area) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Error fetching meals by area:", error);
    return [];
  }
}

async function fetchAllAreas() {
  try {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?a=list");
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Error fetching areas:", error);
    return [];
  }
}

async function fetchAllCategories() {
  try {
    const response = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list");
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function fetchMealsByCategory(category) {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error("Error fetching meals by category:", error);
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

// Get average rating for a meal
async function getAverageRating(mealId) {
  try {
    const response = await fetch(`get-average-rating.php?meal_id=${mealId}`);
    const data = await response.json();
    return data.avgRating || 0;
  } catch (error) {
    console.error("Error getting average rating:", error);
    return 0;
  }
}

// Helper function to generate rating stars HTML based on a rating value
function generateRatingStars(rating) {
  let starsHTML = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      starsHTML += '<i class="ri-poker-hearts-fill"></i>';
    } else if (i === fullStars + 1 && hasHalfStar) {
      starsHTML += '<i class="ri-poker-hearts-fill half"></i>';
    } else {
      starsHTML += '<i class="ri-poker-hearts-line"></i>';
    }
  }
  
  return starsHTML;
}

// UI Functions
async function loadTopRatedMeals() {
  const featuredContainer = document.getElementById("featured-meals-container");
  if (!featuredContainer) return;

  featuredContainer.innerHTML = ""; // Clear skeleton loaders

  try {
    // First get all meals
    const letters = ["a", "b", "c", "s", "m", "p"];
    let allMeals = [];
    
    for (const letter of letters) {
      const meals = await fetchMealsByFirstLetter(letter);
      allMeals = [...allMeals, ...meals];
    }
    
    // Remove duplicates
    allMeals = [...new Map(allMeals.map((meal) => [meal.idMeal, meal])).values()];
    
    // Get ratings for all meals
    const mealsWithRatings = [];
    
    for (const meal of allMeals) {
      const avgRating = await getAverageRating(meal.idMeal);
      mealsWithRatings.push({
        ...meal,
        avgRating: avgRating
      });
    }
    
    // Sort by rating (highest first) and take top 5
    const topRatedMeals = mealsWithRatings
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    for (const meal of topRatedMeals) {
      const mealCard = createFeaturedMealCard(meal);
      featuredContainer.appendChild(mealCard);
    }
  } catch (error) {
    console.error("Error loading top rated meals:", error);
  }
}

function createFeaturedMealCard(meal) {
  const card = document.createElement("div");
  card.className = "swiper-slide card";
  card.dataset.id = meal.idMeal;

  // Get the average rating
  const avgRating = meal.avgRating || 0;

  // First create with empty rating
  card.innerHTML = `
    <div class="card-content">
      <div class="image">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      </div>
      <div class="name-category">
        <span class="name">${meal.strMeal}</span>
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
        <button class="favorite" data-id="${meal.idMeal}"><i class="ri-heart-line"></i></button>
      </div>
    </div>
  `;

  // Add event listeners
  const recipeBtn = card.querySelector(".recipe");
  const ingredientBtn = card.querySelector(".ingredient");
  const favoriteBtn = card.querySelector(".favorite");
  const ratingStars = card.querySelectorAll(".rating i");

  recipeBtn.addEventListener("click", () => showMealDetail(meal.idMeal));
  ingredientBtn.addEventListener("click", () => showMealDetail(meal.idMeal, "ingredients"));
  favoriteBtn.addEventListener("click", () => addToFavorites(meal.idMeal));

  // Set up rating functionality
  ratingStars.forEach(star => {
    star.addEventListener("click", (e) => {
      const rating = parseInt(e.target.dataset.rating);
      rateMeal(meal.idMeal, rating);
      updateStarDisplay(card, rating);
    });

    // Hover effect
    star.addEventListener("mouseover", (e) => {
      const rating = parseInt(e.target.dataset.rating);
      const stars = card.querySelectorAll(".rating i");
      
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
    star.addEventListener("mouseout", () => {
      const currentRating = parseInt(card.querySelector(".rating").dataset.userRating || "0");
      updateStarDisplay(card, currentRating);
    });
  });

  // Get and display user's rating
  getUserRating(meal.idMeal).then(rating => {
    if (rating > 0) {
      card.querySelector(".rating").dataset.userRating = rating;
      updateStarDisplay(card, rating);
    }
  });

  return card;
}

function updateStarDisplay(container, rating) {
  const stars = container.querySelectorAll(".rating i, .meal-rating i");
  
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
  const ratingContainer = container.querySelector(".rating, .meal-rating");
  if (ratingContainer) {
    ratingContainer.dataset.userRating = rating;
  }
}

async function rateMeal(mealId, rating) {
  try {
    const response = await fetch("rate-meal.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `meal_id=${mealId}&rating=${rating}`,
    });

    const result = await response.json();
    
    // If we have an average rating in the response, update it on the page
    if (result.avgRating) {
      updateAverageRatingDisplay(mealId, result.avgRating);
    }
  } catch (error) {
    console.error("Error rating meal:", error);
    alert("Error rating meal. Please try again.");
  }
}

function updateAverageRatingDisplay(mealId, avgRating) {
  // Update average rating in all meal cards with this ID
  document.querySelectorAll(`[data-id="${mealId}"]`).forEach(card => {
    const avgRatingElement = card.querySelector(".avg-rating");
    if (avgRatingElement) {
      avgRatingElement.querySelector(".avg-rating-label").textContent = `Avg: ${avgRating}`;
      avgRatingElement.title = `Average rating: ${avgRating}`;
      avgRatingElement.querySelector(".avg-rating-stars").innerHTML = generateRatingStars(avgRating);
    }
  });
  
  // Update in modal if open
  const modal = document.getElementById("mealDetailModal");
  if (modal && modal.style.display === "block") {
    const modalAvgRating = modal.querySelector(".meal-detail-avg-rating");
    if (modalAvgRating && modalAvgRating.dataset.mealId === mealId) {
      modalAvgRating.querySelector("p").textContent = `Average Rating: ${avgRating}`;
      modalAvgRating.querySelector(".stars").innerHTML = generateRatingStars(avgRating);
    }
  }
}

let currentPage = 1;
const mealsPerPage = 12;
let allMealsList = [];
let filteredMealsList = [];
let currentSortOption = "default";
let currentCategoryFilter = "all";

async function loadAllMeals() {
  const allMealsContainer = document.getElementById("all-meals");
  if (!allMealsContainer) return;

  allMealsContainer.innerHTML = ""; // Clear skeleton loaders

  try {
    // If we haven't loaded meals yet, fetch them
    if (allMealsList.length === 0) {
      // Get meals starting with different letters to get a good variety
      const letters = ["a", "b", "c", "s", "m", "p"];
      for (const letter of letters) {
        const meals = await fetchMealsByFirstLetter(letter);
        allMealsList = [...allMealsList, ...meals];
      }

      // Remove duplicates
      allMealsList = [...new Map(allMealsList.map((meal) => [meal.idMeal, meal])).values()];
      
      // Initialize filtered list
      filteredMealsList = [...allMealsList];
    }

    // Display current page
    displayMealsPage(currentPage);

    // Set up pagination
    setupPagination();
  } catch (error) {
    console.error("Error loading all meals:", error);
  }
}

async function displayMealsPage(page, append = false) {
  const allMealsContainer = document.getElementById("all-meals");
  if (!allMealsContainer) return;

  const startIndex = (page - 1) * mealsPerPage;
  const endIndex = startIndex + mealsPerPage;
  const mealsToDisplay = filteredMealsList.slice(startIndex, endIndex);

  if (!append) {
    allMealsContainer.innerHTML = "";
  }

  for (const meal of mealsToDisplay) {
    // Get average rating for each meal
    const avgRating = await getAverageRating(meal.idMeal);
    meal.avgRating = avgRating;
    
    const mealCard = createMealCard(meal);
    allMealsContainer.appendChild(mealCard);
  }
}

function setupPagination() {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(filteredMealsList.length / mealsPerPage);
  
  // Previous button
  if (currentPage > 1) {
    const prevButton = document.createElement("button");
    prevButton.className = "pagination-button";
    prevButton.innerHTML = "&laquo; Prev";
    prevButton.addEventListener("click", () => {
      currentPage--;
      displayMealsPage(currentPage);
      setupPagination();
      window.scrollTo(0, document.getElementById("all-meals-section").offsetTop - 100);
    });
    paginationContainer.appendChild(prevButton);
  }
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.className = `pagination-button ${i === currentPage ? "active" : ""}`;
    pageButton.textContent = i;
    pageButton.addEventListener("click", () => {
      currentPage = i;
      displayMealsPage(currentPage);
      setupPagination();
      window.scrollTo(0, document.getElementById("all-meals-section").offsetTop - 100);
    });
    paginationContainer.appendChild(pageButton);
  }
  
  // Next button
  if (currentPage < totalPages) {
    const nextButton = document.createElement("button");
    nextButton.className = "pagination-button";
    nextButton.innerHTML = "Next &raquo;";
    nextButton.addEventListener("click", () => {
      currentPage++;
      displayMealsPage(currentPage);
      setupPagination();
      window.scrollTo(0, document.getElementById("all-meals-section").offsetTop - 100);
    });
    paginationContainer.appendChild(nextButton);
  }
}

function createMealCard(meal) {
  const card = document.createElement("div");
  card.className = "meal-card";
  card.dataset.id = meal.idMeal;

  // Get the average rating
  const avgRating = meal.avgRating || 0;

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
        <button class="add-favorite" data-id="${meal.idMeal}"><i class="ri-heart-line"></i></button>
      </div>
    </div>
  `;

  // Add event listeners
  card.addEventListener("click", () => showMealDetail(meal.idMeal));

  const viewRecipeBtn = card.querySelector(".view-recipe");
  const viewIngredientsBtn = card.querySelector(".view-ingredients");
  const addFavoriteBtn = card.querySelector(".add-favorite");
  const ratingStars = card.querySelectorAll(".meal-rating i");

  viewRecipeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showMealDetail(meal.idMeal, "recipe");
  });

  viewIngredientsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showMealDetail(meal.idMeal, "ingredients");
  });

  addFavoriteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    addToFavorites(meal.idMeal);
  });

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

  // Get and display user's rating
  getUserRating(meal.idMeal).then(rating => {
    if (rating > 0) {
      card.querySelector(".meal-rating").dataset.userRating = rating;
      updateStarDisplay(card, rating);
    }
  });

  return card;
}

async function showMealDetail(id, activeTab = "recipe") {
  const modal = document.getElementById("mealDetailModal");
  const modalContent = document.getElementById("mealDetailContent");

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
    
    // Get average rating
    const avgRating = await getAverageRating(id);

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
                <i class="ri-poker-hearts-${userRating >= 1 ? 'fill' : 'line'}" data-rating="1"></i>
                <i class="ri-poker-hearts-${userRating >= 2 ? 'fill' : 'line'}" data-rating="2"></i>
                <i class="ri-poker-hearts-${userRating >= 3 ? 'fill' : 'line'}" data-rating="3"></i>
                <i class="ri-poker-hearts-${userRating >= 4 ? 'fill' : 'line'}" data-rating="4"></i>
                <i class="ri-poker-hearts-${userRating >= 5 ? 'fill' : 'line'}" data-rating="5"></i>
              </div>
            </div>
          </div>
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
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    // Set up tab switching
    const recipeTab = document.getElementById("recipe-tab");
    const ingredientsTab = document.getElementById("ingredients-tab");
    const recipeContent = document.getElementById("recipe-content");
    const ingredientsContent = document.getElementById("ingredients-content");

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
    const watchVideoBtn = document.getElementById("watch-video");
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

    // Set up add to favorites button
    const addToFavoritesBtn = document.getElementById("add-to-favorites");
    if (addToFavoritesBtn) {
      addToFavoritesBtn.dataset.id = meal.idMeal;
      addToFavoritesBtn.addEventListener("click", () => {
        addToFavorites(meal.idMeal);
      });
    }
  } catch (error) {
    console.error("Error showing meal details:", error);
    modalContent.innerHTML = "<p>Error loading meal details. Please try again.</p>";
  }
}

// Close modal when clicking the close button or outside the modal
document.addEventListener("click", (e) => {
  const mealDetailModal = document.getElementById("mealDetailModal");
  const cuisineMealDetailModal = document.getElementById("cuisineMealDetailModal");

  if (e.target.classList.contains("close-modal")) {
    mealDetailModal.style.display = "none";
  }

  if (e.target.classList.contains("close-cuisine-modal")) {
    cuisineMealDetailModal.style.display = "none";
  }

  if (e.target === mealDetailModal) {
    mealDetailModal.style.display = "none";
  }

  if (e.target === cuisineMealDetailModal) {
    cuisineMealDetailModal.style.display = "none";
  }
});

// Search functionality
async function performSearch() {
  const searchInput = document.getElementById("searchInput");
  const query = searchInput.value.trim();
  if (!query) return;
  
  // If we're not on the userpage, redirect to userpage with search parameter
  if (!window.location.href.includes('userpage.html')) {
    window.location.href = `userpage.html?search=${encodeURIComponent(query)}`;
    return;
  }

  const searchResultsSection = document.getElementById("search-results-section");
  const searchResults = document.getElementById("search-results");
  const noResults = document.getElementById("no-results");
  const allMealsSection = document.getElementById("all-meals-section");
  const featuredMealsSection = document.getElementById("featured-meals");
  const sortOptionsSection = document.getElementById("sort-options");

  if (!searchResultsSection || !searchResults || !noResults) return;

  // Show search results section, hide others
  searchResultsSection.style.display = "block";
  if (allMealsSection) allMealsSection.style.display = "none";
  if (featuredMealsSection) featuredMealsSection.style.display = "none";
  if (sortOptionsSection) sortOptionsSection.style.display = "none";

  // Show loading state
  searchResults.innerHTML = `
    <div class="meal-card skeleton-loader"></div>
    <div class="meal-card skeleton-loader"></div>
    <div class="meal-card skeleton-loader"></div>
  `;
  noResults.style.display = "none";

  try {
    // First try to search by meal name
    let meals = await fetchMealsByName(query);

    // If no results, try to search by category
    if (meals.length === 0) {
      const categories = await fetchAllCategories();
      const matchingCategory = categories.find(cat => 
        cat.strCategory.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchingCategory) {
        meals = await fetchMealsByCategory(matchingCategory.strCategory);
      }
    }

    // If still no results, try to search by area/cuisine
    if (meals.length === 0) {
      meals = await fetchMealsByArea(query);
    }

    if (meals.length === 0) {
      searchResults.innerHTML = "";
      noResults.style.display = "block";
      return;
    }

    // Display results
    searchResults.innerHTML = "";
    for (const meal of meals) {
      // Get average rating for each meal
      const avgRating = await getAverageRating(meal.idMeal);
      meal.avgRating = avgRating;
      
      const mealCard = createMealCard(meal);
      searchResults.appendChild(mealCard);
    }
  } catch (error) {
    console.error("Error performing search:", error);
    searchResults.innerHTML = "<p>Error performing search. Please try again.</p>";
  }
}

// Cuisines page functionality
async function loadAllCuisines() {
  const cuisinesGrid = document.getElementById("cuisines-grid");
  if (!cuisinesGrid) return;

  cuisinesGrid.innerHTML = ""; // Clear skeleton loaders

  try {
    const areas = await fetchAllAreas();

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
    };

    areas.forEach((area) => {
      const cuisineCard = document.createElement("div");
      cuisineCard.className = "cuisine-card";
      cuisineCard.dataset.area = area.strArea;

      // Get image for this cuisine or use a placeholder
      const cuisineImage = cuisineImages[area.strArea] || "https://www.themealdb.com/images/category/beef.png";

      cuisineCard.innerHTML = `
        <img src="${cuisineImage}" alt="${area.strArea} cuisine">
        <h3>${area.strArea}</h3>
        <p>Explore ${area.strArea} cuisine</p>
      `;

      cuisineCard.addEventListener("click", () => {
        loadCuisineMeals(area.strArea);
      });

      cuisinesGrid.appendChild(cuisineCard);
    });
  } catch (error) {
    console.error("Error loading cuisines:", error);
    cuisinesGrid.innerHTML = "<p>Error loading cuisines. Please try again.</p>";
  }
}

async function loadCuisineMeals(area) {
  const cuisinesGridSection = document.getElementById("cuisines-grid-section");
  const cuisineMealsSection = document.getElementById("cuisine-meals-section");
  const cuisineMeals = document.getElementById("cuisine-meals");
  const selectedCuisineTitle = document.getElementById("selected-cuisine-title");

  if (!cuisinesGridSection || !cuisineMealsSection || !cuisineMeals || !selectedCuisineTitle) return;

  // Update URL parameter without reloading the page
  const url = new URL(window.location);
  url.searchParams.set("area", area);
  window.history.pushState({}, "", url);

  // Show cuisine meals section, hide cuisines grid
  cuisinesGridSection.style.display = "none";
  cuisineMealsSection.style.display = "block";

  // Update title
  selectedCuisineTitle.textContent = `${area} Cuisine`;

  // Show loading state
  cuisineMeals.innerHTML = `
    <div class="meal-card skeleton-loader"></div>
    <div class="meal-card skeleton-loader"></div>
    <div class="meal-card skeleton-loader"></div>
    <div class="meal-card skeleton-loader"></div>
  `;

  try {
    const meals = await fetchMealsByArea(area);

    if (meals.length === 0) {
      cuisineMeals.innerHTML = `<p>No meals found for ${area} cuisine.</p>`;
      return;
    }

    // Display meals
    cuisineMeals.innerHTML = "";

    for (const meal of meals) {
      // For each meal in the list, we need to fetch full details to get category
      const fullMeal = await fetchMealById(meal.idMeal);
      
      // Get average rating
      const avgRating = await getAverageRating(meal.idMeal);
      meal.avgRating = avgRating;

      const mealCard = document.createElement("div");
      mealCard.className = "meal-card";
      mealCard.dataset.id = meal.idMeal;

      mealCard.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-card-content">
          <h3>${meal.strMeal}</h3>
          <p>${fullMeal?.strCategory || "Category not available"}</p>
          
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
            <button class="add-favorite" data-id="${meal.idMeal}"><i class="ri-heart-line"></i></button>
          </div>
        </div>
      `;

      // Add event listeners
      mealCard.addEventListener("click", () => {
        showCuisineMealDetail(meal.idMeal);
      });

      const viewRecipeBtn = mealCard.querySelector(".view-recipe");
      const viewIngredientsBtn = mealCard.querySelector(".view-ingredients");
      const addFavoriteBtn = mealCard.querySelector(".add-favorite");
      const ratingStars = mealCard.querySelectorAll(".meal-rating i");

      viewRecipeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showCuisineMealDetail(meal.idMeal, "recipe");
      });

      viewIngredientsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showCuisineMealDetail(meal.idMeal, "ingredients");
      });

      addFavoriteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        addToFavorites(meal.idMeal);
      });

      // Set up rating functionality
      ratingStars.forEach(star => {
        star.addEventListener("click", (e) => {
          e.stopPropagation();
          const rating = parseInt(e.target.dataset.rating);
          rateMeal(meal.idMeal, rating);
          updateStarDisplay(mealCard, rating);
        });

        // Hover effect
        star.addEventListener("mouseover", (e) => {
          e.stopPropagation();
          const rating = parseInt(e.target.dataset.rating);
          const stars = mealCard.querySelectorAll(".meal-rating i");
          
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
          const currentRating = parseInt(mealCard.querySelector(".meal-rating").dataset.userRating || "0");
          updateStarDisplay(mealCard, currentRating);
        });
      });

      // Get and display user's rating
      getUserRating(meal.idMeal).then(rating => {
        if (rating > 0) {
          mealCard.querySelector(".meal-rating").dataset.userRating = rating;
          updateStarDisplay(mealCard, rating);
        }
      });

      cuisineMeals.appendChild(mealCard);
    }
  } catch (error) {
    console.error("Error loading cuisine meals:", error);
    cuisineMeals.innerHTML = `<p>Error loading meals for ${area} cuisine. Please try again.</p>`;
  }
}

function searchCuisines() {
  const cuisineSearchInput = document.getElementById("cuisineSearchInput");
  const query = cuisineSearchInput.value.trim().toLowerCase();
  if (!query) return;

  const cuisineCards = document.querySelectorAll(".cuisine-card");
  let found = false;

  cuisineCards.forEach((card) => {
    const cuisineName = card.querySelector("h3").textContent.toLowerCase();

    if (cuisineName.includes(query)) {
      card.style.display = "block";
      found = true;
    } else {
      card.style.display = "none";
    }
  });

  // If no cuisines match, show message
  const cuisinesGrid = document.getElementById("cuisines-grid");
  if (cuisinesGrid) {
    const noResultsMsg = cuisinesGrid.querySelector(".no-results-msg");

    if (!found) {
      if (!noResultsMsg) {
        const msg = document.createElement("p");
        msg.className = "no-results-msg";
        msg.textContent = `No cuisines found matching "${query}".`;
        cuisinesGrid.appendChild(msg);
      }
    } else if (noResultsMsg) {
      noResultsMsg.remove();
    }
  }
}

// Show cuisine meal details
async function showCuisineMealDetail(id, activeTab = "recipe") {
  const modal = document.getElementById("cuisineMealDetailModal");
  const modalContent = document.getElementById("cuisineMealDetailContent");

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
    
    // Get average rating
    const avgRating = await getAverageRating(id);

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
                <i class="ri-poker-hearts-${userRating >= 1 ? 'fill' : 'line'}" data-rating="1"></i>
                <i class="ri-poker-hearts-${userRating >= 2 ? 'fill' : 'line'}" data-rating="2"></i>
                <i class="ri-poker-hearts-${userRating >= 3 ? 'fill' : 'line'}" data-rating="3"></i>
                <i class="ri-poker-hearts-${userRating >= 4 ? 'fill' : 'line'}" data-rating="4"></i>
                <i class="ri-poker-hearts-${userRating >= 5 ? 'fill' : 'line'}" data-rating="5"></i>
              </div>
            </div>
          </div>
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
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    // Set up tab switching
    const recipeTab = document.getElementById("cuisine-recipe-tab");
    const ingredientsTab = document.getElementById("cuisine-ingredients-tab");
    const recipeContent = document.getElementById("cuisine-recipe-content");
    const ingredientsContent = document.getElementById("cuisine-ingredients-content");

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
    const watchVideoBtn = document.getElementById("cuisine-watch-video");
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

    // Set up add to favorites button
    const addToFavoritesBtn = document.getElementById("cuisine-add-to-favorites");
    if (addToFavoritesBtn) {
      addToFavoritesBtn.dataset.id = meal.idMeal;
      addToFavoritesBtn.addEventListener("click", () => {
        addToFavorites(meal.idMeal);
      });
    }
  } catch (error) {
    console.error("Error showing meal details:", error);
    modalContent.innerHTML = "<p>Error loading meal details. Please try again.</p>";
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
    });

    const result = await response.text();
    alert(result);
  } catch (error) {
    console.error("Error adding to favorites:", error);
    alert("Error adding to favorites. Please try again.");
  }
}

// Load categories for filter dropdown
async function loadCategories() {
  const categoryFilter = document.getElementById("category-filter");
  if (!categoryFilter) return;
  
  try {
    const categories = await fetchAllCategories();
    
    // Add options to the dropdown
    categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category.strCategory;
      option.textContent = category.strCategory;
      categoryFilter.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

// Sort meals
function sortMeals(sortOption) {
  currentSortOption = sortOption;
  
  // Apply both sort and filter
  applyFiltersAndSort();
}

// Filter meals by category
async function filterMealsByCategory(category) {
  currentCategoryFilter = category;
  
  // Apply both sort and filter
  applyFiltersAndSort();
}

// Apply both sorting and filtering
async function applyFiltersAndSort() {
  // Start with all meals
  if (allMealsList.length === 0) {
    await loadAllMeals();
  }
  
  // Apply category filter first
  if (currentCategoryFilter === "all") {
    filteredMealsList = [...allMealsList];
  } else {
    // If we're filtering by category, we need to fetch those meals
    const categoryMeals = await fetchMealsByCategory(currentCategoryFilter);
    
    // Create a set of meal IDs for quick lookup
    const categoryMealIds = new Set(categoryMeals.map(meal => meal.idMeal));
    
    // Filter the all meals list to only include meals from this category
    filteredMealsList = allMealsList.filter(meal => categoryMealIds.has(meal.idMeal));
    
    // If we don't have enough meals in our all meals list, add the category meals
    if (filteredMealsList.length < categoryMeals.length) {
      const existingIds = new Set(filteredMealsList.map(meal => meal.idMeal));
      const additionalMeals = categoryMeals.filter(meal => !existingIds.has(meal.idMeal));
      
      // For each additional meal, fetch full details
      for (const meal of additionalMeals) {
        const fullMeal = await fetchMealById(meal.idMeal);
        if (fullMeal) {
          filteredMealsList.push(fullMeal);
        }
      }
    }
  }
  
  // Then apply sorting
  switch (currentSortOption) {
    case "a-z":
      filteredMealsList.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
      break;
    case "z-a":
      filteredMealsList.sort((a, b) => b.strMeal.localeCompare(a.strMeal));
      break;
    default:
      // Default sorting (no change)
      break;
  }
  
  // Reset to page 1 and display
  currentPage = 1;
  displayMealsPage(currentPage);
  setupPagination();
}

// Create get-username.php file