<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\RoleMiddleware;
use App\Utils\Response;

final class AdminController
{
    public static function summary(array $params = []): void
    {
        unset($params);

        RoleMiddleware::requireAdmin();

        $pdo = Database::pdo();

        $counts = [
            'users' => (int)($pdo->query('SELECT COUNT(*) AS c FROM users')->fetch()['c'] ?? 0),
            'menuItems' => (int)($pdo->query('SELECT COUNT(*) AS c FROM menu_items')->fetch()['c'] ?? 0),
            'reservations' => (int)($pdo->query('SELECT COUNT(*) AS c FROM reservations')->fetch()['c'] ?? 0),
            'pendingReservations' => (int)($pdo->query("SELECT COUNT(*) AS c FROM reservations WHERE status = 'pending'")->fetch()['c'] ?? 0),
            'invoices' => (int)($pdo->query('SELECT COUNT(*) AS c FROM invoices')->fetch()['c'] ?? 0),
            'paidInvoices' => (int)($pdo->query("SELECT COUNT(*) AS c FROM invoices WHERE status = 'paid'")->fetch()['c'] ?? 0),
        ];

        $revenueRow = $pdo->query("SELECT COALESCE(SUM(total), 0) AS revenue FROM invoices WHERE status = 'paid'")->fetch();
        $revenue = (int)($revenueRow['revenue'] ?? 0);

        $recentInvoicesStmt = $pdo->query(
            "SELECT i.id, i.code, i.status, i.total, i.created_at, u.name AS customer
             FROM invoices i
             LEFT JOIN users u ON u.id = i.user_id
             ORDER BY i.id DESC
             LIMIT 5"
        );
        $recentInvoices = array_map(static function (array $row): array {
            $row['customer'] = (string)($row['customer'] ?? '');
            $row['date'] = substr((string)($row['created_at'] ?? ''), 0, 10);
            $row['time'] = substr((string)($row['created_at'] ?? ''), 11, 5);
            return $row;
        }, $recentInvoicesStmt->fetchAll());

        $recentReservationsStmt = $pdo->query(
            "SELECT id, name AS customer, reservation_date AS date, reservation_time AS time, guests, status, created_at
             FROM reservations
             ORDER BY id DESC
             LIMIT 5"
        );
        $recentReservations = array_map(static function (array $row): array {
            $row['customer'] = (string)($row['customer'] ?? '');
            return $row;
        }, $recentReservationsStmt->fetchAll());

        Response::success([
            'counts' => $counts,
            'revenue' => $revenue,
            'recentInvoices' => $recentInvoices,
            'recentReservations' => $recentReservations,
        ], 'Success');
    }
}
