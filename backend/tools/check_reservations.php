<?php
declare(strict_types=1);

// Simple DB check script used during local debugging inside the backend container.
$host = getenv('DB_HOST') ?: '127.0.0.1';
$db = getenv('DB_NAME') ?: 'cafe_db';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

try {
    $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->query('SELECT id,name,email,phone,reservation_date,reservation_time,status,created_at FROM reservations ORDER BY id DESC LIMIT 50');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!$rows) {
        echo "(no rows)\n";
        exit(0);
    }
    foreach ($rows as $r) {
        echo json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'ERR: ' . $e->getMessage() . "\n");
    exit(2);
}
