CREATE TABLE IF NOT EXISTS "ucsd_verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "email" text NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "verified_at" timestamptz,
  "sends_this_hour" integer DEFAULT 0 NOT NULL,
  "sends_today" integer DEFAULT 0 NOT NULL,
  "hour_window_start" timestamptz,
  "day_window_start" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ucsd_verifications_user_unique" ON "ucsd_verifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_ucsd_verifications_email" ON "ucsd_verifications" ("email");

DO $$ BEGIN
 ALTER TABLE "ucsd_verifications"
  ADD CONSTRAINT "ucsd_verifications_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
