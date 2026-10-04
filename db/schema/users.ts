import {
  pgTable,
  uuid,
  varchar,
  text,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["OWNER", "STAFF"]);
export const statusEnum = pgEnum("user_status", ["ACTIVE", "INACTIVE"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").default("STAFF").notNull(),
  status: statusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
