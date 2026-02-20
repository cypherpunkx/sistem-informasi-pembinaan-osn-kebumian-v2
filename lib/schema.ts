import { mysqlTable, serial, varchar, text, mysqlEnum, timestamp, int, json, boolean, double } from "drizzle-orm/mysql-core";

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

export const news = mysqlTable("news", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    category: varchar("category", { length: 60 }), // pengumuman | jadwal | hasil | materi | info_teknis | dokumentasi
    thumbnailUrl: varchar("thumbnail_url", { length: 2000 }),
    summary: text("summary"),
    content: text("content"),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).default("DRAFT").notNull(),
    publishedAt: timestamp("published_at"),
    scheduledPublishAt: timestamp("scheduled_publish_at"),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    createdBy: int("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const newsViews = mysqlTable("news_views", {
    id: serial("id").primaryKey(),
    newsId: int("news_id").notNull(),
    viewedAt: timestamp("viewed_at").defaultNow(),
});

// --- Konten dikelola sistem (public site) ---

export const siteSettings = mysqlTable("site_settings", {
    key: varchar("key", { length: 100 }).primaryKey(),
    value: text("value"),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const navCards = mysqlTable("nav_cards", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    href: varchar("href", { length: 500 }).notNull(),
    icon: varchar("icon", { length: 60 }).notNull(),
    sortOrder: int("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const publicStats = mysqlTable("public_stats", {
    key: varchar("key", { length: 60 }).primaryKey(),
    value: varchar("value", { length: 100 }).notNull(),
    label: varchar("label", { length: 100 }).notNull(),
    sortOrder: int("sort_order").default(0),
});

export const pages = mysqlTable("pages", {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    template: varchar("template", { length: 60 }).default("default"), // default | persiapan | silabus | tentang
    content: text("content"), // untuk halaman single-content (tentang)
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const pageSections = mysqlTable("page_sections", {
    id: serial("id").primaryKey(),
    pageId: int("page_id").notNull(),
    sectionKey: varchar("section_key", { length: 100 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    sortOrder: int("sort_order").default(0),
});

export const soalArchives = mysqlTable("soal_archives", {
    id: serial("id").primaryKey(),
    tahun: int("tahun").notNull(),
    tahap: varchar("tahap", { length: 60 }).notNull(),
    jenjang: varchar("jenjang", { length: 20 }).notNull(),
    title: varchar("title", { length: 255 }),
    soalUrl: varchar("soal_url", { length: 2000 }).notNull(),
    pembahasanUrl: varchar("pembahasan_url", { length: 2000 }),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
