CREATE TABLE "venues" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"neighborhood" text,
	"address" text,
	"category" text NOT NULL,
	"tags" text DEFAULT '[]',
	"work_rating" integer DEFAULT 3,
	"coffee_rating" integer DEFAULT 3,
	"hours" text,
	"maps_url" text,
	"source_url" text,
	"status" text DEFAULT 'active',
	"date_added" text,
	"visit_count" integer DEFAULT 0,
	"last_visited" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"venue_id" integer NOT NULL,
	"visited_at" text NOT NULL,
	"worked_on" text,
	"accomplished" text,
	"who_saw" text,
	"coffee_notes" text
);
--> statement-breakpoint
CREATE TABLE "discovery_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"neighborhood" text,
	"source_url" text,
	"discovered_at" text NOT NULL,
	"status" text DEFAULT 'pending'
);
--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;