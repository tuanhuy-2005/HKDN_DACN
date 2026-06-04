<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Services\JwtService;

final class AuthMiddleware
{
    /** @return array<string,mixed> */
    public static function requireAuth(): array
    {
        return JwtService::requireAuth();
    }
}
