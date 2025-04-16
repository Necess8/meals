<?php
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
        echo "Username must be 15 characters or less with no spaces. <a href='signin.html'>Try again</a>";
        exit();
    }

    if ($username === '' || $password === '') {
        echo "All fields are required.";
        exit();
    }

    // Check if username exists
    $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $check->bind_param("s", $username);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo "Username already exists. <a href='signin.html'>Try again</a>";
    } else {
        $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
        $stmt->bind_param("ss", $username, $password);

        if ($stmt->execute()) {
            header("Location: index.html");
            exit();
        } else {
            echo "Registration error: " . $stmt->error;
        }
    }
}
$conn->close();
?>
