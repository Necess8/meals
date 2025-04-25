<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: signin.html');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>My Profile - Meal Finder</title>
  <link href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/boxicons@latest/css/boxicons.min.css">
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <!-- Navbar -->
  <nav class="navbar">
    <div class="navbar-left">
      <h1 class="logo"><i class="ri-bowl-line"></i>Meal Finder</h1>
    </div>
    <div class="navbar-center">
    <ul class="nav-link">
      <li><a href="index.html">Home</a></li>
      <li><a href="cuisines.html">Cuisines</a></li>
      <li><a href="about.html">About Us</a></li>
      <li class="active"><a href="profile.php">My Profile</a></li>
    </ul>
    </div>
    <div class="navbar-right">
      <div class="searchBar">
        <input type="text" placeholder="Search meals, cuisines, ingredients..." id="searchInput" />
        <button id="searchBtn"><i class="ri-search-line"></i></button>
      </div>
      <a href="logout.php" class="logout-btn">Log Out</a>
    </div>
    <a href="#" class="menuBtn"><i class="ri-menu-line"></i></a>
  </nav>

  <!-- Profile Header -->
  <div class="profile-header">
    <div class="container">
      <div class="profile-info">
        <div class="profile-avatar">
          <i class="ri-user-fill"></i>
        </div>
        <div class="profile-details">
          <h1 id="username-display">Loading...</h1>
          <p>Member since <span id="member-since">April 2025</span></p>
        </div>
      </div>
    </div>
  </div>

  <!-- Profile Content -->
  <div class="profile-content">
    <div class="container">
      <!-- Tabs -->
      <div class="profile-tabs">
        <button class="tab-btn active" data-tab="favorites">My Favorites <span id="favorites-count">(0)</span></button>
        <button class="tab-btn" data-tab="rated">Rated Meals <span id="rated-count">(0)</span></button>
      </div>

      <!-- Favorites Tab -->
      <div class="tab-content active" id="favorites-tab">
        <div class="favorites-info">
          <p>You can save up to 10 favorite meals. <span id="favorites-remaining"></span></p>
        </div>
        <div id="favorites-container" class="meals-grid">
          <div class="loading-message">Loading your favorite meals...</div>
        </div>
      </div>

      <!-- Rated Meals Tab -->
      <div class="tab-content" id="rated-tab">
        <div id="rated-container" class="meals-grid">
          <div class="loading-message">Loading your rated meals...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Meal Details Modal -->
  <div id="profileMealDetailModal" class="modal">
    <div class="modal-content">
      <span class="close-profile-modal">&times;</span>
      <div id="profileMealDetailContent">
        <!-- Meal details will be dynamically inserted here -->
      </div>
      <div class="modal-actions">
        <button id="profile-add-to-favorites" class="btn"><i class="ri-heart-line"></i> <span>Add to Favorites</span></button>
        <button id="profile-watch-video" class="btn"><i class="ri-youtube-line"></i> Watch Video</button>
      </div>
    </div>
  </div>

  <script src="script.js"></script>
  <script src="profile.js"></script>
  <footer>
    <p>All Rights Reserved. | April 2025</p>
  </footer>
</body>
</html>
