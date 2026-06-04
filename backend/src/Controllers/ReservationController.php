<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Utils\HttpException;
use App\Utils\Request;
use App\Utils\Response;

final class ReservationController
{
    private const NOT_FOUND = 'Not Found';

    /** Customer create reservation (optional auth: if token present, link user_id) */
    public static function create(array $params = []): void
    {
        unset($params);

        $body = Request::jsonBody();

        $name = trim((string)($body['name'] ?? ''));
        $email = trim((string)($body['email'] ?? ''));
        $phone = trim((string)($body['phone'] ?? ''));
        $date = trim((string)($body['date'] ?? $body['reservation_date'] ?? ''));
        $time = trim((string)($body['time'] ?? $body['reservation_time'] ?? ''));
        $guests = (int)($body['guests'] ?? 0);
        $notes = (string)($body['notes'] ?? null);

        if ($name === '' || $email === '' || $phone === '' || $date === '' || $time === '' || $guests <= 0) {
            throw new HttpException('Missing required fields', 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new HttpException('Invalid email', 422);
        }

        $userId = null;
        try {
            $claims = AuthMiddleware::requireAuth();
            $userId = (int)($claims['sub'] ?? 0);
        } catch (\Throwable $e) {
            $userId = null;
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('INSERT INTO reservations (user_id, name, email, phone, reservation_date, reservation_time, guests, notes, status, created_at) VALUES (:user_id, :name, :email, :phone, :d, :t, :guests, :notes, :status, NOW())');
        $stmt->execute([
            'user_id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'd' => $date,
            't' => $time,
            'guests' => $guests,
            'notes' => $notes,
            'status' => 'pending',
        ]);

        Response::success(['id' => (int)$pdo->lastInsertId(), 'status' => 'pending'], 'Success', [], 201);
    }

    /** Customer reservation history (auth required) */
    public static function myList(array $params = []): void
    {
        unset($params);

        $claims = AuthMiddleware::requireAuth();
        $userId = (int)($claims['sub'] ?? 0);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, reservation_date, reservation_time, guests, notes, status, created_at FROM reservations WHERE user_id = :uid ORDER BY id DESC');
        $stmt->execute(['uid' => $userId]);
        $items = $stmt->fetchAll();

        Response::success(['items' => $items], 'Success');
    }

    /** Admin list reservations */
    public static function adminList(array $params = []): void
    {
        unset($params);

        RoleMiddleware::requireAdmin();

        $q = trim((string)($_GET['q'] ?? ''));
        $status = strtolower(trim((string)($_GET['status'] ?? '')));
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = 'WHERE 1=1';
        $bind = [];
        if ($q !== '') {
            $where .= ' AND (name LIKE :q OR phone LIKE :q OR email LIKE :q)';
            $bind['q'] = '%' . $q . '%';
        }
        if ($status !== '') {
            $allowed = ['pending', 'confirmed', 'cancelled'];
            if (!in_array($status, $allowed, true)) {
                throw new HttpException('Invalid status', 422);
            }
            $where .= ' AND status = :status';
            $bind['status'] = $status;
        }

        $pdo = Database::pdo();
        $countStmt = $pdo->prepare("SELECT COUNT(*) AS c FROM reservations {$where}");
        $countStmt->execute($bind);
        $total = (int)($countStmt->fetch()['c'] ?? 0);

        $stmt = $pdo->prepare("SELECT id, user_id, name, email, phone, reservation_date, reservation_time, guests, notes, status, created_at, updated_at FROM reservations {$where} ORDER BY id DESC LIMIT :limit OFFSET :offset");
        foreach ($bind as $k => $v) {
            $stmt->bindValue(':' . $k, $v);
        }
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();
        $items = array_map(static function (array $row): array {
            // aliases to match frontend UI fields
            $row['customer'] = $row['name'] ?? '';
            $row['date'] = $row['reservation_date'] ?? null;
            $row['time'] = $row['reservation_time'] ?? null;
            $row['createdAt'] = $row['created_at'] ?? null;
            return $row;
        }, $stmt->fetchAll());

        Response::success(
            ['items' => $items],
            'Success',
            [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int)ceil($total / $limit),
            ]
        );
    }

    /** Admin reservation detail */
    public static function adminShow(array $params = []): void
    {
        RoleMiddleware::requireAdmin();

        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, user_id, name, email, phone, reservation_date, reservation_time, guests, notes, status, created_at, updated_at FROM reservations WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $row['customer'] = $row['name'] ?? '';
        $row['date'] = $row['reservation_date'] ?? null;
        $row['time'] = $row['reservation_time'] ?? null;
        $row['createdAt'] = $row['created_at'] ?? null;

        Response::success($row, 'Success');
    }

    /** Admin update reservation (partial) */
    public static function adminUpdate(array $params = []): void
    {
        RoleMiddleware::requireAdmin();

        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $body = Request::jsonBody();
        [$fields, $bind] = self::buildReservationUpdateData($body);

        if ($fields === []) {
            throw new HttpException('No fields to update', 422);
        }

        $bind['id'] = $id;

        $pdo = Database::pdo();
        $exists = $pdo->prepare('SELECT id FROM reservations WHERE id = :id LIMIT 1');
        $exists->execute(['id' => $id]);
        if (!$exists->fetch()) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $sql = 'UPDATE reservations SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bind);

        $rowStmt = $pdo->prepare('SELECT id, user_id, name, email, phone, reservation_date, reservation_time, guests, notes, status, created_at, updated_at FROM reservations WHERE id = :id LIMIT 1');
        $rowStmt->execute(['id' => $id]);
        $row = $rowStmt->fetch();
        if (!$row) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $row['customer'] = $row['name'] ?? '';
        $row['date'] = $row['reservation_date'] ?? null;
        $row['time'] = $row['reservation_time'] ?? null;
        $row['createdAt'] = $row['created_at'] ?? null;

        Response::success($row, 'Success');
    }

    /**
     * @return array{0: array<int, string>, 1: array<string, mixed>}
     */
    private static function buildReservationUpdateData(array $body): array
    {
        $fields = [];
        $bind = [];

        self::appendReservationStatusUpdate($body, $fields, $bind);
        self::appendReservationNotesUpdate($body, $fields, $bind);
        self::appendReservationDateUpdate($body, $fields, $bind);
        self::appendReservationTimeUpdate($body, $fields, $bind);
        self::appendReservationGuestsUpdate($body, $fields, $bind);

        return [$fields, $bind];
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendReservationStatusUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('status', $body)) {
            return;
        }

        $status = strtolower(trim((string)$body['status']));
        $allowed = ['pending', 'confirmed', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            throw new HttpException('Invalid status', 422);
        }

        $fields[] = 'status = :status';
        $bind['status'] = $status;
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendReservationNotesUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('notes', $body)) {
            return;
        }

        $notes = $body['notes'];
        $fields[] = 'notes = :notes';
        $bind['notes'] = ($notes === null) ? null : (string)$notes;
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendReservationDateUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('date', $body) && !array_key_exists('reservation_date', $body)) {
            return;
        }

        $date = trim((string)($body['date'] ?? $body['reservation_date'] ?? ''));
        if ($date === '') {
            throw new HttpException('Invalid date', 422);
        }

        $fields[] = 'reservation_date = :reservation_date';
        $bind['reservation_date'] = $date;
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendReservationTimeUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('time', $body) && !array_key_exists('reservation_time', $body)) {
            return;
        }

        $time = trim((string)($body['time'] ?? $body['reservation_time'] ?? ''));
        if ($time === '') {
            throw new HttpException('Invalid time', 422);
        }

        $fields[] = 'reservation_time = :reservation_time';
        $bind['reservation_time'] = $time;
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendReservationGuestsUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('guests', $body)) {
            return;
        }

        $guests = (int)$body['guests'];
        if ($guests <= 0) {
            throw new HttpException('Invalid guests', 422);
        }

        $fields[] = 'guests = :guests';
        $bind['guests'] = $guests;
    }
}
