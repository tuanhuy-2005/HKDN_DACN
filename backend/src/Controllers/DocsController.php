<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Utils\Request;
use App\Utils\Response;

final class DocsController
{
    /** Serve OpenAPI JSON for Swagger UI */
    public static function openapi(array $params = []): void
    {
        unset($params);

        /** @var array<string,mixed> $openapiSpec */
        $openapiSpec = [];
        require_once __DIR__ . '/../../resources/openapi.php';

        /** @var array<string,mixed> $spec */
        $spec = $openapiSpec;
        $spec['servers'] = [
            ['url' => Request::baseUrl()],
        ];

        Response::json($spec);
    }

    /** Serve Swagger UI */
    public static function ui(array $params = []): void
    {
        unset($params);

        header('Content-Type: text/html; charset=utf-8');

        echo '<!doctype html>';
        echo '<html lang="en">';
        echo '<head>';
        echo '<meta charset="utf-8" />';
        echo '<meta name="viewport" content="width=device-width, initial-scale=1" />';
        echo '<title>TuanHuy cafe API Docs</title>';
        echo '<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />';
        echo '</head>';
        echo '<body>';
        echo '<div id="swagger-ui"></div>';
        echo '<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>';
        echo '<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>';
        echo '<script>';
        echo 'window.onload = function() {';
        echo '  const ui = SwaggerUIBundle({';
        echo '    url: "/openapi.json",';
        echo '    dom_id: "#swagger-ui",';
        echo '    deepLinking: true,';
        echo '    presets: [';
        echo '      SwaggerUIBundle.presets.apis,';
        echo '      SwaggerUIStandalonePreset';
        echo '    ],';
        echo '    layout: "StandaloneLayout"';
        echo '  });';
        echo '  window.ui = ui;';
        echo '};';
        echo '</script>';
        echo '</body>';
        echo '</html>';
        exit;
    }
}
