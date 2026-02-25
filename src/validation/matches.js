import { z } from 'zod';

/**
 * Schema to validate query parameters for listing matches
 * Supports optional limit parameter (max 100)
 */
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Match status constants
 */
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

/**
 * Schema to validate match ID from URL parameters
 * Requires a positive integer ID
 */
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Schema to validate match creation payload
 * Includes validation for ISO date strings and chronological ordering
 */
 
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, 'Sport must be a non-empty string'),
    homeTeam: z.string().min(1, 'Home team must be a non-empty string'),
    awayTeam: z.string().min(1, 'Away team must be a non-empty string'),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (endTime <= startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'endTime must be chronologically after startTime',
      });
    }
  });

/**
 * Schema to validate score update payload
 * Requires both home and away scores as non-negative integers
 */
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
