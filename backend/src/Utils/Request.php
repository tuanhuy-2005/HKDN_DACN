<?php

declare(strict_types=1);

namespace App\Utils;

use App\Config\Env;

final class Request
{
    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);
        if (!is_string($path)) {
            return '/';
        }
        return rtrim($path, '/') ?: '/';
    }

    /** Base URL inferred from the current request (scheme + host + optional port). */
    public static function baseUrl(): string
    {
        $proto = (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '');
        if ($proto !== '') {
            $proto = trim(explode(',', $proto)[0]);
        }
        if ($proto === '') {
            $https = (string)($_SERVER['HTTPS'] ?? '');
            $proto = ($https !== '' && strtolower($https) !== 'off') ? 'https' : 'http';
        }

        $host = (string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? ($_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '')));
        if ($host !== '') {
            $host = trim(explode(',', $host)[0]);
        }
        if ($host === '') {
            $host = '127.0.0.1';
        }

        // If we don't have a Host header, append port when non-standard.
        if (!isset($_SERVER['HTTP_HOST'])) {
            $portRaw = (string)($_SERVER['HTTP_X_FORWARDED_PORT'] ?? ($_SERVER['SERVER_PORT'] ?? ''));
            $port = (int)$portRaw;
            $isStandard = ($proto === 'https' && $port === 443) || ($proto === 'http' && $port === 80) || $port === 0;
            if (!$isStandard && !preg_match('/:\d+$/', $host) && !preg_match('/\]:\d+$/', $host)) {
                $host .= ':' . $port;
            }
        }

        return $proto . '://' . $host;
    }

    /** @return array<string,string> */
    public static function headers(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
                $headers[$name] = (string) $value;
            }
        }

        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['Content-Type'] = (string) $_SERVER['CONTENT_TYPE'];
        }
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers['Authorization'] = (string) $_SERVER['HTTP_AUTHORIZATION'];
        }
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && !isset($headers['Authorization'])) {
            $headers['Authorization'] = (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        return $headers;
    }

    public static function bearerToken(): ?string
    {
        $auth = self::headers()['Authorization'] ?? null;
        if (!$auth) {
            return null;
        }
        if (preg_match('/^Bearer\s+(.*)$/i', $auth, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    /** @return array<string,mixed> */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (!is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new HttpException('Invalid JSON body', 400);
        }
        return $decoded;
    }

    public static function applyCors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = array_filter(array_map('trim', explode(',', Env::getString('CORS_ORIGINS', '') ?? '')));

        if ($origin && (in_array($origin, $allowed, true))) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        if (self::method() === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
