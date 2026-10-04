import { pgTable, uuid, varchar, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const roomStatusEnum = pgEnum("room_status", ["ACTIVE", "INACTIVE"]);

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: roomStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
