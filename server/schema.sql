-- Water tracking
CREATE TABLE IF NOT EXISTS water_entries (
  id SERIAL PRIMARY KEY,
  volume_ml INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meals and food tracking
CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
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
  title VARCHAR(256) NOT NULL,
  notes TEXT,
  done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Productivity calendar events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_water_entries_timestamp ON water_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_meals_timestamp ON meals(timestamp);
CREATE INDEX IF NOT EXISTS idx_food_entries_timestamp ON food_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_splits_created_at ON splits(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_events_date_time ON events(event_date, event_time);
