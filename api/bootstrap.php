<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

// Update these values for your MySQL database.
const DB_HOST = '127.0.0.1';
const DB_NAME = 'scamguard';
const DB_USER = 'root';
const DB_PASS = '';

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function getRequestData() {
    $body = file_get_contents('php://input');
    if ($body) {
        $data = json_decode($body, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $data;
        }
    }
    return $_POST;
}

function requireAuth() {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['error' => 'Not authenticated'], 401);
    }
}

function getCurrentUser() {
    global $pdo;
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $stmt = $pdo->prepare('SELECT id, email, display_name, phone, bio, country FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

function normalizeTimestampValue($value) {
    if (is_array($value) && isset($value['__serverTimestamp']) && $value['__serverTimestamp'] === true) {
        return date('Y-m-d H:i:s');
    }
    return $value;
}

function normalizeData($data) {
    foreach ($data as $key => $value) {
        if (is_array($value) && isset($value['__serverTimestamp']) && $value['__serverTimestamp'] === true) {
            $data[$key] = date('Y-m-d H:i:s');
        }
    }
    return $data;
}
