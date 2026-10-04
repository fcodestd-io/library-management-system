import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const memberTypeEnum = pgEnum("member_type", [
  "STUDENT",
  "LECTURER",
  "STAFF",
]);
export const memberStatusEnum = pgEnum("member_status", ["ACTIVE", "INACTIVE"]);

export const members = pgTable("members", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberCode: varchar("member_code", { length: 50 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  memberType: memberTypeEnum("member_type").notNull(),
  registeredAt: date("registered_at").notNull(),
  status: memberStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
