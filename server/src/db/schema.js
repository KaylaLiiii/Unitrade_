import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  profilePhotoUrl: text("profile_photo_url"),
  preferredContactsJson: jsonb("preferred_contacts_json").notNull().default({}),
  bio: text("bio").notNull().default(""),
  isUcsdVerified: boolean("is_ucsd_verified").notNull().default(false),
  ucsdEmail: text("ucsd_email"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailUnique: uniqueIndex("users_email_unique").on(table.email),
}));

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_sessions_user_id").on(table.userId),
  expiresAtIdx: index("idx_sessions_expires_at").on(table.expiresAt),
}));

export const listings = pgTable("listings", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  condition: text("condition").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("available"),
  sellerId: text("seller_id").references(() => users.id, { onDelete: "set null" }),
  sellerEmailSnapshot: text("seller_email_snapshot").notNull(),
  sellerNameSnapshot: text("seller_name_snapshot").notNull(),
  sellerPhotoSnapshot: text("seller_photo_snapshot"),
  sellerIsUcsdVerifiedSnapshot: boolean("seller_is_ucsd_verified_snapshot").notNull().default(false),
  sellerBioSnapshot: text("seller_bio_snapshot"),
  sellerContactsSnapshot: jsonb("seller_contacts_snapshot").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  sellerIdIdx: index("idx_listings_seller_id").on(table.sellerId),
  deletedCreatedIdx: index("idx_listings_deleted_created").on(table.deletedAt, table.createdAt.desc(), table.id.desc()),
  deletedUpdatedIdx: index("idx_listings_deleted_updated").on(table.deletedAt, table.updatedAt.desc(), table.id.desc()),
  deletedStatusCreatedIdx: index("idx_listings_deleted_status_created").on(table.deletedAt, table.status, table.createdAt.desc(), table.id.desc()),
  deletedSellerCreatedIdx: index("idx_listings_deleted_seller_created").on(table.deletedAt, table.sellerEmailSnapshot, table.createdAt.desc(), table.id.desc()),
}));

export const listingCategories = pgTable("listing_categories", {
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  position: integer("position").notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.listingId, table.category], name: "listing_categories_pk" }),
  listingPositionIdx: index("idx_listing_categories_listing_position").on(table.listingId, table.position.asc(), table.category.asc()),
}));

export const listingPhotos = pgTable("listing_photos", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  storageKey: text("storage_key"),
  fileUrl: text("file_url").notNull(),
  position: integer("position").notNull().default(0),
}, (table) => ({
  listingPositionIdx: index("idx_listing_photos_listing_position").on(table.listingId, table.position.asc(), table.id.asc()),
}));

export const listingExchangeMethods = pgTable("listing_exchange_methods", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  method: text("method").notNull(),
  pickupLocation: text("pickup_location"),
  meetupZone: text("meetup_zone"),
  meetupOther: text("meetup_other"),
  availableTime: text("available_time"),
}, (table) => ({
  listingPositionIdx: index("idx_listing_exchange_methods_listing_position").on(table.listingId, table.position.asc(), table.id.asc()),
}));

export const savedListings = pgTable("saved_listings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_saved_listings_user_id").on(table.userId),
  listingIdIdx: index("idx_saved_listings_listing_id").on(table.listingId),
  userListingUnique: uniqueIndex("saved_listings_user_listing_unique").on(table.userId, table.listingId),
}));

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId: text("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: text("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingTitleSnapshot: text("listing_title_snapshot").notNull(),
  buyerEmailSnapshot: text("buyer_email_snapshot").notNull(),
  buyerNameSnapshot: text("buyer_name_snapshot").notNull(),
  buyerPhotoSnapshot: text("buyer_photo_snapshot"),
  buyerIsUcsdVerifiedSnapshot: boolean("buyer_is_ucsd_verified_snapshot").notNull().default(false),
  sellerEmailSnapshot: text("seller_email_snapshot").notNull(),
  sellerNameSnapshot: text("seller_name_snapshot").notNull(),
  sellerPhotoSnapshot: text("seller_photo_snapshot"),
  sellerIsUcsdVerifiedSnapshot: boolean("seller_is_ucsd_verified_snapshot").notNull().default(false),
  lastMessage: text("last_message").notNull().default(""),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  hiddenByBuyer: boolean("hidden_by_buyer").notNull().default(false),
  hiddenBySeller: boolean("hidden_by_seller").notNull().default(false),
  unreadForBuyer: integer("unread_for_buyer").notNull().default(0),
  unreadForSeller: integer("unread_for_seller").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  listingBuyerSellerUnique: uniqueIndex("conversations_listing_buyer_seller_unique").on(table.listingId, table.buyerId, table.sellerId),
  buyerUpdatedIdx: index("idx_conversations_buyer_updated").on(table.buyerId, table.updatedAt.desc(), table.id.desc()),
  sellerUpdatedIdx: index("idx_conversations_seller_updated").on(table.sellerId, table.updatedAt.desc(), table.id.desc()),
}));

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderEmailSnapshot: text("sender_email_snapshot").notNull(),
  senderNameSnapshot: text("sender_name_snapshot").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
}, (table) => ({
  conversationCreatedIdx: index("idx_messages_conversation_created").on(table.conversationId, table.createdAt.asc(), table.id.asc()),
  conversationReadIdx: index("idx_messages_conversation_read").on(table.conversationId, table.readAt, table.createdAt.asc(), table.id.asc()),
}));

export const ucsdVerifications = pgTable("ucsd_verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  sendsThisHour: integer("sends_this_hour").notNull().default(0),
  sendsToday: integer("sends_today").notNull().default(0),
  hourWindowStart: timestamp("hour_window_start", { withTimezone: true }),
  dayWindowStart: timestamp("day_window_start", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userUnique: uniqueIndex("ucsd_verifications_user_unique").on(table.userId),
  emailIdx: index("idx_ucsd_verifications_email").on(table.email),
}));
