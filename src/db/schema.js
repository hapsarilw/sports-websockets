import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Represents the lifecycle state of a sports match.
 *  - scheduled : match has not yet started
 *  - live      : match is currently in progress
 *  - finished  : match has ended
 */
export const matchStatusEnum = pgEnum('match_status', [
  'scheduled',
  'live',
  'finished',
]);

// ---------------------------------------------------------------------------
// matches
// ---------------------------------------------------------------------------

/**
 * Core match record.
 * Each row represents a single sporting fixture.
 */
export const matches = pgTable('matches', {
  /** Auto-incrementing surrogate primary key. */
  id: serial('id').primaryKey(),

  /** Sport category (e.g. "football", "basketball", "tennis"). */
  sport: text('sport').notNull(),

  /** Name / identifier of the home team. */
  homeTeam: text('home_team').notNull(),

  /** Name / identifier of the away team. */
  awayTeam: text('away_team').notNull(),

  /** Current lifecycle state of the match. */
  status: matchStatusEnum('status').notNull().default('scheduled'),

  /** Scheduled or actual kick-off / tip-off time (UTC). */
  startTime: timestamp('start_time').notNull(),

  /** Actual finish time; NULL while the match is ongoing. */
  endTime: timestamp('end_time'),

  /** Goals / points scored by the home team. */
  homeScore: integer('home_score').notNull().default(0),

  /** Goals / points scored by the away team. */
  awayScore: integer('away_score').notNull().default(0),

  /** Row creation timestamp, set automatically by the database. */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// commentary
// ---------------------------------------------------------------------------

/**
 * Timestamped commentary / event feed for a match.
 * Each row is a single incident captured during the fixture
 * (e.g. a goal, a card, a substitution, or a free-text comment).
 */
export const commentary = pgTable('commentary', {
  /** Auto-incrementing surrogate primary key. */
  id: serial('id').primaryKey(),

  /**
   * Foreign key linking this entry to its parent match.
   * Uses an inline reference rather than a named constraint
   * so Drizzle can infer the relation automatically.
   */
  matchId: integer('match_id')
    .notNull()
    .references(() => matches.id),

  /** Match clock at the time of the event (e.g. 45 for the 45th minute). */
  minute: integer('minute'),

  /**
   * Tie-breaking sequence number within the same minute.
   * Allows deterministic ordering of concurrent events.
   */
  sequence: integer('sequence'),

  /** Match period / half (e.g. "1H", "2H", "ET1", "ET2", "PEN"). */
  period: text('period'),

  /**
   * Category of the event (e.g. "goal", "yellow_card",
   * "substitution", "comment", "var_review").
   */
  eventType: text('event_type'),

  /** Primary actor involved in the event (player name or ID). */
  actor: text('actor'),

  /** Team associated with the event ("home" | "away" | null). */
  team: text('team'),

  /** Human-readable commentary or description of the event. */
  message: text('message'),

  /**
   * Flexible JSON payload for sport-specific or event-specific data
   * (e.g. assist provider, VAR outcome, substitution details).
   */
  metadata: jsonb('metadata'),

  /**
   * Searchable label array stored as a plain-text column.
   * Use a text[] / array column in production; kept as text here
   * for broad driver compatibility.
   */
  tags: text('tags'),

  /** Row creation timestamp, set automatically by the database. */
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
