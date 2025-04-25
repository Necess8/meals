<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$db = 'user-meal';
$user = 'root';
$pass = '';
$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);

    // Validate username
    if (strlen($username) > 15 || preg_match('/\s/', $username)) {
        echo "Invalid username format. <a href='signin.html'>Try again</a>";
        exit();
    }

    if ($username === '' || $password === '') {
        echo "Please fill in all fields.";
        exit();
    }

    $stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if ($user && $user['password'] === $password) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;
        header("Location: profile.html");
        exit();
    } else {
        echo "Invalid username or password. <a href='signin.html'>Try again</a>";
    }
}
$conn->close();
?>
