-- Add session expiry. Existing sessions get expires_at = 0, i.e. they are
-- treated as expired immediately (forces a fresh login once).
ALTER TABLE "sessions" ADD COLUMN "expires_at" bigint;
UPDATE "sessions" SET "expires_at" = 0 WHERE "expires_at" IS NULL;
ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET NOT NULL;
