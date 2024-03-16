CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`version` text,
	`provider` text,
	`firstname` text,
	`status` text,
	`key` text,
	`email` text,
	`user` text,
	`requesthost` text,
	`authstrength` text,
	`org` text,
	`uniqueid` text,
	`name` text,
	`username` text,
	`host` text,
	`authorig` text,
	`displayname` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniqueid` ON `users` (`uniqueid`);