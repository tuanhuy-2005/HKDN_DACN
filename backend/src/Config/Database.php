<?php

declare(strict_types=1);

namespace App\Config;

use PDO;

final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $connection = Env::getString('DB_CONNECTION', 'sqlite');

        if ($connection === 'sqlite') {
            $dbPath = Env::getString('DB_DATABASE', __DIR__ . '/../../storage/cafe_db.sqlite');
            $dir = dirname($dbPath);
            if (!is_dir($dir)) {
                mkdir($dir, 0777, true);
            }

            $dsn = "sqlite:{$dbPath}";
            $pdo = new PDO($dsn, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);

            // Register SQLite custom functions
            $pdo->sqliteCreateFunction('NOW', function() {
                return date('Y-m-d H:i:s');
            });

            // Enable foreign key constraints in SQLite
            $pdo->exec('PRAGMA foreign_keys = ON;');

            // Automatically run migrations if tables don't exist
            self::initializeSqliteTables($pdo);

            self::$pdo = $pdo;
            return self::$pdo;
        }

        $host = Env::getString('DB_HOST', '127.0.0.1');
        $port = Env::getInt('DB_PORT', 3306);
        $db = Env::getString('DB_NAME', 'cafe_db');
        $user = Env::getString('DB_USER', 'root');
        $pass = Env::getString('DB_PASS', '');
        $charset = Env::getString('DB_CHARSET', 'utf8mb4');

        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";

        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        self::$pdo = $pdo;
        return self::$pdo;
    }

    private static function initializeSqliteTables(PDO $pdo): void
    {
        $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        $exists = $stmt->fetch();

        if (!$exists) {
            $schemaFile = realpath(__DIR__ . '/../../../database/schema/cafe_db.sqlite.sql');
            if ($schemaFile && file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                $pdo->exec($sql);
            }

            // Seed default admin user only when explicitly enabled (DEV_ENABLE_SEED=true)
            if (\App\Config\Env::getBool('DEV_ENABLE_SEED', false)) {
                $adminHash = password_hash('adminpassword', PASSWORD_BCRYPT);
                $seedStmt = $pdo->prepare('INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, created_at) VALUES (1, "Admin", "admin@cafe.com", "0999999999", :hash, "admin", NOW())');
                $seedStmt->execute(['hash' => $adminHash]);
            }
        }
    }
}

