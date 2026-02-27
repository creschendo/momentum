-- Water tracking
CREATE TABLE IF NOT EXISTS water_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  volume_ml INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meals and food tracking
CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  name VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meal_foods (
  id SERIAL PRIMARY KEY,
  meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_name VARCHAR(255),
  calories INTEGER,
  protein FLOAT,
  carbs FLOAT,
  fat FLOAT
);

CREATE TABLE IF NOT EXISTS food_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  food_name VARCHAR(255) NOT NULL,
  calories INTEGER,
  protein FLOAT,
  carbs FLOAT,
  fat FLOAT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fitness splits
CREATE TABLE IF NOT EXISTS splits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  days_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS split_days (
  id SERIAL PRIMARY KEY,
  split_id INTEGER NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
  day_number INTEGER,
  day_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lifts (
  id SERIAL PRIMARY KEY,
  day_id INTEGER NOT NULL REFERENCES split_days(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255),
  sets INTEGER,
  reps VARCHAR(50),
  weight FLOAT
);

CREATE TABLE IF NOT EXISTS cardio (
  id SERIAL PRIMARY KEY,
  day_id INTEGER NOT NULL REFERENCES split_days(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255),
  duration_minutes INTEGER,
  intensity VARCHAR(50)
);

-- Productivity tasks
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  title VARCHAR(256) NOT NULL,
  notes TEXT,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Productivity calendar events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  title VARCHAR(256) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backfill safety for existing databases (idempotent)
ALTER TABLE water_entries ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE meals ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE splits ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_water_entries_timestamp ON water_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_water_entries_user_timestamp ON water_entries(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_meals_timestamp ON meals(timestamp);
CREATE INDEX IF NOT EXISTS idx_meals_user_timestamp ON meals(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_food_entries_timestamp ON food_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_timestamp ON food_entries(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_splits_created_at ON splits(created_at);
CREATE INDEX IF NOT EXISTS idx_splits_user_created_at ON splits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_created_at ON tasks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date_time ON events(event_date, event_time);
CREATE INDEX IF NOT EXISTS idx_events_user_date_time ON events(user_id, event_date, event_time);

-- Accounts and sessions
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address VARCHAR(64),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Body weight tracking
CREATE TABLE IF NOT EXISTS weight_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg NUMERIC(6,2) NOT NULL,
  entry_date DATE NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_weight_entries_created_at ON weight_entries(created_at);

-- Sleep tracking
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  quality SMALLINT NOT NULL DEFAULT 3 CHECK (quality >= 1 AND quality <= 5),
  notes VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sleep_sessions_user_start ON sleep_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_sessions_created_at ON sleep_sessions(created_at);
