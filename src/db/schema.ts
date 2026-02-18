import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  smallint,
  jsonb,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// ============================================
// ENUMS
// ============================================

export const quizStatusEnum = pgEnum("quiz_status", [
  "draft",
  "live",
  "archived",
])

export const questionTypeEnum = pgEnum("question_type", [
  "single_choice",
  "multi_select",
])

// ============================================
// USERS
// ============================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
}))

// ============================================
// WORKSPACES
// ============================================

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    websiteUrl: varchar("website_url", { length: 2048 }),
    brandSummary: jsonb("brand_summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index("idx_workspaces_owner").on(table.ownerId),
  })
)

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  quizzes: many(quizzes),
}))

// ============================================
// QUIZZES
// ============================================

export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 128 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    status: quizStatusEnum("status").notNull().default("draft"),
    emailCapture: boolean("email_capture").notNull().default(false),
    aiConcept: jsonb("ai_concept"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    workspaceIdx: index("idx_quizzes_workspace").on(table.workspaceId),
    slugIdx: index("idx_quizzes_slug").on(table.slug),
  })
)

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [quizzes.workspaceId],
    references: [workspaces.id],
  }),
  questions: many(questions),
  resultTypes: many(resultTypes),
  responses: many(responses),
}))

// ============================================
// QUESTIONS
// ============================================

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    sortOrder: smallint("sort_order").notNull(),
    text: text("text").notNull(),
    questionType: questionTypeEnum("question_type")
      .notNull()
      .default("single_choice"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    quizSortIdx: index("idx_questions_quiz").on(table.quizId, table.sortOrder),
  })
)

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  answerOptions: many(answerOptions),
  responseAnswers: many(responseAnswers),
}))

// ============================================
// ANSWER OPTIONS
// ============================================

export const answerOptions = pgTable(
  "answer_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    sortOrder: smallint("sort_order").notNull(),
    text: varchar("text", { length: 500 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    questionSortIdx: index("idx_answer_options_question").on(
      table.questionId,
      table.sortOrder
    ),
  })
)

export const answerOptionsRelations = relations(
  answerOptions,
  ({ one, many }) => ({
    question: one(questions, {
      fields: [answerOptions.questionId],
      references: [questions.id],
    }),
    resultMappings: many(answerOptionResultMappings),
    responseAnswers: many(responseAnswers),
  })
)

// ============================================
// RESULT TYPES
// ============================================

export const resultTypes = pgTable(
  "result_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    sortOrder: smallint("sort_order").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    colour: varchar("colour", { length: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    quizSortIdx: index("idx_result_types_quiz").on(
      table.quizId,
      table.sortOrder
    ),
  })
)

export const resultTypesRelations = relations(resultTypes, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [resultTypes.quizId],
    references: [quizzes.id],
  }),
  answerMappings: many(answerOptionResultMappings),
  responses: many(responses),
}))

// ============================================
// ANSWER-TO-RESULT MAPPING (scoring matrix)
// ============================================

export const answerOptionResultMappings = pgTable(
  "answer_option_result_mappings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    answerOptionId: uuid("answer_option_id")
      .notNull()
      .references(() => answerOptions.id, { onDelete: "cascade" }),
    resultTypeId: uuid("result_type_id")
      .notNull()
      .references(() => resultTypes.id, { onDelete: "cascade" }),
    weight: smallint("weight").notNull().default(1),
  },
  (table) => ({
    answerIdx: index("idx_mappings_answer").on(table.answerOptionId),
    resultIdx: index("idx_mappings_result").on(table.resultTypeId),
    uniqueAnswerResult: unique("uq_answer_result").on(
      table.answerOptionId,
      table.resultTypeId
    ),
  })
)

export const answerOptionResultMappingsRelations = relations(
  answerOptionResultMappings,
  ({ one }) => ({
    answerOption: one(answerOptions, {
      fields: [answerOptionResultMappings.answerOptionId],
      references: [answerOptions.id],
    }),
    resultType: one(resultTypes, {
      fields: [answerOptionResultMappings.resultTypeId],
      references: [resultTypes.id],
    }),
  })
)

// ============================================
// RESPONSES (quiz submissions)
// ============================================

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    resultTypeId: uuid("result_type_id").references(() => resultTypes.id, {
      onDelete: "set null",
    }),
    respondentEmail: varchar("respondent_email", { length: 255 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    quizIdx: index("idx_responses_quiz").on(table.quizId),
    completedIdx: index("idx_responses_completed").on(
      table.quizId,
      table.completedAt
    ),
  })
)

export const responsesRelations = relations(responses, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [responses.quizId],
    references: [quizzes.id],
  }),
  resultType: one(resultTypes, {
    fields: [responses.resultTypeId],
    references: [resultTypes.id],
  }),
  responseAnswers: many(responseAnswers),
}))

// ============================================
// RESPONSE ANSWERS
// ============================================

export const responseAnswers = pgTable(
  "response_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    answerOptionId: uuid("answer_option_id")
      .notNull()
      .references(() => answerOptions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    responseIdx: index("idx_response_answers_response").on(table.responseId),
  })
)

export const responseAnswersRelations = relations(
  responseAnswers,
  ({ one }) => ({
    response: one(responses, {
      fields: [responseAnswers.responseId],
      references: [responses.id],
    }),
    question: one(questions, {
      fields: [responseAnswers.questionId],
      references: [questions.id],
    }),
    answerOption: one(answerOptions, {
      fields: [responseAnswers.answerOptionId],
      references: [answerOptions.id],
    }),
  })
)

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert
export type Quiz = typeof quizzes.$inferSelect
export type NewQuiz = typeof quizzes.$inferInsert
export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert
export type AnswerOption = typeof answerOptions.$inferSelect
export type NewAnswerOption = typeof answerOptions.$inferInsert
export type ResultType = typeof resultTypes.$inferSelect
export type NewResultType = typeof resultTypes.$inferInsert
export type AnswerOptionResultMapping =
  typeof answerOptionResultMappings.$inferSelect
export type NewAnswerOptionResultMapping =
  typeof answerOptionResultMappings.$inferInsert
export type Response = typeof responses.$inferSelect
export type NewResponse = typeof responses.$inferInsert
export type ResponseAnswer = typeof responseAnswers.$inferSelect
export type NewResponseAnswer = typeof responseAnswers.$inferInsert
