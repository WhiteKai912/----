-- Создаем таблицу истории прослушиваний
CREATE TABLE IF NOT EXISTS play_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    played_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создаем таблицу истории скачиваний
CREATE TABLE IF NOT EXISTS download_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS play_history_user_id_idx ON play_history(user_id);
CREATE INDEX IF NOT EXISTS play_history_track_id_idx ON play_history(track_id);
CREATE INDEX IF NOT EXISTS play_history_played_at_idx ON play_history(played_at);

CREATE INDEX IF NOT EXISTS download_history_user_id_idx ON download_history(user_id);
CREATE INDEX IF NOT EXISTS download_history_track_id_idx ON download_history(track_id);
CREATE INDEX IF NOT EXISTS download_history_downloaded_at_idx ON download_history(downloaded_at); 