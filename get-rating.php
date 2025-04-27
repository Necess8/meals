<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['rating' => 0]);
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

if (isset($_GET['meal_id'])) {
    $user_id = $_SESSION['user_id'];
    $meal_id = $_GET['meal_id'];

    $stmt = $conn->prepare("SELECT rating FROM ratings WHERE user_id = ? AND meal_id = ?");
    $stmt->bind_param("is", $user_id, $meal_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        echo json_encode(['rating' => (int)$row['rating']]);
    } else {
        echo json_encode(['rating' => 0]);
    }
} else {
    echo json_encode(['error' => 'Missing meal_id parameter']);
}

$conn->close();
?>