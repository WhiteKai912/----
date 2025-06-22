-- Добавляем поля для хранения обложки
ALTER TABLE tracks 
ADD COLUMN cover_data TEXT,
ADD COLUMN cover_type VARCHAR(255),
ADD COLUMN cover_version BIGINT; 