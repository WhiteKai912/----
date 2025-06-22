-- Создание таблицы жанров
CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Добавление базовых жанров, если их нет
INSERT INTO genres (name)
VALUES 
  ('Поп'),
  ('Рок'),
  ('Хип-хоп'),
  ('Электронная музыка'),
  ('Классическая музыка'),
  ('Джаз'),
  ('Блюз'),
  ('R&B'),
  ('Фолк'),
  ('Кантри')
ON CONFLICT (name) DO NOTHING; 