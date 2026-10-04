import {
  pgTable,
  uuid,
  varchar,
  decimal,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const bookStatusEnum = pgEnum("book_status", ["ACTIVE", "INACTIVE"]);

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .references(() => categories.id)
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 50 }).unique(),
  bookValue: decimal("book_value", { precision: 10, scale: 2 }).notNull(),
  status: bookStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
