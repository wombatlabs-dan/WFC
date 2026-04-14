import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  venueId: integer("venue_id").notNull().references(() => venuesTable.id),
  visitedAt: text("visited_at").notNull(),
  workedOn: text("worked_on"),
  accomplished: text("accomplished"),
  whoSaw: text("who_saw"),
  coffeeNotes: text("coffee_notes"),
});

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true });
export const selectVisitSchema = createSelectSchema(visitsTable);
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;
