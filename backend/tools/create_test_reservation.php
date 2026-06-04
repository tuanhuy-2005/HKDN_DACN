<?php
require __DIR__ . '/../vendor/autoload.php';

$pdo = \App\Config\Database::pdo();

$name = 'Test User';
$email = 'test.user@example.com';
$phone = '0900000000';
$date = '2026-06-30';
$time = '19:30:00';
$guests = 4;
$status = 'pending';

$sql = "INSERT INTO reservations (user_id, name, email, phone, reservation_date, reservation_time, guests, status, created_at, updated_at) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW());";
$stmt = $pdo->prepare($sql);
$stmt->execute([$name, $email, $phone, $date, $time, $guests, $status]);

$id = $pdo->lastInsertId();
echo "Inserted reservation id: $id\n";
