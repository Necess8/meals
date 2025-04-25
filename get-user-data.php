<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in to view this data.']);
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

$user_id = $_SESSION['user_id'];
$response = [
    'success' => true,
    'favorites' => [],
    'ratings' => []
];

// Get user's favorite meals
$favorites_query = $conn->prepare("SELECT meal_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC");
$favorites_query->bind_param("i", $user_id);
$favorites_query->execute();
$favorites_result = $favorites_query->get_result();

while ($row = $favorites_result->fetch_assoc()) {
    $response['favorites'][] = $row['meal_id'];
}

// Get user's rated meals
$ratings_query = $conn->prepare("SELECT meal_id, rating FROM ratings WHERE user_id = ? ORDER BY updated_at DESC");
$ratings_query->bind_param("i", $user_id);
$ratings_query->execute();
$ratings_result = $ratings_query->get_result();

while ($row = $ratings_result->fetch_assoc()) {
    $response['ratings'][$row['meal_id']] = $row['rating'];
}

// Get username
$username_query = $conn->prepare("SELECT username FROM users WHERE id = ?");
$username_query->bind_param("i", $user_id);
$username_query->execute();
$username_result = $username_query->get_result();

if ($username_row = $username_result->fetch_assoc()) {
    $response['username'] = $username_row['username'];
}

echo json_encode($response);
$conn->close();
?>
