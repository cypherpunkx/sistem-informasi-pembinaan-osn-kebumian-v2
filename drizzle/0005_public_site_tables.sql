CREATE TABLE `site_settings` (
	`key` varchar(100) NOT NULL,
	`value` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `nav_cards` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`href` varchar(500) NOT NULL,
	`icon` varchar(60) NOT NULL,
	`sort_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nav_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_stats` (
	`key` varchar(60) NOT NULL,
	`value` varchar(100) NOT NULL,
	`label` varchar(100) NOT NULL,
	`sort_order` int DEFAULT 0,
	CONSTRAINT `public_stats_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`template` varchar(60) DEFAULT 'default',
	`content` text,
	`published_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `page_sections` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`page_id` int NOT NULL,
	`section_key` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`sort_order` int DEFAULT 0,
	CONSTRAINT `page_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `soal_archives` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`tahun` int NOT NULL,
	`tahap` varchar(60) NOT NULL,
	`jenjang` varchar(20) NOT NULL,
	`title` varchar(255),
	`soal_url` varchar(2000) NOT NULL,
	`pembahasan_url` varchar(2000),
	`published_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `soal_archives_id` PRIMARY KEY(`id`)
);
