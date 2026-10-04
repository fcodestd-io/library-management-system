import {
  pgTable,
  uuid,
  decimal,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const librarySettings = pgTable("library_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  loanPricePerDay: decimal("loan_price_per_day", {
    precision: 10,
    scale: 2,
  }).notNull(),
  maximumLoanDays: integer("maximum_loan_days").notNull(),
  maximumActiveLoans: integer("maximum_active_loans").notNull(),
  dailyFineRate: decimal("daily_fine_rate", {
    precision: 10,
    scale: 2,
  }).notNull(),
  damageCompensationRate: decimal("damage_compensation_rate", {
    precision: 5,
    scale: 2,
  }).notNull(),
  lostBookCompensationRate: decimal("lost_book_compensation_rate", {
    precision: 5,
    scale: 2,
  }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
