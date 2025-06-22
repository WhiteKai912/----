-- Добавляем поля для хранения обложки
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS cover_data TEXT,
ADD COLUMN IF NOT EXISTS cover_type VARCHAR(255); 