import { pgTable, uuid, varchar, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { rooms } from "./rooms";

export const rackStatusEnum = pgEnum("rack_status", ["ACTIVE", "INACTIVE"]);

export const racks = pgTable("racks", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .references(() => rooms.id)
    .notNull(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: rackStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
