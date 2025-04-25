<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo "You must be logged in to remove favorites.";
    exit();
}

$host = 'localhost';
$db = 'user-meal';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo "Connection failed: " . $conn->connect_error;
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_SESSION['user_id'];
    $meal_id = $_POST['meal_id'] ?? '';
    
    if (empty($meal_id)) {
        echo "Meal ID is required.";
        exit();
    }
    
    // Delete the favorite
    $stmt = $conn->prepare("DELETE FROM favorites WHERE user_id = ? AND meal_id = ?");
    $stmt->bind_param("is", $user_id, $meal_id);
    
    if ($stmt->execute()) {
        echo "Meal removed from favorites successfully!";
    } else {
        echo "Error removing from favorites: " . $stmt->error;
    }
}

$conn->close();
?>
