<?php
require __DIR__ . '/../vendor/autoload.php';

$pdo = \App\Config\Database::pdo();

$out = [];

// Admin users
$stmt = $pdo->prepare('SELECT id, name, email, role, created_at FROM users WHERE role = ?');
$stmt->execute(['admin']);
$out['admins'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Reservations with user info
$stmt = $pdo->prepare('SELECT r.id AS reservation_id, r.user_id, r.name AS reservation_name, r.email AS reservation_email, r.phone, r.reservation_date, r.reservation_time, r.status, u.id AS user_id_in_users, u.email AS user_email FROM reservations r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.id DESC LIMIT 100');
$stmt->execute();
$out['reservations'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Invoices with user info
$stmt = $pdo->prepare('SELECT i.id AS invoice_id, i.user_id, i.reservation_id, i.code, i.subtotal, i.total, u.id AS user_id_in_users, u.email AS user_email FROM invoices i LEFT JOIN users u ON i.user_id = u.id ORDER BY i.id DESC LIMIT 100');
$stmt->execute();
$out['invoices'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
