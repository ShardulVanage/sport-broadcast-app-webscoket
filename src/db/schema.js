import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  pgEnum,
  jsonb,
  foreignKey,
} from 'drizzle-orm/pg-core';

// Define matchStatus enum with values: scheduled, live, finished
export const matchStatusEnum = pgEnum('match_status', [
  'scheduled',
  'live',
  'finished',
]);

// Matches table - stores all sports match information
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  sport: text('sport').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  status: matchStatusEnum('status').notNull().default('scheduled'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  homeScore: integer('home_score').notNull().default(0),
  awayScore: integer('away_score').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Commentary table - stores real-time match events and commentary
export const commentary = pgTable(
  'commentary',
  {
    id: serial('id').primaryKey(),
    matchId: integer('match_id').notNull(),
    minute: integer('minute'),
    sequence: integer('sequence'),
    period: text('period'),
    eventType: text('event_type').notNull(),
    actor: text('actor'),
    team: text('team'),
    message: text('message').notNull(),
    metadata: jsonb('metadata'),
    tags: text('tags').array(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.matchId],
      foreignColumns: [matches.id],
    }).onDelete('cascade'),
  ]
);

// Export types for type-safe queries using JSDoc
/**
 * @typedef {typeof matches.$inferSelect} Match
 * @typedef {typeof matches.$inferInsert} NewMatch
 * @typedef {typeof commentary.$inferSelect} Commentary
 * @typedef {typeof commentary.$inferInsert} NewCommentary
 */
