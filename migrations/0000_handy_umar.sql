CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	`total_price` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` integer NOT NULL,
	`vendor_id` text NOT NULL,
	`vendor_name` text NOT NULL,
	`vendor_phone` text,
	`customer_name` text,
	`customer_phone` text,
	`payment_method` text NOT NULL,
	`payment_status` text DEFAULT 'pendente' NOT NULL,
	`delivery_status` text DEFAULT 'pendente' NOT NULL,
	`total_amount` real NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` text DEFAULT 'unico' NOT NULL,
	`price` real NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'vendor' NOT NULL,
	`name` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);