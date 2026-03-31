CREATE TABLE IF NOT EXISTS "conversations" (
  "id" text PRIMARY KEY NOT NULL,
  "listing_id" text NOT NULL,
  "buyer_id" text NOT NULL,
  "seller_id" text NOT NULL,
  "listing_title_snapshot" text NOT NULL,
  "buyer_email_snapshot" text NOT NULL,
  "buyer_name_snapshot" text NOT NULL,
  "buyer_photo_snapshot" text,
  "buyer_is_ucsd_verified_snapshot" boolean DEFAULT false NOT NULL,
  "seller_email_snapshot" text NOT NULL,
  "seller_name_snapshot" text NOT NULL,
  "seller_photo_snapshot" text,
  "seller_is_ucsd_verified_snapshot" boolean DEFAULT false NOT NULL,
  "last_message" text DEFAULT '' NOT NULL,
  "last_message_at" timestamptz,
  "hidden_by_buyer" boolean DEFAULT false NOT NULL,
  "hidden_by_seller" boolean DEFAULT false NOT NULL,
  "unread_for_buyer" integer DEFAULT 0 NOT NULL,
  "unread_for_seller" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversations_listing_buyer_seller_unique" ON "conversations" ("listing_id", "buyer_id", "seller_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_buyer_updated" ON "conversations" ("buyer_id", "updated_at" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "idx_conversations_seller_updated" ON "conversations" ("seller_id", "updated_at" DESC, "id" DESC);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" text PRIMARY KEY NOT NULL,
  "conversation_id" text NOT NULL,
  "sender_id" text NOT NULL,
  "sender_email_snapshot" text NOT NULL,
  "sender_name_snapshot" text NOT NULL,
  "text" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "read_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "idx_messages_conversation_created" ON "messages" ("conversation_id", "created_at" ASC, "id" ASC);
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_read" ON "messages" ("conversation_id", "read_at", "created_at" ASC, "id" ASC);

DO $$ BEGIN
 ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_listing_id_listings_id_fk"
  FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_buyer_id_users_id_fk"
  FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_seller_id_users_id_fk"
  FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "messages"
  ADD CONSTRAINT "messages_conversation_id_conversations_id_fk"
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "messages"
  ADD CONSTRAINT "messages_sender_id_users_id_fk"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
