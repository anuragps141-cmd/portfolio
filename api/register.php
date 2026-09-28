<?php
require __DIR__ . '/bootstrap.php';

$data = getRequestData();
$displayName = trim($data['displayName'] ?? $data['name'] ?? '');
$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = trim($data['password'] ?? '');

if (!$displayName || !$email || !$password) {
    jsonResponse(['error' => 'Name, email and password are required'], 400);
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    jsonResponse(['error' => 'Email is already registered'], 409);
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (email, display_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
$stmt->execute([$email, $displayName, $passwordHash]);
$userId = $pdo->lastInsertId();

$_SESSION['user_id'] = $userId;
jsonResponse([
    'user' => [
        'uid' => $userId,
        'email' => $email,
        'displayName' => $displayName
    ]
]);
