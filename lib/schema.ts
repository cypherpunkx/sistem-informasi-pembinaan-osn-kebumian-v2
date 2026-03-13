import { sql } from 'drizzle-orm';
import { mysqlTable, serial, varchar, text, mysqlEnum, timestamp, int, json, boolean, double, primaryKey, unique, tinyint } from "drizzle-orm/mysql-core";

export const topics = mysqlTable("topics", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    sortOrder: int("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const users = mysqlTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    role: mysqlEnum("role", ["admin", "pembina", "peserta"]).default("peserta").notNull(),
    school: varchar("school", { length: 255 }),
    contact: varchar("contact", { length: 50 }),
    competitionCategory: varchar("competition_category", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const questions = mysqlTable("questions", {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    createdBy: int("created_by"), // Track who created the question
    type: mysqlEnum("type", ["MULTIPLE_CHOICE", "SHORT_ANSWER", "ESSAY"]).notNull(),
    topic: varchar("topic", { length: 100 }).notNull(),
    subtopic: varchar("subtopic", { length: 100 }),
    difficulty: mysqlEnum("difficulty", ["EASY", "MEDIUM", "HARD"]).notNull(),
    year: int("year"),
    source: varchar("source", { length: 255 }),
    explanation: text("explanation"),
    tags: json("tags"),
    status: mysqlEnum("status", ["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"]).default("DRAFT").notNull(),
    weight: int("weight").default(1),
    answerKeys: json("answer_keys"), // For Short Answer: { key: string, tolerance?: number }[]
    rubric: json("rubric"), // For Essay: { component: string, keywords: string[], points: number }[]
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const options = mysqlTable("options", {
    id: serial("id").primaryKey(),
    questionId: int("question_id").notNull(), // Assuming simple int FK for now, ideally foreignKey referencing questions.id
    content: text("content").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
});

export const materials = mysqlTable("materials", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", ["PDF", "VIDEO", "SLIDE", "TEXT"]).notNull(),
    url: varchar("url", { length: 2000 }).notNull(),
    topic: varchar("topic", { length: 100 }).notNull(),
    tags: json("tags"), // Stored as array of strings
    status: mysqlEnum("status", ["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"]).default("DRAFT").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const exams = mysqlTable("exams", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    duration: int("duration").notNull(), // in minutes
    type: mysqlEnum("type", ["FIXED", "DYNAMIC"]).notNull(),
    category: varchar("category", { length: 100 }), // e.g. "OSN", "Latihan Harian"
    isActive: boolean("is_active").default(true),
    /** Global window: ujian hanya bisa dimulai dalam rentang ini. NULL = selalu buka. */
    availableStart: timestamp("available_start"),
    availableEnd: timestamp("available_end"),
    /** Hanya untuk type DYNAMIC: { topics?: string[], difficulties?: ("EASY"|"MEDIUM"|"HARD")[], questionCount: number }. Soal diambil random saat mulai. */
    filterConfig: json("filter_config").$type<{ topics?: string[]; difficulties?: ("EASY" | "MEDIUM" | "HARD")[]; questionCount: number } | null>(),
    /** Pembuat ujian (untuk approval & rate limit Latihan Topik). NULL = legacy. */
    createdBy: int("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const examQuestions = mysqlTable("exam_questions", {
    id: serial("id").primaryKey(),
    examId: int("exam_id").notNull(),
    questionId: int("question_id").notNull(),
    order: int("order").notNull(),
});

export const examSessions = mysqlTable("exam_sessions", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(), // NextAuth user ID
    examId: int("exam_id").notNull(),
    startTime: timestamp("start_time").defaultNow(),
    endTime: timestamp("end_time"),
    score: int("score"),
    totalQuestions: int("total_questions").default(0),
    correctAnswers: int("correct_answers").default(0),
    questionOrder: json("question_order"), // Store randomized question IDs
    status: mysqlEnum("status", ["IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS"),
    feedback: text("feedback"), // Teacher feedback or automated message
});

export const examAnswers = mysqlTable("exam_answers", {
    id: serial("id").primaryKey(),
    sessionId: int("session_id").notNull(),
    questionId: int("question_id").notNull(),
    answer: text("answer"), // Selected option ID or text
    isCorrect: boolean("is_correct"),
    score: double("score").default(0), // Calculated score (supports negative marking & fractional essay)
    feedback: text("feedback"), // Auto-generated feedback based on rubric
});

export const userProgress = mysqlTable("user_progress", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    materialId: int("material_id").notNull(),
    isCompleted: boolean("is_completed").default(false),
    completedAt: timestamp("completed_at"),
    lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});



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
        unique("news_slug_unique").on(table.slug),
    ]);

export const newsViews = mysqlTable("news_views", {
    id: serial().notNull(),
    newsId: int("news_id").notNull(),
    viewedAt: timestamp("viewed_at", { mode: 'string' }).default(sql`(now())`),
},
    (table) => [
        primaryKey({ columns: [table.id], name: "news_views_id" }),
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
    ]);

