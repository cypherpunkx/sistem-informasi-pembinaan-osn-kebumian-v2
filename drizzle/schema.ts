import { mysqlTable, primaryKey, unique, serial, int, text, double, varchar, timestamp, json, mysqlEnum, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const examAnswers = mysqlTable("exam_answers", {
	id: serial().notNull(),
	sessionId: int("session_id").notNull(),
	questionId: int("question_id").notNull(),
	answer: text(),
	isCorrect: tinyint("is_correct"),
	score: double(),
	feedback: text(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "exam_answers_id" }),
		unique("id").on(table.id),
	]);

export const examQuestions = mysqlTable("exam_questions", {
	id: serial().notNull(),
	examId: int("exam_id").notNull(),
	questionId: int("question_id").notNull(),
	order: int().notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "exam_questions_id" }),
		unique("id").on(table.id),
	]);

export const examSessions = mysqlTable("exam_sessions", {
	id: serial().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	examId: int("exam_id").notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).default(sql`(now())`),
	endTime: timestamp("end_time", { mode: 'string' }),
	score: int(),
	totalQuestions: int("total_questions").default(0),
	correctAnswers: int("correct_answers").default(0),
	questionOrder: json("question_order"),
	status: mysqlEnum(['IN_PROGRESS', 'COMPLETED']).default('IN_PROGRESS'),
	feedback: text(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "exam_sessions_id" }),
		unique("id").on(table.id),
	]);

export const exams = mysqlTable("exams", {
	id: serial().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	duration: int().notNull(),
	type: mysqlEnum(['FIXED', 'DYNAMIC']).notNull(),
	category: varchar({ length: 100 }),
	isActive: tinyint("is_active").default(1),
	availableStart: timestamp("available_start", { mode: 'string' }),
	availableEnd: timestamp("available_end", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "exams_id" }),
		unique("id").on(table.id),
	]);

export const materials = mysqlTable("materials", {
	id: serial().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	type: mysqlEnum(['PDF', 'VIDEO', 'SLIDE', 'TEXT']).notNull(),
	url: varchar({ length: 2000 }).notNull(),
	topic: varchar({ length: 100 }).notNull(),
	tags: json(),
	status: mysqlEnum(['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED']).default('DRAFT').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "materials_id" }),
		unique("id").on(table.id),
	]);

export const navCards = mysqlTable("nav_cards", {
	id: serial().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	href: varchar({ length: 500 }).notNull(),
	icon: varchar({ length: 60 }).notNull(),
	sortOrder: int("sort_order").default(0),
	isActive: tinyint("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "nav_cards_id" }),
		unique("id").on(table.id),
	]);

export const news = mysqlTable("news", {
	id: serial().notNull(),
	title: varchar({ length: 500 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	thumbnailUrl: varchar("thumbnail_url", { length: 2000 }),
	summary: text(),
	content: text(),
	status: mysqlEnum(['DRAFT', 'PUBLISHED']).default('DRAFT').notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	scheduledPublishAt: timestamp("scheduled_publish_at", { mode: 'string' }),
	seoTitle: varchar("seo_title", { length: 255 }),
	seoDescription: text("seo_description"),
	createdBy: int("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	category: varchar({ length: 60 }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "news_id" }),
		unique("id").on(table.id),
		unique("news_slug_unique").on(table.slug),
	]);

export const newsViews = mysqlTable("news_views", {
	id: serial().notNull(),
	newsId: int("news_id").notNull(),
	viewedAt: timestamp("viewed_at", { mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "news_views_id" }),
		unique("id").on(table.id),
	]);

export const options = mysqlTable("options", {
	id: serial().notNull(),
	questionId: int("question_id").notNull(),
	content: text().notNull(),
	isCorrect: tinyint("is_correct").default(0).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "options_id" }),
		unique("id").on(table.id),
	]);

export const pageSections = mysqlTable("page_sections", {
	id: serial().notNull(),
	pageId: int("page_id").notNull(),
	sectionKey: varchar("section_key", { length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text(),
	sortOrder: int("sort_order").default(0),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "page_sections_id" }),
		unique("id").on(table.id),
	]);

export const pages = mysqlTable("pages", {
	id: serial().notNull(),
	slug: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	description: text(),
	template: varchar({ length: 60 }).default('default'),
	content: text(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "pages_id" }),
		unique("id").on(table.id),
		unique("pages_slug_unique").on(table.slug),
	]);

export const publicStats = mysqlTable("public_stats", {
	key: varchar({ length: 60 }).notNull(),
	value: varchar({ length: 100 }).notNull(),
	label: varchar({ length: 100 }).notNull(),
	sortOrder: int("sort_order").default(0),
},
	(table) => [
		primaryKey({ columns: [table.key], name: "public_stats_key" }),
	]);

export const questions = mysqlTable("questions", {
	id: serial().notNull(),
	content: text().notNull(),
	createdBy: int("created_by"),
	type: mysqlEnum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY']).notNull(),
	topic: varchar({ length: 100 }).notNull(),
	subtopic: varchar({ length: 100 }),
	difficulty: mysqlEnum(['EASY', 'MEDIUM', 'HARD']).notNull(),
	year: int(),
	source: varchar({ length: 255 }),
	explanation: text(),
	tags: json(),
	status: mysqlEnum(['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED']).default('DRAFT').notNull(),
	weight: int().default(1),
	answerKeys: json("answer_keys"),
	rubric: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "questions_id" }),
		unique("id").on(table.id),
	]);

export const siteSettings = mysqlTable("site_settings", {
	key: varchar({ length: 100 }).notNull(),
	value: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.key], name: "site_settings_key" }),
	]);

export const soalArchives = mysqlTable("soal_archives", {
	id: serial().notNull(),
	tahun: int().notNull(),
	tahap: varchar({ length: 60 }).notNull(),
	jenjang: varchar({ length: 20 }).notNull(),
	title: varchar({ length: 255 }),
	soalUrl: varchar("soal_url", { length: 2000 }).notNull(),
	pembahasanUrl: varchar("pembahasan_url", { length: 2000 }),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "soal_archives_id" }),
		unique("id").on(table.id),
	]);

export const topics = mysqlTable("topics", {
	id: serial().notNull(),
	name: varchar({ length: 100 }).notNull(),
	sortOrder: int("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "topics_id" }),
		unique("id").on(table.id),
		unique("topics_name_unique").on(table.name),
	]);

export const userProgress = mysqlTable("user_progress", {
	id: serial().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	materialId: int("material_id").notNull(),
	isCompleted: tinyint("is_completed").default(0),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }).default(sql`(now())`),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "user_progress_id" }),
		unique("id").on(table.id),
	]);

export const users = mysqlTable("users", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: text().notNull(),
	role: mysqlEnum(['admin', 'pembina', 'peserta']).default('peserta').notNull(),
	school: varchar({ length: 255 }),
	contact: varchar({ length: 50 }),
	competitionCategory: varchar("competition_category", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "users_id" }),
		unique("id").on(table.id),
		unique("users_email_unique").on(table.email),
	]);
