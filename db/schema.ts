import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const reservations = sqliteTable(
  "reservations",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    table_id: text("table_id").notNull(),
    day: text("day").notNull(),
    hour: integer("hour").notNull(),
    guests: integer("guests").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull().default("confirmed"),
    source: text("source").notNull().default("guest"),
    spend: integer("spend").notNull().default(0),
  },
  (t) => [
    index("idx_reservations_owner_day_table").on(t.owner, t.day, t.table_id),
  ],
);
export const seededDays = sqliteTable("seeded_days", {
  id: text("id").primaryKey(),
});
