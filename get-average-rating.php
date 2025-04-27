<?php
session_start();
header('Content-Type: application/json');

$host = 'localhost';
$db = 'user-meal';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(['error' => 'Connection failed: ' . $conn->connect_error]);
    exit();
}

if (isset($_GET['meal_id'])) {
    $meal_id = $_GET['meal_id'];

    $stmt = $conn->prepare("SELECT AVG(rating) as avg_rating FROM ratings WHERE meal_id = ?");
    $stmt->bind_param("s", $meal_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    if ($row && $row['avg_rating'] !== null) {
        echo json_encode(['avgRating' => round($row['avg_rating'], 1)]);
    } else {
        echo json_encode(['avgRating' => 0]);
    }
} else {
    echo json_encode(['error' => 'Missing meal_id parameter']);
}

$conn->close();
?>