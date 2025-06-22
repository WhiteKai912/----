-- Add cover fields to playlists table
ALTER TABLE playlists
ADD COLUMN cover_data TEXT,
ADD COLUMN cover_type TEXT;

-- Add cover fields to tracks table
ALTER TABLE tracks
ADD COLUMN cover_data TEXT,
ADD COLUMN cover_type TEXT; 