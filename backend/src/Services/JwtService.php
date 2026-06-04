<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Env;
use App\Utils\HttpException;
use App\Utils\Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

final class JwtService
{
    /** @return array<string,mixed> */
    public static function requireAuth(): array
    {
        $token = Request::bearerToken();
        if (!$token) {
            throw new HttpException('Unauthorized', 401);
        }

        return self::verify($token);
    }

    public static function issue(int $userId, string $role): string
    {
        $secret = Env::getString('JWT_SECRET', '') ?? '';
        if (strlen($secret) < 16) {
            throw new HttpException('JWT secret not configured', 500);
        }

        $issuer = Env::getString('JWT_ISSUER', 'cafe-api') ?? 'cafe-api';
        $ttl = Env::getInt('JWT_TTL_SECONDS', 86400);
        $now = time();

        $payload = [
            'iss' => $issuer,
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttl,
            'sub' => $userId,
            'role' => $role,
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }

    /** @return array<string,mixed> */
    public static function verify(string $token): array
    {
        $secret = Env::getString('JWT_SECRET', '') ?? '';
        if (strlen($secret) < 16) {
            throw new HttpException('JWT secret not configured', 500);
        }

        try {
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
        } catch (\Throwable $e) {
            throw new HttpException('Unauthorized', 401);
        }

        return json_decode(json_encode($decoded), true);
    }
}
