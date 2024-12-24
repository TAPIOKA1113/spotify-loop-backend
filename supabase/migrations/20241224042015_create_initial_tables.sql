-- ユーザーテーブル
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,     -- Spotify User ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at timestamptz default now()
);

-- プレイリストテーブル
CREATE TABLE playlists (
    id VARCHAR(255) PRIMARY KEY,     -- UUID
    user_id VARCHAR(255) NOT NULL,   -- 作成者のSpotify User ID
    name VARCHAR(255) NOT NULL,
    created_at timestamptz default now(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- トラックテーブル
CREATE TABLE tracks (
    id VARCHAR(255) PRIMARY KEY,     -- UUID
    spotify_track_id VARCHAR(255) NOT NULL,  -- Spotify Track ID
    name VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    cover_url TEXT NOT NULL,
    created_at timestamptz default now()
);

-- プレイリスト・トラック関連テーブル
CREATE TABLE playlist_tracks (
    id VARCHAR(255) PRIMARY KEY,     -- UUID
    playlist_id VARCHAR(255) NOT NULL,
    track_id VARCHAR(255) NOT NULL,
    start_time INTEGER NOT NULL DEFAULT 0,  -- ミリ秒
    end_time INTEGER NOT NULL,              -- ミリ秒
    position INTEGER NOT NULL,              -- トラックの順序
    created_at timestamptz default now(),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(id),
    UNIQUE (playlist_id, position)
);
