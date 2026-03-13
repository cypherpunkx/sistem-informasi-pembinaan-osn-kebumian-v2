CREATE TABLE `exam_answers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`question_id` int NOT NULL,
	`answer` text,
	`is_correct` boolean,
	`score` double DEFAULT 0,
	`feedback` text,
	CONSTRAINT `exam_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_questions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`exam_id` int NOT NULL,
	`question_id` int NOT NULL,
	`order` int NOT NULL,
	CONSTRAINT `exam_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_sessions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`exam_id` int NOT NULL,
	`start_time` timestamp DEFAULT (now()),
	`end_time` timestamp,
	`score` int,
	`total_questions` int DEFAULT 0,
	`correct_answers` int DEFAULT 0,
	`question_order` json,
	`status` enum('IN_PROGRESS','COMPLETED') DEFAULT 'IN_PROGRESS',
	`feedback` text,
	CONSTRAINT `exam_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`duration` int NOT NULL,
	`type` enum('FIXED','DYNAMIC') NOT NULL,
	`category` varchar(100),
	`is_active` boolean DEFAULT true,
	`available_start` timestamp,
	`available_end` timestamp,
	`filter_config` json,
	`created_by` int,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('PDF','VIDEO','SLIDE','TEXT') NOT NULL,
	`url` varchar(2000) NOT NULL,
	`topic` varchar(100) NOT NULL,
	`tags` json,
	`status` enum('DRAFT','PENDING','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nav_cards` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`href` varchar(500) NOT NULL,
	`icon` varchar(60) NOT NULL,
	`sort_order` int DEFAULT 0,
	`is_active` tinyint DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nav_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`category` varchar(60),
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
--> statement-breakpoint
CREATE TABLE `options` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`question_id` int NOT NULL,
	`content` text NOT NULL,
	`is_correct` boolean NOT NULL DEFAULT false,
	CONSTRAINT `options_id` PRIMARY KEY(`id`)
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
CREATE TABLE `public_stats` (
	`key` varchar(60) NOT NULL,
	`value` varchar(100) NOT NULL,
	`label` varchar(100) NOT NULL,
	`sort_order` int DEFAULT 0,
	CONSTRAINT `public_stats_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`created_by` int,
	`type` enum('MULTIPLE_CHOICE','SHORT_ANSWER','ESSAY') NOT NULL,
	`topic` varchar(100) NOT NULL,
	`subtopic` varchar(100),
	`difficulty` enum('EASY','MEDIUM','HARD') NOT NULL,
	`year` int,
	`source` varchar(255),
	`explanation` text,
	`tags` json,
	`status` enum('DRAFT','PENDING','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`weight` int DEFAULT 1,
	`answer_keys` json,
	`rubric` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` varchar(100) NOT NULL,
	`value` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_key` PRIMARY KEY(`key`)
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
--> statement-breakpoint
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
CREATE TABLE `user_progress` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`material_id` int NOT NULL,
	`is_completed` boolean DEFAULT false,
	`completed_at` timestamp,
	`last_accessed_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` text NOT NULL,
	`role` enum('admin','pembina','peserta') NOT NULL DEFAULT 'peserta',
	`school` varchar(255),
	`contact` varchar(50),
	`competition_category` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
