<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\RoleMiddleware;
use App\Utils\HttpException;
use App\Utils\Request;
use App\Utils\Response;

final class MenuController
{
    private const NOT_FOUND = 'Not Found';

    /** Public list: supports pagination + search */
    public static function index(array $params = []): void
    {
        unset($params);

        $pdo = Database::pdo();

        $q = trim((string)($_GET['q'] ?? ''));
        $category = trim((string)($_GET['category'] ?? ''));
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;

        $where = 'WHERE is_active = 1';
        $bind = [];
        if ($q !== '') {
            $where .= ' AND (name LIKE :q OR description LIKE :q)';
            $bind['q'] = '%' . $q . '%';
        }
        if ($category !== '') {
            $where .= ' AND category = :category';
            $bind['category'] = $category;
        }

        $countStmt = $pdo->prepare("SELECT COUNT(*) AS c FROM menu_items {$where}");
        $countStmt->execute($bind);
        $total = (int)($countStmt->fetch()['c'] ?? 0);

        $stmt = $pdo->prepare("SELECT id, name, price, category, description, image_url FROM menu_items {$where} ORDER BY id DESC LIMIT :limit OFFSET :offset");
        foreach ($bind as $k => $v) {
            $stmt->bindValue(':' . $k, $v);
        }
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();
        $items = array_map(static function (array $row): array {
            $row['image'] = $row['image_url'] ?? null;
            $row['status'] = 'active';
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

    /** Public detail (active items only) */
    public static function show(array $params = []): void
    {
        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, name, price, category, description, image_url FROM menu_items WHERE id = :id AND is_active = 1 LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $row['image'] = $row['image_url'] ?? null;
        $row['status'] = 'active';
        Response::success($row, 'Success');
    }

    /** Admin create */
    public static function create(array $params = []): void
    {
        unset($params);

        RoleMiddleware::requireAdmin();

        $body = Request::jsonBody();
        $name = trim((string)($body['name'] ?? ''));
        $price = (int)($body['price'] ?? 0);
        $category = trim((string)($body['category'] ?? ''));
        $descriptionRaw = $body['description'] ?? null;
        $description = $descriptionRaw === null ? null : (string)$descriptionRaw;

        $imageUrlRaw = $body['image_url'] ?? ($body['image'] ?? null);
        $imageUrl = $imageUrlRaw === null ? null : (string)$imageUrlRaw;

        $isActiveRaw = $body['is_active'] ?? null;
        $statusRaw = $body['status'] ?? null;
        $isActive = 1;
        if (is_bool($isActiveRaw)) {
            $isActive = $isActiveRaw ? 1 : 0;
        } elseif (is_numeric($isActiveRaw)) {
            $isActive = ((int)$isActiveRaw) === 1 ? 1 : 0;
        } elseif (is_string($statusRaw) && $statusRaw !== '') {
            $isActive = strtolower($statusRaw) === 'inactive' ? 0 : 1;
        }

        if ($name === '' || $price <= 0 || $category === '') {
            throw new HttpException('Missing required fields', 422);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('INSERT INTO menu_items (name, price, category, description, image_url, is_active, created_at) VALUES (:name, :price, :category, :description, :image_url, :is_active, NOW())');
        $stmt->execute([
            'name' => $name,
            'price' => $price,
            'category' => $category,
            'description' => $description,
            'image_url' => $imageUrl,
            'is_active' => $isActive,
        ]);

        $id = (int)$pdo->lastInsertId();
        Response::success(
            [
                'id' => $id,
                'name' => $name,
                'price' => $price,
                'category' => $category,
                'description' => $description,
                'image_url' => $imageUrl,
                'image' => $imageUrl,
                'is_active' => $isActive,
                'status' => $isActive === 1 ? 'active' : 'inactive',
            ],
            'Success',
            [],
            201
        );
    }

    /** Admin detail */
    public static function adminShow(array $params = []): void
    {
        RoleMiddleware::requireAdmin();

        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, name, price, category, description, image_url, is_active, created_at, updated_at FROM menu_items WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $row['image'] = $row['image_url'] ?? null;
        $row['status'] = ((int)($row['is_active'] ?? 0)) === 1 ? 'active' : 'inactive';

        Response::success($row, 'Success');
    }

    /** Admin list: includes inactive items */
    public static function adminList(array $params = []): void
    {
        unset($params);

        RoleMiddleware::requireAdmin();

        $q = trim((string)($_GET['q'] ?? ''));
        $category = trim((string)($_GET['category'] ?? ''));
        $status = strtolower(trim((string)($_GET['status'] ?? '')));
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = 'WHERE 1=1';
        $bind = [];

        if ($q !== '') {
            $where .= ' AND (name LIKE :q OR description LIKE :q)';
            $bind['q'] = '%' . $q . '%';
        }
        if ($category !== '') {
            $where .= ' AND category = :category';
            $bind['category'] = $category;
        }
        if ($status === 'active') {
            $where .= ' AND is_active = 1';
        } elseif ($status === 'inactive') {
            $where .= ' AND is_active = 0';
        }

        $pdo = Database::pdo();
        $countStmt = $pdo->prepare("SELECT COUNT(*) AS c FROM menu_items {$where}");
        $countStmt->execute($bind);
        $total = (int)($countStmt->fetch()['c'] ?? 0);

        $stmt = $pdo->prepare("SELECT id, name, price, category, description, image_url, is_active, created_at, updated_at FROM menu_items {$where} ORDER BY id DESC LIMIT :limit OFFSET :offset");
        foreach ($bind as $k => $v) {
            $stmt->bindValue(':' . $k, $v);
        }
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();

        $items = array_map(static function (array $row): array {
            $row['image'] = $row['image_url'] ?? null;
            $row['status'] = ((int)($row['is_active'] ?? 0)) === 1 ? 'active' : 'inactive';
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

    /** Admin update (partial) */
    public static function adminUpdate(array $params = []): void
    {
        RoleMiddleware::requireAdmin();

        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $body = Request::jsonBody();
        [$fields, $bind] = self::buildMenuUpdateData($body);

        if ($fields === []) {
            throw new HttpException('No fields to update', 422);
        }

        $bind['id'] = $id;

        $pdo = Database::pdo();

        $exists = $pdo->prepare('SELECT id FROM menu_items WHERE id = :id LIMIT 1');
        $exists->execute(['id' => $id]);
        if (!$exists->fetch()) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $sql = 'UPDATE menu_items SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($bind);

        $rowStmt = $pdo->prepare('SELECT id, name, price, category, description, image_url, is_active, created_at, updated_at FROM menu_items WHERE id = :id LIMIT 1');
        $rowStmt->execute(['id' => $id]);
        $row = $rowStmt->fetch();

        $row['image'] = $row['image_url'] ?? null;
        $row['status'] = ((int)($row['is_active'] ?? 0)) === 1 ? 'active' : 'inactive';

        Response::success($row, 'Success');
    }

    /**
     * @return array{0: array<int, string>, 1: array<string, mixed>}
     */
    private static function buildMenuUpdateData(array $body): array
    {
        $fields = [];
        $bind = [];

        self::appendMenuNameUpdate($body, $fields, $bind);
        self::appendMenuPriceUpdate($body, $fields, $bind);
        self::appendMenuCategoryUpdate($body, $fields, $bind);
        self::appendMenuDescriptionUpdate($body, $fields, $bind);
        self::appendMenuImageUpdate($body, $fields, $bind);
        self::appendMenuStatusUpdate($body, $fields, $bind);

        return [$fields, $bind];
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendMenuNameUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('name', $body)) {
            return;
        }

        $name = trim((string)$body['name']);
        if ($name === '') {
            throw new HttpException('Invalid name', 422);
        }

        $fields[] = 'name = :name';
        $bind['name'] = $name;
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendMenuPriceUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('price', $body)) {
            return;
        }

        $price = (int)$body['price'];
        if ($price <= 0) {
            throw new HttpException('Invalid price', 422);
        }

        $fields[] = 'price = :price';
        $bind['price'] = $price;
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendMenuCategoryUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('category', $body)) {
            return;
        }

        $category = trim((string)$body['category']);
        if ($category === '') {
            throw new HttpException('Invalid category', 422);
        }

        $fields[] = 'category = :category';
        $bind['category'] = $category;
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendMenuDescriptionUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('description', $body)) {
            return;
        }

        $description = $body['description'];
        $fields[] = 'description = :description';
        $bind['description'] = ($description === null) ? null : (string)$description;
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendMenuImageUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('image_url', $body) && !array_key_exists('image', $body)) {
            return;
        }

        $imageUrl = $body['image_url'] ?? $body['image'] ?? null;
        $fields[] = 'image_url = :image_url';
        $bind['image_url'] = ($imageUrl === null) ? null : (string)$imageUrl;
    }

    /** @param array<int, string> $fields @param array<string, mixed> $bind */
    private static function appendMenuStatusUpdate(array $body, array &$fields, array &$bind): void
    {
        if (!array_key_exists('is_active', $body) && !array_key_exists('status', $body)) {
            return;
        }

        $isActive = $body['is_active'] ?? null;
        $status = $body['status'] ?? null;

        $activeInt = null;
        if (is_bool($isActive)) {
            $activeInt = $isActive ? 1 : 0;
        } elseif (is_numeric($isActive)) {
            $activeInt = ((int)$isActive) === 1 ? 1 : 0;
        } elseif (is_string($status)) {
            $activeInt = strtolower($status) === 'inactive' ? 0 : 1;
        }

        if ($activeInt === null) {
            throw new HttpException('Invalid is_active', 422);
        }

        $fields[] = 'is_active = :is_active';
        $bind['is_active'] = $activeInt;
    }

    /** Admin delete: soft delete via is_active=0 */
    public static function adminDelete(array $params = []): void
    {
        RoleMiddleware::requireAdmin();

        $id = (int)($params['id'] ?? 0);
        if ($id <= 0) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('UPDATE menu_items SET is_active = 0, updated_at = NOW() WHERE id = :id');
        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() === 0) {
            throw new HttpException(self::NOT_FOUND, 404);
        }

        Response::success((object)[], 'Success');
    }
}
