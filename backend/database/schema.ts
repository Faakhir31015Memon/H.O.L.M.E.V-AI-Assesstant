import { pgTable, serial, text, timestamp, doublePrecision, jsonb, customType } from 'drizzle-orm/pg-core';

// Custom type helper defining the pgvector 'vector' type in Drizzle
const pgVector = customType<{ data: number[]; config: { dimensions: number } }>({
  dataType: (config) => `vector(${config?.dimensions ?? 768})`,
  toDriver: (value: number[]) => `[${value.join(',')}]`,
  fromDriver: (value: string) => {
    // Vectors returned from postgres are formatted as '[0.123,0.456,...]'
    return value
      .replace(/[\[\]]/g, '')
      .split(',')
      .map((num) => parseFloat(num));
  },
});

// 1. Memory Logs table with 768-dimension text embedding vector index
export const MemoryLogs = pgTable('memory_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  promptText: text('prompt_text').notNull(),
  embedding: pgVector('embedding', { dimensions: 768 }).notNull(),
  metadata: jsonb('metadata').$type<{
    category?: string;
    sessionId?: string;
    tokens?: number;
  }>(),
});

// 2. User Identities table with 128-dimension face recognition embedding vector index
export const UserIdentities = pgTable('user_identities', {
  id: serial('id').primaryKey(),
  userName: text('user_name').notNull().unique(),
  faceEmbedding: pgVector('face_embedding', { dimensions: 128 }).notNull(),
  securityClearanceLevel: text('security_clearance_level').default('UNCLASSIFIED').notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
});

// 3. System Audit Logs table for core instrumentation
export const SystemAuditLogs = pgTable('system_audit_logs', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(),
  status: text('status').notNull(),
  executionTimeMs: doublePrecision('execution_time_ms').notNull(),
  payload: jsonb('payload'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
export type MemoryLog = typeof MemoryLogs.$inferSelect;
export type InsertMemoryLog = typeof MemoryLogs.$inferInsert;
export type UserIdentity = typeof UserIdentities.$inferSelect;
export type InsertUserIdentity = typeof UserIdentities.$inferInsert;
export type SystemAuditLog = typeof SystemAuditLogs.$inferSelect;
export type InsertSystemAuditLog = typeof SystemAuditLogs.$inferInsert;
