<?php

declare(strict_types=1);

namespace App\Routes;

use App\Utils\HttpException;

final class Router
{
    /** @var array<int,array{method:string,pattern:string,regex:string,keys:array<int,string>,handler:callable}> */
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->add('PUT', $pattern, $handler);
    }

    public function patch(string $pattern, callable $handler): void
    {
        $this->add('PATCH', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->add('DELETE', $pattern, $handler);
    }

    private function add(string $method, string $pattern, callable $handler): void
    {
        $pattern = rtrim($pattern, '/') ?: '/';

        $keys = [];
        $regex = preg_replace_callback('/\{([a-zA-Z_]\w*)\}/', static function (array $m) use (&$keys): string {
            $keys[] = $m[1];
            return '([^/]+)';
        }, $pattern);

        $regex = '#^' . $regex . '$#';

        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'regex' => $regex,
            'keys' => $keys,
            'handler' => $handler,
        ];
    }

    public function dispatch(string $method, string $path): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== strtoupper($method)) {
                continue;
            }

            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }

            array_shift($matches);
            $params = [];
            foreach ($route['keys'] as $i => $key) {
                $params[$key] = $matches[$i] ?? null;
            }

            ($route['handler'])($params);
            return;
        }

        throw new HttpException('Not Found', 404);
    }
}
