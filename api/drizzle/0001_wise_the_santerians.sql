CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text,
	`event` text NOT NULL,
	`product_id` integer,
	`product_model` text,
	`extra` text,
	`ua` text,
	`created_at` integer
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `session_id` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `status` text DEFAULT '未跟进';--> statement-breakpoint
ALTER TABLE `leads` ADD `admin_notes` text;--> statement-breakpoint
ALTER TABLE `leads` ADD `followed_at` integer;