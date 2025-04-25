<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in to rate meals.']);
    exit();
}

$host = 'localhost';
$db = 'user-meal';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_SESSION['user_id'];
    $meal_id = $_POST['meal_id'] ?? '';
    $rating = $_POST['rating'] ?? '';
    
    if (empty($meal_id) || !is_numeric($rating) || $rating < 1 || $rating > 5) {
        echo json_encode(['success' => false, 'message' => 'Invalid meal ID or rating.']);
        exit();
    }
    
    // Check if user has already rated this meal
    $check = $conn->prepare("SELECT id, rating FROM ratings WHERE user_id = ? AND meal_id = ?");
    $check->bind_param("is", $user_id, $meal_id);
    $check->execute();
    $result = $check->get_result();
    
    if ($result->num_rows > 0) {
        // Update existing rating
        $row = $result->fetch_assoc();
        $stmt = $conn->prepare("UPDATE ratings SET rating = ?, updated_at = NOW() WHERE id = ?");
        $stmt->bind_param("ii", $rating, $row['id']);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Rating updated successfully!', 'previous_rating' => $row['rating']]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error updating rating: ' . $stmt->error]);
        }
    } else {
        // Insert new rating
        $stmt = $conn->prepare("INSERT INTO ratings (user_id, meal_id, rating, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())");
        $stmt->bind_param("isi", $user_id, $meal_id, $rating);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Meal rated successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error rating meal: ' . $stmt->error]);
        }
    }
}

$conn->close();
?>
