import { pgTable, uuid, decimal, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { loans } from "./loans";
import { fines } from "./fines";
import { members } from "./members";
import { users } from "./users";

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "QRIS",
  "TRANSFER",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "LOAN_FEE", // Biaya Sewa/Piutang Peminjaman
  "FINE_PAYMENT", // Pelunasan Denda
]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id")
    .references(() => members.id)
    .notNull(),
  loanId: uuid("loan_id").references(() => loans.id), // Opsional (jika bayar pinjaman spesifik)
  fineId: uuid("fine_id").references(() => fines.id), // Opsional (jika bayar denda spesifik)
  processedBy: uuid("processed_by")
    .references(() => users.id)
    .notNull(),
  type: paymentTypeEnum("type").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("CASH").notNull(),

  amountToPay: decimal("amount_to_pay", { precision: 12, scale: 2 }).notNull(), // Sisa Piutang/Tagihan saat itu
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull(), // Nominal uang yang diterima
  appliedAmount: decimal("applied_amount", {
    precision: 12,
    scale: 2,
  }).notNull(), // Nominal yang dipotongkan ke piutang
  changeAmount: decimal("change_amount", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(), // Kembalian

  paidAt: timestamp("paid_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
