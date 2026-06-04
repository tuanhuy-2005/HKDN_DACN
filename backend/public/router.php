<?php

declare(strict_types=1);

// PHP built-in server router.
// Usage: php -S 127.0.0.1:8000 -t public public/router.php

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (!is_string($path)) {
    $path = '/';
}

$fullPath = __DIR__ . $path;

// If the requested resource exists as a file, serve it directly.
if ($path !== '/' && file_exists($fullPath) && !is_dir($fullPath)) {
    return false;
}

require_once __DIR__ . '/index.php';
