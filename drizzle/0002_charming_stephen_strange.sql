ALTER TABLE `leads` ADD `benefit_kind` text DEFAULT 'legacy_cash' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `discount_month` text;