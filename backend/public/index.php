<?php

declare(strict_types=1);

$autoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Missing dependencies. Run composer install in backend/.',
        'data' => (object)[],
        'meta' => (object)[],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

require_once $autoload;

use App\Config\Env;
use App\Routes\Router;
use App\Utils\HttpException;
use App\Utils\Request;
use App\Utils\Response;

Env::load(__DIR__ . '/../');

set_exception_handler(static function (Throwable $e): void {
    $status = $e instanceof HttpException ? $e->getStatusCode() : 500;
    $message = $e instanceof HttpException ? $e->getMessage() : 'Internal Server Error';

    Response::json([
        'success' => false,
        'message' => $message,
        'data' => (object)[],
        'meta' => (object)[],
    ], $status);
});

Request::applyCors();

$router = new Router();
require_once __DIR__ . '/../src/Routes/routes.php';

$router->dispatch(Request::method(), Request::path());
