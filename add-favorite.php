<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo "You must be logged in to add favorites.";
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
    
    // Check if meal is already in favorites
    $check = $conn->prepare("SELECT id FROM favorites WHERE user_id = ? AND meal_id = ?");
    $check->bind_param("is", $user_id, $meal_id);
    $check->execute();
    $check->store_result();
    
    if ($check->num_rows > 0) {
        echo "This meal is already in your favorites.";
    } else {
        try {
            $stmt = $conn->prepare("INSERT INTO favorites (user_id, meal_id) VALUES (?, ?)");
            $stmt->bind_param("is", $user_id, $meal_id);
            
            if ($stmt->execute()) {
                echo "Meal added to favorites successfully!";
            } else {
                echo "Error adding to favorites: " . $stmt->error;
            }
        } catch (Exception $e) {
            if ($e->getCode() == 1644) { // MySQL error code for trigger error
                echo "You can only have up to 10 favorite meals.";
            } else {
                echo "Error: " . $e->getMessage();
            }
        }
    }
}

$conn->close();
?>
