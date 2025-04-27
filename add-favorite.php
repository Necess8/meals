<?php
session_start();

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
    $meal_id = $_POST['meal_id'];

    if (!$meal_id) {
        echo "Missing meal ID.";
        exit();
    }

    // Check if already in favorites
    $check = $conn->prepare("SELECT id FROM favorites WHERE user_id = ? AND meal_id = ?");
    $check->bind_param("is", $user_id, $meal_id);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo "This meal is already in your favorites.";
    } else {
        $stmt = $conn->prepare("INSERT INTO favorites (user_id, meal_id, created_at) VALUES (?, ?, NOW())");
        $stmt->bind_param("is", $user_id, $meal_id);

        if ($stmt->execute()) {
            echo "Meal added to favorites!";
        } else {
            echo "Error adding to favorites: " . $stmt->error;
        }
    }
} else {
    echo "Invalid request method.";
}

$conn->close();
?>