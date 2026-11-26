CREATE INDEX `admin_sessions_expires_idx` ON `admin_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `jobs_reservation_idx` ON `jobs` (`reservation_id`);--> statement-breakpoint
CREATE INDEX `jobs_created_idx` ON `jobs` (`created_at`);--> statement-breakpoint
CREATE INDEX `payment_orders_created_idx` ON `payment_orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `payment_webhook_events_created_idx` ON `payment_webhook_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `rate_limits_reset_idx` ON `rate_limits` (`reset_at`);--> statement-breakpoint
CREATE INDEX `user_created_idx` ON `user` (`created_at`);