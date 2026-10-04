import { pgTable, uuid, decimal, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { loans } from "./loans";

export const fineReasonEnum = pgEnum("fine_reason", [
  "OVERDUE",
  "DAMAGE",
  "LOST",
]);
export const fineStatusEnum = pgEnum("fine_status", [
  "UNPAID",
  "PAID",
  "WAIVED",
]);

export const fines = pgTable("fines", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanId: uuid("loan_id")
    .references(() => loans.id)
    .notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  reason: fineReasonEnum("reason").notNull(),
  status: fineStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
