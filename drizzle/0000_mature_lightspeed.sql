CREATE TABLE `reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`table_id` text NOT NULL,
	`day` text NOT NULL,
	`hour` integer NOT NULL,
	`guests` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`source` text DEFAULT 'guest' NOT NULL,
	`spend` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reservations_owner_day_table` ON `reservations` (`owner`,`day`,`table_id`);--> statement-breakpoint
CREATE TABLE `seeded_days` (
	`id` text PRIMARY KEY NOT NULL
);
