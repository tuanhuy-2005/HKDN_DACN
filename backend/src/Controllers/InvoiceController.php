<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;
use App\Utils\HttpException;
use App\Utils\Request;
use App\Utils\Response;

final class InvoiceController
{
    private static function uiStatusFromDb(string $status): string
    {
        $status = strtolower($status);
        if ($status === 'draft') {
            return 'pending';
        }
        return $status;
    }

    private static function dbStatusFromUi(string $status): string
    {
        $status = strtolower($status);
        if ($status === 'pending') {
            return 'draft';
        }
        return $status;
    }

    private static function dbPaymentMethodFromUi(?string $method): ?string
    {
        if ($method === null) {
            return null;
        }

        $m = strtolower(trim($method));
        if ($m === '') {
            return null;
        }

        if (in_array($m, ['cash', 'momo', 'banking'], true)) {
            return $m;
        }
        if (in_array($m, ['card', 'transfer', 'bank', 'bank_transfer'], true)) {
            return 'banking';
        }

        return null;
    }

    private static function uiPaymentMethodFromDb(?string $method): ?string
    {
        if ($method === null) {
            return null;
        }

        $m = strtolower($method);
        if ($m === 'banking') {
            return 'card';
        }
        return $m;
    }

    /** @param int[] $invoiceIds */
    private static function fetchItemsByInvoiceIds(array $invoiceIds): array
    {
        if ($invoiceIds === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($invoiceIds), '?'));
        $pdo = Database::pdo();
        $stmt = $pdo->prepare(
            'SELECT d.invoice_id, d.menu_item_id, m.name, d.quantity, d.unit_price, d.line_total
             FROM invoice_details d
             JOIN menu_items m ON m.id = d.menu_item_id
             WHERE d.invoice_id IN (' . $placeholders . ')
             ORDER BY d.invoice_id ASC, d.id ASC'
        );
        foreach ($invoiceIds as $i => $invoiceId) {
            $stmt->bindValue($i + 1, (int)$invoiceId, \PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $map = [];
        foreach ($rows as $row) {
            $invoiceId = (int)($row['invoice_id'] ?? 0);
            if (!isset($map[$invoiceId])) {
                $map[$invoiceId] = [];
            }

            $map[$invoiceId][] = [
                'menu_item_id' => (int)($row['menu_item_id'] ?? 0),
                'name' => (string)($row['name'] ?? ''),
                'quantity' => (int)($row['quantity'] ?? 0),
                'price' => (int)($row['unit_price'] ?? 0),
                'unit_price' => (int)($row['unit_price'] ?? 0),
                'line_total' => (int)($row['line_total'] ?? 0),
            ];
        }

        return $map;
    }

    /** Create invoice (auth required) */
    public static function create(array $params = []): void
    {
        unset($params);

        $claims = AuthMiddleware::requireAuth();
        $userId = (int)($claims['sub'] ?? 0);

        $body = Request::jsonBody();
        $items = $body['items'] ?? null; // [{menu_item_id, quantity}]
        $reservationId = (int)($body['reservation_id'] ?? 0);

        $paymentMethodRaw = $body['payment_method'] ?? ($body['paymentMethod'] ?? null);
        $paymentMethod = $paymentMethodRaw === null ? null : self::dbPaymentMethodFromUi((string)$paymentMethodRaw);
        if ($paymentMethodRaw !== null && $paymentMethod === null) {
            throw new HttpException('Invalid payment_method', 422);
        }

        $statusRaw = $body['status'] ?? null;
        $statusDb = 'draft';
        if ($statusRaw !== null) {
            $statusDb = self::dbStatusFromUi((string)$statusRaw);
        }
        $allowedStatuses = ['draft', 'paid', 'cancelled'];
        if (!in_array($statusDb, $allowedStatuses, true)) {
            throw new HttpException('Invalid status', 422);
        }

        if (!is_array($items) || count($items) === 0) {
            throw new HttpException('Missing items', 422);
        }

        $pdo = Database::pdo();
        $pdo->beginTransaction();

        try {
            $code = 'INV-' . date('Ymd-His') . '-' . random_int(1000, 9999);

            $stmt = $pdo->prepare('INSERT INTO invoices (user_id, reservation_id, code, status, payment_method, subtotal, total, created_at) VALUES (:uid, :rid, :code, :status, :payment_method, 0, 0, NOW())');
            $stmt->execute([
                'uid' => $userId,
                'rid' => ($reservationId > 0) ? $reservationId : null,
                'code' => $code,
                'status' => $statusDb,
                'payment_method' => $paymentMethod,
            ]);
            $invoiceId = (int)$pdo->lastInsertId();

            $subtotal = 0;
            $detailStmt = $pdo->prepare('INSERT INTO invoice_details (invoice_id, menu_item_id, quantity, unit_price, line_total) VALUES (:invoice_id, :menu_item_id, :quantity, :unit_price, :line_total)');
            $priceStmt = $pdo->prepare('SELECT price FROM menu_items WHERE id = :id LIMIT 1');

            foreach ($items as $item) {
                $menuItemId = (int)($item['menu_item_id'] ?? 0);
                $qty = (int)($item['quantity'] ?? 0);
                if ($menuItemId <= 0 || $qty <= 0) {
                    throw new HttpException('Invalid items', 422);
                }

                $priceStmt->execute(['id' => $menuItemId]);
                $row = $priceStmt->fetch();
                if (!$row) {
                    throw new HttpException('Menu item not found', 404);
                }

                $unit = (int)$row['price'];
                $line = $unit * $qty;
                $subtotal += $line;

                $detailStmt->execute([
                    'invoice_id' => $invoiceId,
                    'menu_item_id' => $menuItemId,
                    'quantity' => $qty,
                    'unit_price' => $unit,
                    'line_total' => $line,
                ]);
            }

            $total = $subtotal;
            $upd = $pdo->prepare('UPDATE invoices SET subtotal = :subtotal, total = :total WHERE id = :id');
            $upd->execute(['subtotal' => $subtotal, 'total' => $total, 'id' => $invoiceId]);

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        Response::success(
            [
                'id' => $invoiceId ?? null,
                'code' => $code ?? null,
                'status' => self::uiStatusFromDb($statusDb),
                'payment_method' => $paymentMethod,
                'paymentMethod' => self::uiPaymentMethodFromDb($paymentMethod),
            ],
            'Success',
            [],
            201
        );
    }

    /** User invoice history */
    public static function myList(array $params = []): void
    {
        unset($params);

        $claims = AuthMiddleware::requireAuth();
        $userId = (int)($claims['sub'] ?? 0);

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('SELECT id, code, status, payment_method, subtotal, total, created_at FROM invoices WHERE user_id = :uid ORDER BY id DESC');
        $stmt->execute(['uid' => $userId]);
        $items = $stmt->fetchAll();
        $invoiceIds = array_map(static fn (array $row): int => (int)($row['id'] ?? 0), $items);
        $itemsMap = self::fetchItemsByInvoiceIds($invoiceIds);

        $items = array_map(static function (array $row) use ($itemsMap): array {
            $row['status'] = self::uiStatusFromDb((string)($row['status'] ?? ''));
            $row['paymentMethod'] = self::uiPaymentMethodFromDb($row['payment_method'] ?? null);
            $row['items'] = $itemsMap[(int)($row['id'] ?? 0)] ?? [];
            $row['date'] = substr((string)($row['created_at'] ?? ''), 0, 10);
            $row['time'] = substr((string)($row['created_at'] ?? ''), 11, 5);
            $row['id_str'] = $row['code'] ?? null;
            return $row;
        }, $items);

        Response::success(['items' => $items], 'Success');
    }

    /** User invoice detail (by numeric id or invoice code) */
    public static function show(array $params = []): void
    {
        $claims = AuthMiddleware::requireAuth();
        $userId = (int)($claims['sub'] ?? 0);

        $idOrCode = trim((string)($params['id'] ?? ''));
        if ($idOrCode === '') {
            throw new HttpException('Not Found', 404);
        }

        $pdo = Database::pdo();
        $where = ctype_digit($idOrCode) ? 'i.id = :id' : 'i.code = :code';
        $bind = ctype_digit($idOrCode) ? ['id' => (int)$idOrCode] : ['code' => $idOrCode];

        $stmt = $pdo->prepare(
            "SELECT i.id, i.user_id, i.reservation_id, i.code, i.status, i.payment_method, i.subtotal, i.total, i.created_at, i.updated_at
             FROM invoices i
             WHERE {$where} AND i.user_id = :uid
             LIMIT 1"
        );
        $stmt->execute($bind + ['uid' => $userId]);
        $invoice = $stmt->fetch();
        if (!$invoice) {
            throw new HttpException('Not Found', 404);
        }

        $detailStmt = $pdo->prepare(
            'SELECT d.menu_item_id, m.name, d.quantity, d.unit_price, d.line_total FROM invoice_details d JOIN menu_items m ON m.id = d.menu_item_id WHERE d.invoice_id = :iid ORDER BY d.id ASC'
        );
        $detailStmt->execute(['iid' => (int)$invoice['id']]);
        $items = $detailStmt->fetchAll();

        $invoice['status'] = self::uiStatusFromDb((string)($invoice['status'] ?? ''));
        $invoice['paymentMethod'] = self::uiPaymentMethodFromDb($invoice['payment_method'] ?? null);
        $invoice['items'] = array_map(static function (array $r): array {
            return [
                'menu_item_id' => (int)($r['menu_item_id'] ?? 0),
                'name' => (string)($r['name'] ?? ''),
                'quantity' => (int)($r['quantity'] ?? 0),
                'price' => (int)($r['unit_price'] ?? 0),
                'unit_price' => (int)($r['unit_price'] ?? 0),
                'line_total' => (int)($r['line_total'] ?? 0),
            ];
        }, $items);

        // Aliases used by frontend mock
        $invoice['id_str'] = $invoice['code'];
        $invoice['date'] = substr((string)($invoice['created_at'] ?? ''), 0, 10);
        $invoice['time'] = substr((string)($invoice['created_at'] ?? ''), 11, 5);

        Response::success($invoice, 'Success');
    }

    /** Admin list invoices */
    public static function adminList(array $params = []): void
    {
        unset($params);

        RoleMiddleware::requireAdmin();

        $q = trim((string)($_GET['q'] ?? ''));
        $status = strtolower(trim((string)($_GET['status'] ?? '')));
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $pdo = Database::pdo();
        $where = 'WHERE 1=1';
        $bind = [];

        if ($q !== '') {
            $where .= ' AND (i.code LIKE :q OR u.name LIKE :q OR u.email LIKE :q OR u.phone LIKE :q)';
            $bind['q'] = '%' . $q . '%';
        }
        if ($status !== '') {
            $statusDb = self::dbStatusFromUi($status);
            if (!in_array($statusDb, ['draft', 'paid', 'cancelled'], true)) {
                throw new HttpException('Invalid status', 422);
            }
            $where .= ' AND i.status = :status';
            $bind['status'] = $statusDb;
        }

        $countStmt = $pdo->prepare("SELECT COUNT(*) AS c FROM invoices i LEFT JOIN users u ON u.id = i.user_id {$where}");
        $countStmt->execute($bind);
        $total = (int)($countStmt->fetch()['c'] ?? 0);

        $stmt = $pdo->prepare(
            "SELECT i.id, i.user_id, i.code, i.status, i.payment_method, i.subtotal, i.total, i.created_at,
                    u.name AS user_name, u.email AS user_email, u.phone AS user_phone
             FROM invoices i
             LEFT JOIN users u ON u.id = i.user_id
             {$where}
             ORDER BY i.id DESC
             LIMIT :limit OFFSET :offset"
        );
        foreach ($bind as $k => $v) {
            $stmt->bindValue(':' . $k, $v);
        }
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();
        $invoiceIds = array_map(static fn (array $row): int => (int)($row['id'] ?? 0), $items);
        $itemsMap = self::fetchItemsByInvoiceIds($invoiceIds);

        $items = array_map(static function (array $row) use ($itemsMap): array {
            $row['status'] = self::uiStatusFromDb((string)($row['status'] ?? ''));
            $row['paymentMethod'] = self::uiPaymentMethodFromDb($row['payment_method'] ?? null);
            $row['customer'] = $row['user_name'] ?? '';
            $row['date'] = substr((string)($row['created_at'] ?? ''), 0, 10);
            $row['time'] = substr((string)($row['created_at'] ?? ''), 11, 5);
            $row['id_str'] = $row['code'] ?? null;
            $row['items'] = $itemsMap[(int)($row['id'] ?? 0)] ?? [];
            return $row;
        }, $items);

        Response::success(['items' => $items], 'Success', [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'totalPages' => (int)ceil($total / $limit),
        ]);
    }

    /** Admin invoice detail (by numeric id or invoice code) */
    public static function adminShow(array $params = []): void
    {
        RoleMiddleware::requireAdmin();

        $idOrCode = trim((string)($params['id'] ?? ''));
        if ($idOrCode === '') {
            throw new HttpException('Not Found', 404);
        }

        $pdo = Database::pdo();
        $where = ctype_digit($idOrCode) ? 'i.id = :id' : 'i.code = :code';
        $bind = ctype_digit($idOrCode) ? ['id' => (int)$idOrCode] : ['code' => $idOrCode];

        $stmt = $pdo->prepare(
            "SELECT i.id, i.user_id, i.reservation_id, i.code, i.status, i.payment_method, i.subtotal, i.total, i.created_at, i.updated_at,
                    u.name AS user_name, u.email AS user_email, u.phone AS user_phone
             FROM invoices i
             LEFT JOIN users u ON u.id = i.user_id
             WHERE {$where}
             LIMIT 1"
        );
        $stmt->execute($bind);
        $invoice = $stmt->fetch();
        if (!$invoice) {
            throw new HttpException('Not Found', 404);
        }

        $detailStmt = $pdo->prepare(
            'SELECT d.menu_item_id, m.name, d.quantity, d.unit_price, d.line_total FROM invoice_details d JOIN menu_items m ON m.id = d.menu_item_id WHERE d.invoice_id = :iid ORDER BY d.id ASC'
        );
        $detailStmt->execute(['iid' => (int)$invoice['id']]);
        $items = $detailStmt->fetchAll();

        $invoice['status'] = self::uiStatusFromDb((string)($invoice['status'] ?? ''));
        $invoice['paymentMethod'] = self::uiPaymentMethodFromDb($invoice['payment_method'] ?? null);
        $invoice['customer'] = $invoice['user_name'] ?? '';
        $invoice['date'] = substr((string)($invoice['created_at'] ?? ''), 0, 10);
        $invoice['time'] = substr((string)($invoice['created_at'] ?? ''), 11, 5);
        $invoice['id_str'] = $invoice['code'];

        $invoice['items'] = array_map(static function (array $r): array {
            return [
                'menu_item_id' => (int)($r['menu_item_id'] ?? 0),
                'name' => (string)($r['name'] ?? ''),
                'quantity' => (int)($r['quantity'] ?? 0),
                'price' => (int)($r['unit_price'] ?? 0),
                'unit_price' => (int)($r['unit_price'] ?? 0),
                'line_total' => (int)($r['line_total'] ?? 0),
            ];
        }, $items);

        Response::success($invoice, 'Success');
    }

    /** Admin update invoice (status/payment_method) */
    public static function adminUpdate(array $params = []): void
    {
        RoleMiddleware::requireAdmin();

        $idOrCode = trim((string)($params['id'] ?? ''));
        if ($idOrCode === '') {
            throw new HttpException('Not Found', 404);
        }

        $body = Request::jsonBody();
        $fields = [];
        $bind = [];

        if (array_key_exists('status', $body)) {
            $statusDb = self::dbStatusFromUi((string)$body['status']);
            if (!in_array($statusDb, ['draft', 'paid', 'cancelled'], true)) {
                throw new HttpException('Invalid status', 422);
            }
            $fields[] = 'status = :status';
            $bind['status'] = $statusDb;
        }

        if (array_key_exists('payment_method', $body) || array_key_exists('paymentMethod', $body)) {
            $raw = $body['payment_method'] ?? ($body['paymentMethod'] ?? null);
            $method = $raw === null ? null : self::dbPaymentMethodFromUi((string)$raw);
            if ($raw !== null && $method === null) {
                throw new HttpException('Invalid payment_method', 422);
            }
            $fields[] = 'payment_method = :payment_method';
            $bind['payment_method'] = $method;
        }

        if ($fields === []) {
            throw new HttpException('No fields to update', 422);
        }

        $pdo = Database::pdo();
        $where = ctype_digit($idOrCode) ? 'id = :id' : 'code = :code';
        $keyBind = ctype_digit($idOrCode) ? ['id' => (int)$idOrCode] : ['code' => $idOrCode];

        $stmt = $pdo->prepare('UPDATE invoices SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE ' . $where);
        $stmt->execute($bind + $keyBind);
        if ($stmt->rowCount() === 0) {
            throw new HttpException('Not Found', 404);
        }

        // Return updated invoice summary
        $sel = $pdo->prepare('SELECT id, user_id, reservation_id, code, status, payment_method, subtotal, total, created_at, updated_at FROM invoices WHERE ' . $where . ' LIMIT 1');
        $sel->execute($keyBind);
        $invoice = $sel->fetch();
        if (!$invoice) {
            throw new HttpException('Not Found', 404);
        }

        $invoice['status'] = self::uiStatusFromDb((string)($invoice['status'] ?? ''));
        $invoice['paymentMethod'] = self::uiPaymentMethodFromDb($invoice['payment_method'] ?? null);
        $invoice['id_str'] = $invoice['code'];
        $invoice['date'] = substr((string)($invoice['created_at'] ?? ''), 0, 10);
        $invoice['time'] = substr((string)($invoice['created_at'] ?? ''), 11, 5);

        Response::success($invoice, 'Success');
    }
}

