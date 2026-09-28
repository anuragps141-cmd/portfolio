<?php
require __DIR__ . '/bootstrap.php';

session_destroy();
jsonResponse(['success' => true]);
