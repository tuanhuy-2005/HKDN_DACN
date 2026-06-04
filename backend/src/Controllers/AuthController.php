<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Services\JwtService;
use App\Utils\HttpException;
use App\Utils\Request;
use App\Utils\Response;
use PDO;

final class AuthController
{
    private const NOT_FOUND = 'User not found';

    /** @param array<string,mixed> $params */
    public static function register(array $params = []): void
    {
        unset($params);

        $body = Request::jsonBody();
        $name = trim((string)($body['name'] ?? ''));
        $email = trim((string)($body['email'] ?? ''));
        $phone = trim((string)($body['phone'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if ($name === '' || $email === '' || $phone === '' || $password === '') {
            throw new HttpException('Missing required fields', 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException('Invalid email', 422);
        }
        if (strlen($password) < 8) {
            throw new HttpException('Password must be at least 8 characters', 422);
        }

        $pdo = Database::pdo();

        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        if ($stmt->fetch()) {
            throw new HttpException('Email already exists', 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('INSERT INTO users (name, email, phone, password_hash, role, created_at) VALUES (:name, :email, :phone, :password_hash, :role, NOW())');
        $stmt->execute([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'password_hash' => $hash,
            'role' => 'user',
        ]);

        $userId = (int)$pdo->lastInsertId();

        $user = [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'role' => 'user',
        ];

        $token = JwtService::issue($userId, 'user');

        Response::success([
            'token' => $token,
            'user' => $user,
        ], 'Success', [], 201);
    }

    /** @param array<string,mixed> $params */
    public static function login(array $params = []): void
    {
        unset($params);

        $body = Request::jsonBody();
        $email = trim((string)($body['email'] ?? ''));
        $password = (string)($body['password'] ?? '');

        if ($email === '' || $password === '') {
            throw new HttpException('Missing required fields', 422);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, name, email, phone, role, password_hash FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || !password_verify($password, (string)$row['password_hash'])) {
            throw new HttpException('Invalid credentials', 401);
        }

        $userId = (int)$row['id'];
        $role = (string)$row['role'];
        $token = JwtService::issue($userId, $role);

        Response::success([
            'token' => $token,
            'user' => [
                'id' => $userId,
                'name' => (string)$row['name'],
                'email' => (string)$row['email'],
                'phone' => (string)$row['phone'],
                'role' => $role,
            ],
        ], 'Success');
    }

    /** @param array<string,mixed> $params */
    public static function me(array $params = []): void
    {
        unset($params);

        $claims = JwtService::requireAuth();

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, name, email, phone, role FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => (int)$claims['sub']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        Response::success(['user' => $row], 'Success');
    }

    /** @param array<string,mixed> $params */
    public static function updateMe(array $params = []): void
    {
        unset($params);

        $claims = JwtService::requireAuth();
        $userId = (int)($claims['sub'] ?? 0);

        $body = Request::jsonBody();
        $fields = [];
        $bind = ['id' => $userId];

        if (array_key_exists('name', $body)) {
            $name = trim((string)$body['name']);
            if ($name === '') {
                throw new HttpException('Invalid name', 422);
            }
            $fields[] = 'name = :name';
            $bind['name'] = $name;
        }

        if (array_key_exists('email', $body)) {
            $email = trim((string)$body['email']);
            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new HttpException('Invalid email', 422);
            }
            $fields[] = 'email = :email';
            $bind['email'] = $email;
        }

        if (array_key_exists('phone', $body)) {
            $phone = trim((string)$body['phone']);
            if ($phone === '') {
                throw new HttpException('Invalid phone', 422);
            }
            $fields[] = 'phone = :phone';
            $bind['phone'] = $phone;
        }

        if ($fields === []) {
            throw new HttpException('No fields to update', 422);
        }

        $pdo = Database::pdo();

        if (isset($bind['email'])) {
            $check = $pdo->prepare('SELECT id FROM users WHERE email = :email AND id != :id LIMIT 1');
            $check->execute(['email' => $bind['email'], 'id' => $userId]);
            if ($check->fetch()) {
                throw new HttpException('Email already exists', 409);
            }
        }

        $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id');
        $stmt->execute($bind);

        $rowStmt = $pdo->prepare('SELECT id, name, email, phone, role FROM users WHERE id = :id LIMIT 1');
        $rowStmt->execute(['id' => $userId]);
        $row = $rowStmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        Response::success(['user' => $row], 'Success');
    }
}
