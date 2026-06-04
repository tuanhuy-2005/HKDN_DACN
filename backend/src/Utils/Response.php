<?php

declare(strict_types=1);

namespace App\Utils;

final class Response
{
    /** @param array<string,mixed> $payload */
    public static function json(array $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /** @param mixed $data */
    public static function success($data = null, string $message = 'Success', array $meta = [], int $status = 200): void
    {
        if ($data === null) {
            $data = (object)[];
        }
        if ($meta === []) {
            $meta = (object)[];
        }

        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'meta' => $meta,
        ], $status);
    }

    public static function error(string $message, int $status = 400, $data = null, array $meta = []): void
    {
        if ($data === null) {
            $data = (object)[];
        }
        if ($meta === []) {
            $meta = (object)[];
        }

        self::json([
            'success' => false,
            'message' => $message,
            'data' => $data,
            'meta' => $meta,
        ], $status);
    }
}
