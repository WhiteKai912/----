import { sql } from "drizzle-orm"
import { text, integer, boolean, timestamp, pgTable } from "drizzle-orm/pg-core"

export const playlists = pgTable("playlists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  is_public: boolean("is_public").notNull().default(false),
  user_id: text("user_id").notNull(),
  cover_data: text("cover_data"),
  cover_type: text("cover_type"),
  created_at: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const tracks = pgTable("tracks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  duration: integer("duration").notNull(),
  url: text("url").notNull(),
  genre: text("genre"),
  year: integer("year"),
  cover_data: text("cover_data"),
  cover_type: text("cover_type"),
  created_at: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const playlist_tracks = pgTable("playlist_tracks", {
  playlist_id: text("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  track_id: text("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  created_at: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}) 