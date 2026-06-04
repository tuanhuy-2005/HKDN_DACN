<?php
require __DIR__ . '/../vendor/autoload.php';

$pdo = \App\Config\Database::pdo();

$email = 'autotest+' . time() . '@example.com';
$name = 'Auto Test User';
$phone = '0901111222';
$passwordHash = password_hash('testpassword', PASSWORD_BCRYPT);

// Create user
$stmt = $pdo->prepare('INSERT INTO users (name, email, phone, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
$stmt->execute([$name, $email, $phone, $passwordHash, 'user']);
$userId = (int)$pdo->lastInsertId();

// Create reservation linked to user
$date = date('Y-m-d', strtotime('+1 day'));
$time = '18:00:00';
$guests = 2;
$stmt = $pdo->prepare('INSERT INTO reservations (user_id, name, email, phone, reservation_date, reservation_time, guests, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
$stmt->execute([$userId, $name, $email, $phone, $date, $time, $guests, 'pending']);
$reservationId = (int)$pdo->lastInsertId();

echo json_encode(['user_id' => $userId, 'email' => $email, 'reservation_id' => $reservationId], JSON_PRETTY_PRINT) . PHP_EOL;
