-- Добавляем поле версии для обложек
ALTER TABLE tracks 
ADD COLUMN cover_version BIGINT; 