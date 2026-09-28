<?php
require __DIR__ . '/bootstrap.php';

requireAuth();
$data = getRequestData();
$action = $data['action'] ?? '';
$uid = $_SESSION['user_id'];

if ($action === 'updateProfile') {
    $displayName = trim($data['displayName'] ?? '');
    if (!$displayName) {
        jsonResponse(['error' => 'Display name is required'], 400);
    }

    $stmt = $pdo->prepare('UPDATE users SET display_name = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$displayName, $uid]);
    jsonResponse(['success' => true]);
}

if ($action === 'reauthenticate') {
    $credential = $data['credential'] ?? null;
    if (!$credential || empty($credential['email']) || empty($credential['password'])) {
        jsonResponse(['error' => 'Credential is required'], 400);
    }

    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$uid]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($credential['password'], $user['password_hash'])) {
        jsonResponse(['error' => 'Reauthentication failed'], 401);
    }

    jsonResponse(['success' => true]);
}

jsonResponse(['error' => 'Invalid action'], 400);
