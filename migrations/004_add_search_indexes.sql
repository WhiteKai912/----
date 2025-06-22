-- Создаем индексы для полнотекстового поиска треков
CREATE INDEX idx_tracks_title_tsv ON tracks USING gin(to_tsvector('russian', title));
CREATE INDEX idx_artists_name_tsv ON artists USING gin(to_tsvector('russian', name));
CREATE INDEX idx_albums_title_tsv ON albums USING gin(to_tsvector('russian', title));
CREATE INDEX idx_genres_name_tsv ON genres USING gin(to_tsvector('russian', name));
 
-- Создаем индексы для полнотекстового поиска плейлистов
CREATE INDEX idx_playlists_name_tsv ON playlists USING gin(to_tsvector('russian', name));
CREATE INDEX idx_playlists_description_tsv ON playlists USING gin(to_tsvector('russian', coalesce(description, '')));
CREATE INDEX idx_users_name_tsv ON users USING gin(to_tsvector('russian', coalesce(name, ''))); 