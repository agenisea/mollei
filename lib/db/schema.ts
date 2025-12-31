import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  preferences: jsonb('preferences').default({ personality: 'default' }),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  status: varchar('status', { length: 20 }).default('active'),
  emotionState: jsonb('emotion_state').notNull(),
  contextSummary: text('context_summary'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const conversationTurns = pgTable('conversation_turns', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id),
  turnNumber: integer('turn_number').notNull(),
  userMessage: text('user_message').notNull(),
  molleiResponse: text('mollei_response').notNull(),
  userEmotion: jsonb('user_emotion').notNull(),
  molleiEmotion: jsonb('mollei_emotion').notNull(),
  crisisDetected: boolean('crisis_detected').default(false),
  crisisSeverity: integer('crisis_severity'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const crisisEvents = pgTable('crisis_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id),
  turnId: uuid('turn_id').references(() => conversationTurns.id),
  triggerText: text('trigger_text').notNull(),
  severity: integer('severity').notNull(),
  signalType: varchar('signal_type', { length: 50 }).notNull(),
  actionTaken: varchar('action_taken', { length: 50 }).notNull(),
  resourcesShown: jsonb('resources_shown'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type ConversationTurn = typeof conversationTurns.$inferSelect
export type NewConversationTurn = typeof conversationTurns.$inferInsert

export type CrisisEvent = typeof crisisEvents.$inferSelect
export type NewCrisisEvent = typeof crisisEvents.$inferInsert
