CREATE TABLE IF NOT EXISTS "saved_listings" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "listing_id" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_saved_listings_user_id" ON "saved_listings" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_saved_listings_listing_id" ON "saved_listings" ("listing_id");
CREATE UNIQUE INDEX IF NOT EXISTS "saved_listings_user_listing_unique" ON "saved_listings" ("user_id", "listing_id");

DO $$ BEGIN
 ALTER TABLE "saved_listings"
  ADD CONSTRAINT "saved_listings_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "saved_listings"
  ADD CONSTRAINT "saved_listings_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
