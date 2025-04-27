<?php
session_start();

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
    $meal_id = $_POST['meal_id'];

    if (!$meal_id) {
        echo "Missing meal ID.";
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM favorites WHERE user_id = ? AND meal_id = ?");
    $stmt->bind_param("is", $user_id, $meal_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo "Meal removed from favorites!";
        } else {
            echo "This meal was not in your favorites.";
        }
    } else {
        echo "Error removing from favorites: " . $stmt->error;
    }
} else {
    echo "Invalid request method.";
}

$conn->close();
?>