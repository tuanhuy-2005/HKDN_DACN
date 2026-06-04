<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Utils\HttpException;

final class RoleMiddleware
{
    /** @param string[] $roles
     *  @return array<string,mixed>
     */
    public static function requireAny(array $roles): array
    {
        $claims = AuthMiddleware::requireAuth();
        $role = (string)($claims['role'] ?? '');

        if (!in_array($role, $roles, true)) {
            throw new HttpException('Forbidden', 403);
        }

        return $claims;
    }

    /** @return array<string,mixed> */
    public static function requireAdmin(): array
    {
        return self::requireAny(['admin']);
    }
}
