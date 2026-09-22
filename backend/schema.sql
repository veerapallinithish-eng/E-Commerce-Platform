-- ShopEasy E-Commerce Platform — Database Schema
-- Run this once to create the database and all tables, then run seed.py.
--
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS ecommerce
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ecommerce;

-- --------------------------------------------------
-- USERS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- --------------------------------------------------
-- REVOKED JWT TOKENS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS revoked_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jti VARCHAR(36) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_revoked_tokens_expires_at (expires_at)
) ENGINE=InnoDB;

-- --------------------------------------------------
-- CATEGORIES
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- --------------------------------------------------
-- PRODUCTS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category_id INT,
  image_url VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- --------------------------------------------------
-- PRODUCT IMAGE GALLERY
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------
-- ORDERS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  coupon_code VARCHAR(40),
  status ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  address TEXT NOT NULL,
  ordered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------
-- ORDER ITEMS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------
-- RATINGS  (1 review per customer per product; only
-- customers who purchased the product may post one)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL,
  review TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),
  UNIQUE KEY uniq_product_user (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------
-- WISHLIST
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------
-- COUPONS
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  discount_percent DECIMAL(5, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
