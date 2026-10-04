import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { books } from "./books";
import { racks } from "./racks";

export const copyConditionEnum = pgEnum("copy_condition", [
  "GOOD",
  "DAMAGED",
  "LOST",
]);
export const copyStatusEnum = pgEnum("copy_status", [
  "AVAILABLE",
  "BORROWED",
  "INACTIVE",
]);

export const bookCopies = pgTable("book_copies", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookId: uuid("book_id")
    .references(() => books.id)
    .notNull(),
  inventoryNumber: varchar("inventory_number", { length: 50 })
    .unique()
    .notNull(),
  rackId: uuid("rack_id")
    .references(() => racks.id)
    .notNull(),
  condition: copyConditionEnum("condition").notNull(),
  status: copyStatusEnum("status").notNull(),
  acquiredAt: date("acquired_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
