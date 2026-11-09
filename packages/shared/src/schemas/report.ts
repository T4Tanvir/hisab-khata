import { z } from 'zod';
import { monthSchema } from './common';

/** Report periods: last N months ending at `end`, or the calendar year to date. */
export const REPORT_PERIODS = ['1', '3', '6', '12', 'ytd'] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const reportOverviewQuerySchema = z.object({
  period: z.enum(REPORT_PERIODS).default('6'),
  /** Last month of the period (YYYY-MM); defaults to the current Asia/Dhaka month. */
  end: monthSchema.optional(),
});

export const reportExportQuerySchema = z.object({
  from: monthSchema.optional(),
  to: monthSchema.optional(),
  /** Legacy single-month export */
  month: monthSchema.optional(),
});

export type ReportOverviewQuery = z.infer<typeof reportOverviewQuerySchema>;
