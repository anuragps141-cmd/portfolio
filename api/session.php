<?php
require __DIR__ . '/bootstrap.php';

$user = getCurrentUser();
if (!$user) {
    jsonResponse(['authenticated' => false]);
}

jsonResponse(['authenticated' => true, 'user' => [
    'uid' => $user['id'],
    'email' => $user['email'],
    'displayName' => $user['display_name'] ?? '',
    'phone' => $user['phone'] ?? '',
    'bio' => $user['bio'] ?? '',
    'country' => $user['country'] ?? ''
]]);
