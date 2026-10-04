import { pgTable, uuid, pgEnum, timestamp, decimal } from "drizzle-orm/pg-core";
import { members } from "./members";
import { bookCopies, copyConditionEnum } from "./book-copies";
import { users } from "./users";

export const loanStatusEnum = pgEnum("loan_status", [
  "BORROWED",
  "OVERDUE",
  "RETURNED",
]);

export const loans = pgTable("loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  bookCopyId: uuid("book_copy_id")
    .references(() => bookCopies.id)
    .notNull(),
  processedBy: uuid("processed_by")
    .references(() => users.id)
    .notNull(),
  returnedProcessedBy: uuid("returned_processed_by").references(() => users.id),
  borrowedAt: timestamp("borrowed_at").notNull(),
  dueAt: timestamp("due_at").notNull(),
  returnedAt: timestamp("returned_at"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(), // Kolom Baru: Sisa Piutang Sewa Peminjaman
  status: loanStatusEnum("status").notNull(),
  returnCondition: copyConditionEnum("return_condition"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
