<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$db = 'user-meal';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(["avgRating" => 0, "error" => "Connection failed"]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $meal_id = $_GET['meal_id'] ?? '';
    
    if (empty($meal_id)) {
        echo json_encode(["avgRating" => 0, "error" => "Meal ID is required"]);
        exit();
    }
    
    $stmt = $conn->prepare("SELECT AVG(rating) as avg_rating FROM ratings WHERE meal_id = ?");
    $stmt->bind_param("s", $meal_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $avgRating = $row['avg_rating'] ? round($row['avg_rating'], 1) : 0;
        echo json_encode(["avgRating" => $avgRating]);
    } else {
        echo json_encode(["avgRating" => 0]);
    }
}

$conn->close();
?>