import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const venuesTable = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  neighborhood: text("neighborhood"),
  address: text("address"),
  category: text("category").notNull(),
  tags: text("tags").default("[]"),
  workRating: integer("work_rating").default(3),
  coffeeRating: integer("coffee_rating").default(3),
  hours: text("hours"),
  mapsUrl: text("maps_url"),
  sourceUrl: text("source_url"),
  status: text("status").default("active"),
  dateAdded: text("date_added"),
  visitCount: integer("visit_count").default(0),
  lastVisited: text("last_visited"),
  notes: text("notes"),
});

export const insertVenueSchema = createInsertSchema(venuesTable).omit({ id: true });
export const selectVenueSchema = createSelectSchema(venuesTable);
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venuesTable.$inferSelect;
