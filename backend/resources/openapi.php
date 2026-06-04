<?php

declare(strict_types=1);

$openapiSpec = [
    'openapi' => '3.0.3',
    'info' => [
        'title' => 'TuanHuy cafe API',
        'version' => '1.0.0',
        'description' => 'TuanHuy cafe management API for frontend and admin dashboard',
    ],
    'paths' => [
        '/api/health' => [
            'get' => [
                'responses' => [
                    '200' => ['description' => 'OK'],
                ],
            ],
        ],
        '/api/auth/register' => [
            'post' => ['responses' => ['201' => ['description' => 'Created']]],
        ],
        '/api/auth/login' => [
            'post' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/auth/me' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/menu' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/menu/{id}' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/uploads/menu-image' => [
            'post' => ['responses' => ['201' => ['description' => 'Created']]],
        ],
        '/api/reservations' => [
            'post' => ['responses' => ['201' => ['description' => 'Created']]],
        ],
        '/api/reservations/me' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/invoices' => [
            'post' => ['responses' => ['201' => ['description' => 'Created']]],
        ],
        '/api/invoices/me' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/invoices/{id}' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/admin/menu' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
            'post' => ['responses' => ['201' => ['description' => 'Created']]],
        ],
        '/api/admin/menu/{id}' => [
            'patch' => ['responses' => ['200' => ['description' => 'OK']]],
            'delete' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/admin/reservations' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/admin/reservations/{id}' => [
            'patch' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/admin/invoices' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/admin/invoices/{id}' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
            'patch' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/admin/users' => [
            'get' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
        '/api/admin/users/{id}' => [
            'patch' => ['responses' => ['200' => ['description' => 'OK']]],
        ],
    ],
];
