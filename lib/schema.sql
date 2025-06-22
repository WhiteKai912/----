-- Включаем расширение для UUID и криптографии
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Создаем таблицу пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу жанров
CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу исполнителей
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу альбомов
CREATE TABLE albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist_id UUID REFERENCES artists(id),
    release_date DATE,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу треков
CREATE TABLE tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    artist_id UUID REFERENCES artists(id),
    album_id UUID REFERENCES albums(id),
    genre_id UUID REFERENCES genres(id),
    duration INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    cover_url TEXT,
    plays_count INTEGER NOT NULL DEFAULT 0,
    downloads_count INTEGER NOT NULL DEFAULT 0,
    file_size BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу плейлистов
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id),
    is_public BOOLEAN NOT NULL DEFAULT false,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу треков в плейлистах
CREATE TABLE playlist_tracks (
    playlist_id UUID REFERENCES playlists(id),
    track_id UUID REFERENCES tracks(id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id)
);

-- Создаем таблицу избранных треков
CREATE TABLE user_favorites (
    user_id UUID REFERENCES users(id),
    track_id UUID REFERENCES tracks(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, track_id)
);

-- Создаем таблицу истории прослушиваний
CREATE TABLE play_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    track_id UUID REFERENCES tracks(id),
    played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу истории загрузок
CREATE TABLE download_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    track_id UUID REFERENCES tracks(id),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем тестовые данные
INSERT INTO genres (name) VALUES 
    ('Pop'),
    ('Rock'),
    ('Hip Hop'),
    ('Electronic'),
    ('Classical');

-- Добавляем тестового исполнителя
INSERT INTO artists (name, bio) VALUES 
    ('Test Artist', 'This is a test artist bio');

-- Добавляем тестовый альбом
INSERT INTO albums (title, artist_id, release_date) VALUES 
    ('Test Album', (SELECT id FROM artists LIMIT 1), '2024-01-01');

-- Добавляем тестовые треки
INSERT INTO tracks (title, artist_id, album_id, genre_id, duration, file_url, plays_count) VALUES 
    ('Test Track 1', (SELECT id FROM artists LIMIT 1), (SELECT id FROM albums LIMIT 1), (SELECT id FROM genres LIMIT 1), 180, 'https://example.com/track1.mp3', 100),
    ('Test Track 2', (SELECT id FROM artists LIMIT 1), (SELECT id FROM albums LIMIT 1), (SELECT id FROM genres LIMIT 1), 240, 'https://example.com/track2.mp3', 150); 