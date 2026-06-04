<?php

declare(strict_types=1);

namespace App\Config;

use Dotenv\Dotenv;

final class Env
{
    public static function load(string $basePath): void
    {
        $envPath = rtrim($basePath, '/\\');
        if (file_exists($envPath . '/.env')) {
            Dotenv::createImmutable($envPath)->safeLoad();
        }
    }

    public static function getString(string $key, ?string $default = null): ?string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        if ($value === false || $value === null) {
            return $default;
        }
        return (string) $value;
    }

    public static function getBool(string $key, bool $default = false): bool
    {
        $value = self::getString($key);
        if ($value === null) {
            return $default;
        }
        return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    public static function getInt(string $key, int $default = 0): int
    {
        $value = self::getString($key);
        if ($value === null || !is_numeric($value)) {
            return $default;
        }
        return (int) $value;
    }
}

