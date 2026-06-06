-- ============================================================
-- VendorBridge ERP — Migration 001: Authentication Module
-- Enhances users table + adds password_reset_tokens table
-- ============================================================

USE `vendorbridge`;

-- ── 1. Add missing columns to users table ──
-- status: controls whether a user can login
-- last_login: tracks the last successful authentication
-- updated_at: auto-updates on row modification
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER `role`,
  ADD COLUMN IF NOT EXISTS `last_login` TIMESTAMP NULL DEFAULT NULL AFTER `status`,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `last_login`;

-- ── 2. Add performance indexes ──
CREATE INDEX IF NOT EXISTS `idx_users_status` ON `users` (`status`);
CREATE INDEX IF NOT EXISTS `idx_users_role` ON `users` (`role`);
CREATE INDEX IF NOT EXISTS `idx_users_email` ON `users` (`email`);

-- ── 3. Password Reset Tokens table ──
-- Stores time-limited tokens for the forgot-password flow.
-- Each token is single-use and expires after 1 hour.
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `unique_token` (`token`),
  INDEX `idx_expires` (`expires_at`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Cleanup: remove any expired/used tokens older than 24h ──
-- This is a maintenance query you can run periodically via cron
-- DELETE FROM password_reset_tokens WHERE used = TRUE OR expires_at < NOW();
