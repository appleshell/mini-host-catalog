CREATE TABLE `chat_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`phone` text,
	`wechat` text,
	`requirement` text,
	`interested_products` text,
	`source` text DEFAULT 'catalog',
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`model` text NOT NULL,
	`image_url` text,
	`cpu` text,
	`memory` text,
	`storage` text,
	`gpu` text,
	`network` text,
	`audio` text,
	`display` text,
	`other_ports` text,
	`dimensions` text,
	`os` text,
	`power` text,
	`cooling` text,
	`mounting` text,
	`notes` text,
	`network_count` integer,
	`serial_count` integer,
	`has_wifi` integer,
	`has_fanless` integer,
	`created_at` integer
);
