import { pgTable, text, bigint, integer, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const folders = pgTable("folders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const decks = pgTable("decks", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  folderId: text("folder_id").references(() => folders.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const cards = pgTable("cards", {
  id: text("id").primaryKey(),
  deckId: text("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  srInterval: integer("sr_interval").notNull().default(0),
  srEaseFactor: real("sr_ease_factor").notNull().default(2.5),
  srRepetitions: integer("sr_repetitions").notNull().default(0),
  srNextReview: bigint("sr_next_review", { mode: "number" }).notNull(),
  srLastReview: bigint("sr_last_review", { mode: "number" }),
  termLang: text("term_lang"),
  defLang: text("def_lang"),
});
