<?php
require __DIR__ . '/bootstrap.php';

$data = getRequestData();
$email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = trim($data['password'] ?? '');

if (!$email || !$password) {
    jsonResponse(['error' => 'Email and password are required'], 400);
}

$stmt = $pdo->prepare('SELECT id, email, display_name, password_hash FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonResponse(['error' => 'Invalid email or password'], 401);
}

$_SESSION['user_id'] = $user['id'];

jsonResponse([
    'user' => [
        'uid' => $user['id'],
        'email' => $user['email'],
        'displayName' => $user['display_name'] ?? ''
    ]
]);
