<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Env;
use App\Middleware\RoleMiddleware;
use App\Utils\HttpException;
use App\Utils\Request;
use App\Utils\Response;

final class UploadController
{
    /**
     * Upload menu image.
     *
     * - In APP_ENV=local, auth is optional for convenience.
     * - In non-local env, requires admin.
     */
    public static function uploadMenuImage(array $params = []): void
    {
        unset($params);

        self::requireAdminIfNeeded();

        $file = self::getUploadedFile('image');
        $tmpName = self::validateUploadedFile($file);
        $ext = self::detectImageExtension($tmpName);

        $name = bin2hex(random_bytes(16)) . '.' . $ext;
        $targetPath = self::ensureTargetPath($name);

        if (!move_uploaded_file($tmpName, $targetPath)) {
            throw new HttpException('Failed to save file', 500);
        }

        Response::success(['image_url' => self::publicUrl('/uploads/menu/' . $name)], 'Success', [], 201);
    }

    private static function requireAdminIfNeeded(): void
    {
        $isLocal = (Env::getString('APP_ENV', 'local') ?? 'local') === 'local';

        if (!$isLocal) {
            RoleMiddleware::requireAdmin();
            return;
        }

        try {
            RoleMiddleware::requireAdmin();
        } catch (\Throwable $e) {
            // local mode: allow
        }
    }

    /** @return array<string,mixed> */
    private static function getUploadedFile(string $key): array
    {
        if (!isset($_FILES[$key])) {
            throw new HttpException('Missing file: ' . $key, 422);
        }

        $file = $_FILES[$key];
        if (!is_array($file)) {
            throw new HttpException('Upload failed', 422);
        }

        return $file;
    }

    /** @param array<string,mixed> $file */
    private static function validateUploadedFile(array $file): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new HttpException('Upload failed', 422);
        }

        $size = (int)($file['size'] ?? 0);
        if ($size <= 0 || $size > 2 * 1024 * 1024) {
            throw new HttpException('File too large (max 2MB)', 422);
        }

        $tmpName = (string)($file['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            throw new HttpException('Invalid upload', 422);
        }

        return $tmpName;
    }

    private static function detectImageExtension(string $tmpName): string
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmpName) ?: '';

        $allowed = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($allowed[$mime])) {
            throw new HttpException('Unsupported image type', 422);
        }

        return $allowed[$mime];
    }

    private static function ensureTargetPath(string $filename): string
    {
        $publicDir = realpath(__DIR__ . '/../../public');
        if (!is_string($publicDir) || $publicDir === '') {
            throw new HttpException('Upload directory not available', 500);
        }

        $targetDir = $publicDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'menu';
        if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
            throw new HttpException('Cannot create upload directory', 500);
        }

        return $targetDir . DIRECTORY_SEPARATOR . $filename;
    }

    private static function publicUrl(string $path): string
    {
        return rtrim(Request::baseUrl(), '/') . $path;
    }
}
