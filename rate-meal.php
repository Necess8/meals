<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'User not logged in']);
    exit();
}

$host = 'localhost';
$db = 'user-meal';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(['error' => 'Connection failed: ' . $conn->connect_error]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_SESSION['user_id'];
    $meal_id = $_POST['meal_id'];
    $rating = $_POST['rating'];

    if (!$meal_id || !$rating) {
        echo json_encode(['error' => 'Missing required parameters']);
        exit();
    }

    // Check if user has already rated this meal
    $check = $conn->prepare("SELECT id FROM ratings WHERE user_id = ? AND meal_id = ?");
    $check->bind_param("is", $user_id, $meal_id);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        // Update existing rating
        $stmt = $conn->prepare("UPDATE ratings SET rating = ?, updated_at = NOW() WHERE user_id = ? AND meal_id = ?");
        $stmt->bind_param("iis", $rating, $user_id, $meal_id);
    } else {
        // Insert new rating
        $stmt = $conn->prepare("INSERT INTO ratings (user_id, meal_id, rating, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
        $stmt->bind_param("isi", $user_id, $meal_id, $rating);
    }

    if ($stmt->execute()) {
        // Get the average rating for this meal
        $avgStmt = $conn->prepare("SELECT AVG(rating) as avg_rating FROM ratings WHERE meal_id = ?");
        $avgStmt->bind_param("s", $meal_id);
        $avgStmt->execute();
        $avgResult = $avgStmt->get_result();
        $avgRow = $avgResult->fetch_assoc();
        $avgRating = round($avgRow['avg_rating'], 1);

        echo json_encode(['success' => true, 'avgRating' => $avgRating]);
    } else {
        echo json_encode(['error' => 'Error saving rating: ' . $stmt->error]);
    }
} else {
    echo json_encode(['error' => 'Invalid request method']);
}

$conn->close();
?>