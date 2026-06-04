<?php
declare(strict_types=1);

function http_post(string $url, array $data, array $headers = []): array {
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => array_merge(['Content-Type: application/json'], $headers),
            'content' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'ignore_errors' => true,
        ],
    ];
    $ctx = stream_context_create($opts);
    $res = file_get_contents($url, false, $ctx);
    return ['status' => $res === false ? 0 : 200, 'body' => $res];
}

function http_get(string $url, array $headers = []): array {
    $hdrs = array_map(fn($h) => $h, $headers);
    $opts = ['http' => ['method' => 'GET', 'header' => $hdrs, 'ignore_errors' => true]];
    $res = file_get_contents($url, false, stream_context_create($opts));
    return ['body' => $res];
}

$base = 'http://127.0.0.1:8000/api';
$login = http_post($base . '/auth/login', ['email' => 'admin@cafe.com', 'password' => 'adminpassword']);
if (!$login['body']) {
    echo "Login failed (no response)\n";
    exit(1);
}
$json = json_decode($login['body'], true);
if (!$json || !isset($json['data']['token'])) {
    echo "Login failed: " . ($login['body'] ?? 'no body') . "\n";
    exit(1);
}
$token = $json['data']['token'];
echo "TOKEN: ".$token."\n";

$res = http_get($base . '/admin/reservations', ["Authorization: Bearer {$token}"]);
echo "ADMIN /admin/reservations response:\n";
echo ($res['body'] ?? '(no body)') . "\n";
