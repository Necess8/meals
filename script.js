// Toggle mobile nav
const menuBtn = document.querySelector('.menuBtn');
const navlink = document.querySelector('.nav-link');

menuBtn.addEventListener('click', () => {
  navlink.classList.toggle('mobile-menu');
});

// Toggle sign in/register view
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.registerr-btn');
const loginBtn = document.querySelector('.loginn-btn');

if (registerBtn && loginBtn && container) {
  registerBtn.addEventListener('click', () => {
    container.classList.add('active');
  });

  loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
  });
}

// Meal search functionality
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const mealResults = document.getElementById('mealResults');
const mealDetailModal = document.getElementById('mealDetailModal');
const mealDetailContent = document.getElementById('mealDetailContent');

if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`)
        .then(res => res.json())
        .then(data => displayMeals(data.meals))
        .catch(err => {
          mealResults.innerHTML = `<p>Error fetching meals.</p>`;
          console.error(err);
        });
    }
  });
}

function displayMeals(meals) {
  if (!meals) {
    mealResults.innerHTML = "<p>No meals found.</p>";
    return;
  }
  mealResults.innerHTML = meals.map(meal => `
    <div style="border:1px solid #ccc; margin:10px; padding:10px; border-radius:10px; cursor:pointer;" onclick="showMealDetail('${meal.idMeal}')">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" style="width:100%; max-width:300px; border-radius:10px;" />
      <h3>${meal.strMeal}</h3>
    </div>
  `).join('');
}

function showMealDetail(id) {
  fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
    .then(res => res.json())
    .then(data => {
      const meal = data.meals[0];
      mealDetailContent.innerHTML = `
        <h2>${meal.strMeal}</h2>
        <img src="${meal.strMealThumb}" style="width:100%; max-width:400px; border-radius:10px;" />
        <h3>Category: ${meal.strCategory}</h3>
        <h3>Area: ${meal.strArea}</h3>
        <p style="margin-top:10px;">${meal.strInstructions.replace(/\r\n/g, '<br>')}</p>
        <a href="${meal.strYoutube}" target="_blank">Watch on YouTube</a>
      `;
      mealDetailModal.style.display = 'block';
    });
}

function closeModal() {
  mealDetailModal.style.display = 'none';
}
