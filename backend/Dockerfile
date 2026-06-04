FROM php:8.2-alpine

# Install system dependencies
RUN apk add --no-cache \
    unzip \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libwebp-dev \
    sqlite-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install gd pdo pdo_mysql pdo_sqlite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy Composer files
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy the rest of the application code
COPY . .

# Finish composer autoloading
RUN composer dump-autoload --optimize

# Ensure storage directories exist and are writable
RUN mkdir -p storage public/uploads/menu \
    && chmod -R 777 storage public/uploads

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public", "public/router.php"]
