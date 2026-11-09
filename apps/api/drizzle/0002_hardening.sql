-- A user may belong to at most one household: drop duplicate memberships
-- (keep the earliest) before the unique index is created.
DELETE FROM "household_members" hm
USING "household_members" older
WHERE hm."user_id" = older."user_id"
  AND (hm."joined_at", hm."id") > (older."joined_at", older."id");--> statement-breakpoint
DROP INDEX "household_members_user_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "household_members_user_idx" ON "household_members" USING btree ("user_id");--> statement-breakpoint
-- Goal contributions were stored as 'expense'; they are savings, not spending.
UPDATE "transactions" SET "type" = 'saving' WHERE "goal_id" IS NOT NULL AND "type" = 'expense';
