CREATE TABLE `legacy_identities` (
	`id` integer PRIMARY KEY NOT NULL,
	`identifier` text,
	`email` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identifier` ON `legacy_identities` (`identifier`);