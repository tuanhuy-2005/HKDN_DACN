<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\RoleMiddleware;
use App\Utils\HttpException;
use App\Utils\Request;
use App\Utils\Response;

final class UserController
{
    private const NOT_FOUND = 'Not Found';

    public static function adminList(array $params = []): void
    {
        unset($params);

        RoleMiddleware::requireAdmin();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $pdo = Database::pdo();
        $countStmt = $pdo->query('SELECT COUNT(*) AS c FROM users');
        $total = (int)($countStmt->fetch()['c'] ?? 0);

        $stmt = $pdo->prepare('SELECT id, name, email, phone, role, created_at FROM users ORDER BY id DESC LIMIT :limit OFFSET :offset');
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();

        Response::success(['items' => $stmt->fetchAll()], 'Success', [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => (int)ceil($total / $limit),
        ]);
    }

    public static function adminShow(array $params = []): void
    {
        RoleMiddleware::requireAdmin();

        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        Response::success($row, 'Success');
    }

    public static function adminUpdate(array $params = []): void
    {
        RoleMiddleware::requireAdmin();

        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $body = Request::jsonBody();
        [$fields, $bind] = self::buildUserUpdateData($body);

        if ($fields === []) {
            throw new HttpException('No fields to update', 422);
        }

        $bind['id'] = $id;

        $pdo = Database::pdo();

        if (isset($bind['email'])) {
            $check = $pdo->prepare('SELECT id FROM users WHERE email = :email AND id != :id LIMIT 1');
            $check->execute(['email' => $bind['email'], 'id' => $id]);
            if ($check->fetch()) {
                throw new HttpException('Email already exists', 409);
            }
        }

        $exists = $pdo->prepare('SELECT id FROM users WHERE id = :id LIMIT 1');
        $exists->execute(['id' => $id]);
        if (!$exists->fetch()) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bind);

        $rowStmt = $pdo->prepare('SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = :id LIMIT 1');
        $rowStmt->execute(['id' => $id]);
        $row = $rowStmt->fetch();

        Response::success($row, 'Success');
    }

    /**
     * @return array{0: array<int, string>, 1: array<string, mixed>}
     */
    private static function buildUserUpdateData(array $body): array
    {
        $fields = [];
        $bind = [];

        if (array_key_exists('role', $body)) {
            $role = strtolower(trim((string)$body['role']));
            if (!in_array($role, ['admin', 'user'], true)) {
                throw new HttpException('Invalid role', 422);
            }
            $fields[] = 'role = :role';
            $bind['role'] = $role;
        }

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
            $fields[] = 'phone = :phone';
            $bind['phone'] = $phone;
        }

        return [$fields, $bind];
    }
}

