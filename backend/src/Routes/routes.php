<?php

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\AdminController;
use App\Controllers\DocsController;
use App\Controllers\InvoiceController;
use App\Controllers\MenuController;
use App\Controllers\ReservationController;
use App\Controllers\UploadController;
use App\Controllers\UserController;
use App\Utils\Response;

const ADMIN_MENU_ITEM_ROUTE = '/api/admin/menu/{id}';

$router->get('/api/health', static function (array $params = []): void {
    unset($params);
    Response::success(['status' => 'ok'], 'Success');
});

// Docs
$router->get('/docs', [DocsController::class, 'ui']);
$router->get('/openapi.json', [DocsController::class, 'openapi']);

$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->get('/api/auth/me', [AuthController::class, 'me']);
$router->patch('/api/auth/me', [AuthController::class, 'updateMe']);

// Uploads
$router->post('/api/uploads/menu-image', [UploadController::class, 'uploadMenuImage']);

// Customer
$router->get('/api/menu', [MenuController::class, 'index']);
$router->get('/api/menu/{id}', [MenuController::class, 'show']);
$router->post('/api/reservations', [ReservationController::class, 'create']);
$router->get('/api/reservations/me', [ReservationController::class, 'myList']);
$router->post('/api/invoices', [InvoiceController::class, 'create']);
$router->get('/api/invoices/me', [InvoiceController::class, 'myList']);
$router->get('/api/invoices/{id}', [InvoiceController::class, 'show']);

// Admin
$router->get('/api/admin/summary', [AdminController::class, 'summary']);
$router->post('/api/admin/menu', [MenuController::class, 'create']);
$router->get('/api/admin/menu', [MenuController::class, 'adminList']);
$router->get(ADMIN_MENU_ITEM_ROUTE, [MenuController::class, 'adminShow']);
$router->patch(ADMIN_MENU_ITEM_ROUTE, [MenuController::class, 'adminUpdate']);
$router->delete(ADMIN_MENU_ITEM_ROUTE, [MenuController::class, 'adminDelete']);
$router->get('/api/admin/reservations', [ReservationController::class, 'adminList']);
$router->get('/api/admin/reservations/{id}', [ReservationController::class, 'adminShow']);
$router->patch('/api/admin/reservations/{id}', [ReservationController::class, 'adminUpdate']);
$router->get('/api/admin/invoices', [InvoiceController::class, 'adminList']);
$router->get('/api/admin/invoices/{id}', [InvoiceController::class, 'adminShow']);
$router->patch('/api/admin/invoices/{id}', [InvoiceController::class, 'adminUpdate']);
$router->get('/api/admin/users', [UserController::class, 'adminList']);
$router->get('/api/admin/users/{id}', [UserController::class, 'adminShow']);
$router->patch('/api/admin/users/{id}', [UserController::class, 'adminUpdate']);
