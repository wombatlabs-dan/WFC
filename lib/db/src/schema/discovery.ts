import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const discoveryQueueTable = pgTable("discovery_queue", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  neighborhood: text("neighborhood"),
  sourceUrl: text("source_url"),
  discoveredAt: text("discovered_at").notNull(),
  status: text("status").default("pending"),
});

export const insertDiscoverySchema = createInsertSchema(discoveryQueueTable).omit({ id: true });
export const selectDiscoverySchema = createSelectSchema(discoveryQueueTable);
export type InsertDiscovery = z.infer<typeof insertDiscoverySchema>;
export type DiscoveryItem = typeof discoveryQueueTable.$inferSelect;
