CREATE TABLE `news` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`thumbnail_url` varchar(2000),
	`summary` text,
	`content` text,
	`status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	`published_at` timestamp,
	`scheduled_publish_at` timestamp,
	`seo_title` varchar(255),
	`seo_description` text,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `news_views` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`news_id` int NOT NULL,
	`viewed_at` timestamp DEFAULT (now()),
	CONSTRAINT `news_views_id` PRIMARY KEY(`id`)
);
