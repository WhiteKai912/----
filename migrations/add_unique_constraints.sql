-- Добавляем уникальное ограничение для имени исполнителя
ALTER TABLE artists
ADD CONSTRAINT artists_name_unique UNIQUE (name);
 
-- Добавляем уникальное ограничение для комбинации названия альбома и исполнителя
ALTER TABLE albums
ADD CONSTRAINT albums_title_artist_unique UNIQUE (title, artist_id); 