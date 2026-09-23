CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`lead` text NOT NULL,
	`action` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`referrer` text NOT NULL,
	`parent_name` text NOT NULL,
	`parent_cpf` text NOT NULL,
	`phone` text NOT NULL,
	`child_name` text NOT NULL,
	`child_cpf` text NOT NULL,
	`age` integer NOT NULL,
	`grade` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`reward` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`consent` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_child_cpf_unique` ON `leads` (`child_cpf`);--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`auth` text NOT NULL,
	`name` text NOT NULL,
	`cpf` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`code` text NOT NULL,
	`parent` text,
	`role` text DEFAULT 'member' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `people_auth_unique` ON `people` (`auth`);--> statement-breakpoint
CREATE UNIQUE INDEX `people_cpf_unique` ON `people` (`cpf`);--> statement-breakpoint
CREATE UNIQUE INDEX `people_code_unique` ON `people` (`code`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
