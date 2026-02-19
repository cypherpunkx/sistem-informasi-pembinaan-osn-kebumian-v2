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
	`start_time` timestamp,
	`end_time` timestamp,
	`is_active` boolean DEFAULT true,
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
	`url` varchar(500) NOT NULL,
	`topic` varchar(100) NOT NULL,
	`tags` json,
	`status` enum('DRAFT','PENDING','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
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
