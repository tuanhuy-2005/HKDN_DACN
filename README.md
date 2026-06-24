# TuanHuy Cafe Management System

Hệ thống quản lý quán cà phê full-stack dạng monorepo gồm hai phần:

- `backend/` — REST API PHP 8 thuần với PDO, JWT, tự routing không dùng framework.
- `frontend/` — Next.js 16 + TypeScript, giao diện khách hàng và trang quản trị admin.

Mục tiêu: khởi động nhanh bằng Docker, cung cấp đầy đủ API cho đặt bàn, quản lý menu, hóa đơn và người dùng.

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt nhanh (Docker)](#cài-đặt-nhanh-docker)
- [Biến môi trường](#biến-môi-trường)
- [Các lệnh thường dùng](#các-lệnh-thường-dùng)
- [API Endpoints](#api-endpoints)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Tài khoản demo](#tài-khoản-demo)
- [Triển khai production](#triển-khai-production)

## Tính năng chính

### Giao diện khách hàng

- Trang chủ giới thiệu quán, dịch vụ nổi bật và thông tin liên hệ.
- Duyệt menu theo danh mục với ảnh, giá và mô tả chi tiết.
- Đặt bàn trực tuyến, xem lại lịch sử đặt bàn của tài khoản.
- Xem hóa đơn chi tiết và lịch sử giao dịch cá nhân.
- Đăng ký, đăng nhập, cập nhật thông tin tài khoản.
- Giỏ hàng phía client, kết hợp tạo hóa đơn nhanh.

### Trang quản trị Admin

- Dashboard tổng quan: doanh thu, số đơn đặt bàn, số hóa đơn.
- Quản lý menu: thêm, sửa, xóa món, upload ảnh món ăn.
- Quản lý đặt bàn: xem danh sách, cập nhật trạng thái, ghi chú nội bộ.
- Quản lý hóa đơn: xem chi tiết, cập nhật trạng thái thanh toán.
- Quản lý người dùng: xem danh sách tài khoản, cập nhật vai trò.
- Cài đặt hệ thống cơ bản.

### Backend API

- REST API thuần PHP 8 không dùng framework, tự viết router và DI.
- Xác thực JWT cho mọi endpoint cần bảo vệ.
- Phân quyền theo vai trò: `customer` và `admin`.
- Upload ảnh món ăn lên thư mục `public/uploads/menu`.
- Tài liệu API tích hợp Swagger UI tại `/docs` và OpenAPI JSON tại `/openapi.json`.
- CORS có thể cấu hình qua biến môi trường.

## Công nghệ sử dụng

**Backend**

- PHP 8.x
- PDO với MariaDB/MySQL
- `firebase/php-jwt` để phát hành và xác minh JWT
- `vlucas/phpdotenv` để đọc biến môi trường
- Router và DI tự xây dựng, không dùng framework

**Frontend**

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui + Radix UI
- Framer Motion
- Recharts cho biểu đồ admin dashboard
- Zustand cho state management giỏ hàng
- React Hook Form + Zod cho validate form
- Lucide React

**Hạ tầng**

- Docker + Docker Compose
- MariaDB 11.4

## Yêu cầu hệ thống

- Docker Desktop (khuyến nghị)
- Hoặc chạy thủ công: Node.js 20 LTS, PHP 8.x, Composer, MariaDB/MySQL

## Cài đặt nhanh (Docker)

```bash
# 1. Clone repo
git clone <repo-url>
cd <repo-folder>

# 2. Tạo volume database (chỉ cần lần đầu)
docker volume create cafe-management_db-data

# 3. Build và khởi động toàn bộ stack
docker compose up --build -d
```

Sau khi các container healthy, truy cập:

| Dịch vụ      | URL                               |
|--------------|-----------------------------------|
| Frontend     | http://localhost:8088             |
| Backend API  | http://localhost:8000/api         |
| Swagger UI   | http://localhost:8000/docs        |
| OpenAPI JSON | http://localhost:8000/openapi.json |

## Biến môi trường

Tạo file `.env` trong thư mục `backend/` từ `.env.example`:

```bash
cp backend/.env.example backend/.env
```

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

# CORS — danh sách origin cho phép, cách nhau bằng dấu phẩy
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cafe_db
DB_USER=root
DB_PASS=
DB_CHARSET=utf8mb4

# JWT
JWT_SECRET=change_me_to_a_long_random_string
JWT_ISSUER=cafe-api
JWT_TTL_SECONDS=86400
```

> Khi dùng Docker Compose, các biến môi trường backend đã được khai báo sẵn trong `docker-compose.yml` và ghi đè file `.env`.

Frontend chỉ cần một biến duy nhất:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Khi chạy qua Docker Compose, biến này được truyền vào lúc build image thông qua `args` trong `docker-compose.yml`.

## Các lệnh thường dùng

**Docker**

```bash
# Khởi động toàn bộ stack (build nếu chưa có image)
docker compose up --build -d

# Rebuild và restart riêng backend
docker compose build backend && docker compose up -d backend

# Xem log realtime
docker compose logs -f

# Dừng tất cả container
docker compose down
```

**Helper scripts (chạy trong container backend)**

```bash
# Kiểm tra trạng thái đặt bàn
docker compose exec backend php tools/check_reservations.php

# Kiểm tra quyền admin
docker compose exec backend php tools/admin_check.php

# Kiểm tra quan hệ dữ liệu
docker compose exec backend php tools/check_relationships.php
```

**Xóa dữ liệu demo**

```bash
# Xem trước những gì sẽ bị xóa
docker compose exec backend php tools/purge_demo_data.php

# Thực sự xóa (không thể hoàn tác)
docker compose exec backend sh -c "export PURGE=1 && php tools/purge_demo_data.php"
```

> Luôn backup dữ liệu trước khi chạy lệnh xóa trong môi trường thực.

**Frontend (chạy thủ công, không dùng Docker)**

```bash
cd frontend
npm install
npm run dev      # Development server tại http://localhost:3000
npm run build    # Build production
npm run start    # Chạy bản production
npm run lint     # Kiểm tra lint
```

## API Endpoints

### Public

| Method | Endpoint       | Mô tả                      |
|--------|----------------|----------------------------|
| GET    | /api/health    | Kiểm tra trạng thái server |
| GET    | /docs          | Swagger UI                 |
| GET    | /openapi.json  | OpenAPI spec JSON          |
| GET    | /api/menu      | Danh sách món ăn           |
| GET    | /api/menu/{id} | Chi tiết một món           |

### Auth

| Method | Endpoint           | Mô tả                        |
|--------|--------------------|------------------------------|
| POST   | /api/auth/register | Đăng ký tài khoản mới        |
| POST   | /api/auth/login    | Đăng nhập, nhận JWT          |
| GET    | /api/auth/me       | Thông tin tài khoản hiện tại |
| PATCH  | /api/auth/me       | Cập nhật thông tin tài khoản |

### Customer (yêu cầu JWT)

| Method | Endpoint                | Mô tả                    |
|--------|-------------------------|--------------------------|
| POST   | /api/reservations       | Tạo đặt bàn mới          |
| GET    | /api/reservations/me    | Lịch sử đặt bàn của tôi  |
| POST   | /api/invoices           | Tạo hóa đơn              |
| GET    | /api/invoices/me        | Lịch sử hóa đơn của tôi  |
| GET    | /api/invoices/{id}      | Chi tiết một hóa đơn     |
| POST   | /api/uploads/menu-image | Upload ảnh món ăn        |

### Admin (yêu cầu JWT + vai trò admin)

| Method | Endpoint                     | Mô tả                       |
|--------|------------------------------|-----------------------------|
| GET    | /api/admin/summary           | Tổng quan dashboard         |
| GET    | /api/admin/menu              | Danh sách menu (admin view) |
| POST   | /api/admin/menu              | Thêm món ăn mới             |
| GET    | /api/admin/menu/{id}         | Chi tiết món (admin)        |
| PATCH  | /api/admin/menu/{id}         | Cập nhật món ăn             |
| DELETE | /api/admin/menu/{id}         | Xóa món ăn                  |
| GET    | /api/admin/reservations      | Danh sách đặt bàn           |
| GET    | /api/admin/reservations/{id} | Chi tiết đặt bàn            |
| PATCH  | /api/admin/reservations/{id} | Cập nhật trạng thái đặt bàn |
| GET    | /api/admin/invoices          | Danh sách hóa đơn           |
| GET    | /api/admin/invoices/{id}     | Chi tiết hóa đơn            |
| PATCH  | /api/admin/invoices/{id}     | Cập nhật trạng thái hóa đơn |
| GET    | /api/admin/users             | Danh sách người dùng        |
| GET    | /api/admin/users/{id}        | Chi tiết người dùng         |
| PATCH  | /api/admin/users/{id}        | Cập nhật vai trò/thông tin  |

## Cấu trúc thư mục

```
.
├── backend/
│   ├── public/
│   │   ├── index.php           # Entry point
│   │   ├── router.php          # Dev router PHP built-in server
│   │   └── uploads/
│   │       └── menu/           # Ảnh món ăn được upload
│   ├── resources/
│   │   └── openapi.php         # Định nghĩa OpenAPI spec
│   ├── src/
│   │   ├── Config/
│   │   │   ├── Database.php    # Kết nối PDO
│   │   │   └── Env.php         # Đọc biến môi trường
│   │   ├── Controllers/
│   │   │   ├── AdminController.php
│   │   │   ├── AuthController.php
│   │   │   ├── DocsController.php
│   │   │   ├── InvoiceController.php
│   │   │   ├── MenuController.php
│   │   │   ├── ReservationController.php
│   │   │   ├── UploadController.php
│   │   │   └── UserController.php
│   │   ├── Middleware/
│   │   │   ├── AuthMiddleware.php
│   │   │   └── RoleMiddleware.php
│   │   ├── Routes/
│   │   │   ├── Router.php
│   │   │   └── routes.php
│   │   ├── Services/
│   │   │   └── JwtService.php
│   │   └── Utils/
│   │       ├── HttpException.php
│   │       ├── Request.php
│   │       └── Response.php
│   ├── storage/
│   │   └── cafe_db.sqlite      # SQLite dùng khi test local không có MySQL
│   ├── tools/                  # Script trợ giúp debug và quản trị
│   ├── .env.example
│   ├── composer.json
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── account/
│   │   ├── admin/
│   │   │   ├── invoices/
│   │   │   ├── menu/
│   │   │   ├── reservations/
│   │   │   ├── settings/
│   │   │   └── users/
│   │   ├── cart/
│   │   ├── login/
│   │   ├── menu/
│   │   ├── register/
│   │   ├── reservation/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── admin-menu-client.tsx
│   │   ├── admin-sidebar.tsx
│   │   ├── footer.tsx
│   │   ├── navbar.tsx
│   │   └── theme-provider.tsx
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── api.ts              # Toàn bộ hàm gọi Backend API
│   │   ├── cart.ts             # Zustand store giỏ hàng
│   │   └── utils.ts
│   ├── public/                 # Assets tĩnh
│   ├── next.config.mjs
│   ├── package.json
│   └── Dockerfile
├── database/
│   ├── migrations/
│   └── schema/
│       ├── cafe_db.sql         # Schema MySQL/MariaDB
│       └── cafe_db.sqlite.sql  # Schema SQLite (dùng khi test local)
├── docker-compose.yml
└── README.md
```

## Tài khoản demo

Sau khi khởi động Docker và database được khởi tạo từ schema SQL:

| Vai trò | Email          | Mật khẩu      |
|---------|----------------|---------------|
| Admin   | admin@cafe.com | adminpassword |

> Nên đổi mật khẩu mặc định trước khi deploy production.

## Triển khai production

Checklist trước khi deploy:

- Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên mạnh, tối thiểu 64 ký tự.
- Đặt `APP_ENV=production` và `APP_DEBUG=false`.
- Dùng database production (MySQL/MariaDB hoặc PostgreSQL).
- Cấu hình `CORS_ORIGINS` chỉ bao gồm domain thật của frontend.
- Dùng dịch vụ lưu trữ ảnh bên ngoài (S3, Cloudinary) thay vì lưu vào container nếu deploy serverless.
- Đặt `NEXT_PUBLIC_API_URL` trỏ về domain backend thật.
- Chạy `npm run build` trước khi build Docker image frontend.
- Bật CDN/WAF như Cloudflare để chống DDoS ở tầng mạng.

## Ghi chú developer

- Nếu trang admin trống hoặc bị redirect về login, kiểm tra token trong `localStorage` và đăng nhập lại.
- Khi thay đổi code backend, cần rebuild image: `docker compose build backend && docker compose up -d backend`.
- Frontend cần `NEXT_PUBLIC_API_URL=http://localhost:8000/api` khi chạy local không dùng Docker.
- Schema SQL khởi tạo database nằm tại `database/schema/cafe_db.sql`, được mount tự động vào MariaDB khi `docker compose up` lần đầu.
- File `database/schema/cafe_db.sqlite.sql` dành cho khi test local với SQLite mà không cần Docker.
- Không commit file `.env` vào git.
