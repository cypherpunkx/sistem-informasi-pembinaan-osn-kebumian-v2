CREATE TABLE `topics` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topics_id` PRIMARY KEY(`id`),
	CONSTRAINT `topics_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
INSERT INTO `topics` (`name`, `sort_order`) VALUES
	('Geology', 1),
	('Meteorology', 2),
	('Astronomy', 3),
	('Oceanography', 4);
