<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["rating" => 0]);
    exit();
}

$host = 'localhost';
$db = 'user-meal';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(["rating" => 0, "error" => "Connection failed"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = $_SESSION['user_id'];
    $meal_id = $_GET['meal_id'] ?? '';
    
    if (empty($meal_id)) {
        echo json_encode(["rating" => 0, "error" => "Meal ID is required"]);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT rating FROM ratings WHERE user_id = ? AND meal_id = ?");
    $stmt->bind_param("is", $user_id, $meal_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo json_encode(["rating" => (int)$row['rating']]);
    } else {
        echo json_encode(["rating" => 0]);
    }
}

$conn->close();
?>