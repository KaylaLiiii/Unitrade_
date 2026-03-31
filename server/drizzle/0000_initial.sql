CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "full_name" text NOT NULL,
  "profile_photo_url" text,
  "preferred_contacts_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "bio" text DEFAULT '' NOT NULL,
  "is_ucsd_verified" boolean DEFAULT false NOT NULL,
  "ucsd_email" text,
  "role" text DEFAULT 'user' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "last_seen_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_expires_at" ON "sessions" ("expires_at");

CREATE TABLE IF NOT EXISTS "listings" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "price" numeric(10, 2) DEFAULT 0 NOT NULL,
  "sale_price" numeric(10, 2),
  "condition" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'available' NOT NULL,
  "seller_id" text,
  "seller_email_snapshot" text NOT NULL,
  "seller_name_snapshot" text NOT NULL,
  "seller_photo_snapshot" text,
  "seller_is_ucsd_verified_snapshot" boolean DEFAULT false NOT NULL,
  "seller_bio_snapshot" text,
  "seller_contacts_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "idx_listings_seller_id" ON "listings" ("seller_id");
CREATE INDEX IF NOT EXISTS "idx_listings_deleted_created" ON "listings" ("deleted_at", "created_at" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "idx_listings_deleted_updated" ON "listings" ("deleted_at", "updated_at" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "idx_listings_deleted_status_created" ON "listings" ("deleted_at", "status", "created_at" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "idx_listings_deleted_seller_created" ON "listings" ("deleted_at", "seller_email_snapshot", "created_at" DESC, "id" DESC);

CREATE TABLE IF NOT EXISTS "listing_categories" (
  "listing_id" text NOT NULL,
  "category" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "listing_categories_pk" PRIMARY KEY("listing_id","category")
);

CREATE INDEX IF NOT EXISTS "idx_listing_categories_listing_position" ON "listing_categories" ("listing_id", "position" ASC, "category" ASC);

CREATE TABLE IF NOT EXISTS "listing_photos" (
  "id" text PRIMARY KEY NOT NULL,
  "listing_id" text NOT NULL,
  "storage_key" text,
  "file_url" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_listing_photos_listing_position" ON "listing_photos" ("listing_id", "position" ASC, "id" ASC);

CREATE TABLE IF NOT EXISTS "listing_exchange_methods" (
  "id" text PRIMARY KEY NOT NULL,
  "listing_id" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "method" text NOT NULL,
  "pickup_location" text,
  "meetup_zone" text,
  "meetup_other" text,
  "available_time" text
);

CREATE INDEX IF NOT EXISTS "idx_listing_exchange_methods_listing_position" ON "listing_exchange_methods" ("listing_id", "position" ASC, "id" ASC);

DO $$ BEGIN
 ALTER TABLE "sessions"
  ADD CONSTRAINT "sessions_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "listings"
  ADD CONSTRAINT "listings_seller_id_users_id_fk"
  FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE SET NULL;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "listing_categories"
  ADD CONSTRAINT "listing_categories_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "listing_photos"
  ADD CONSTRAINT "listing_photos_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "listing_exchange_methods"
  ADD CONSTRAINT "listing_exchange_methods_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
