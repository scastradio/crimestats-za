-- SA Crime Statistics Schema

-- Police stations
CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  cluster TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suburb to station mapping (crowd-sourced)
CREATE TABLE IF NOT EXISTS suburb_station (
  id SERIAL PRIMARY KEY,
  suburb TEXT NOT NULL,
  city TEXT,
  province TEXT,
  station_code TEXT REFERENCES stations(code),
  UNIQUE(suburb, station_code)
);

-- Crime categories
CREATE TABLE IF NOT EXISTS crime_categories (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  group_name TEXT NOT NULL  -- 'contact', 'property', 'sexual', etc.
);

-- Crime stats per station per quarter
CREATE TABLE IF NOT EXISTS crime_stats (
  id SERIAL PRIMARY KEY,
  station_code TEXT NOT NULL REFERENCES stations(code),
  category_code TEXT NOT NULL REFERENCES crime_categories(code),
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(station_code, category_code, year, quarter)
);

-- Quarterly trend summary per station (materialised for fast queries)
CREATE TABLE IF NOT EXISTS station_trends (
  id SERIAL PRIMARY KEY,
  station_code TEXT NOT NULL REFERENCES stations(code),
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  total_crimes INTEGER NOT NULL DEFAULT 0,
  pct_change_yoy NUMERIC,  -- year-over-year % change
  pct_change_qoq NUMERIC,  -- quarter-over-quarter % change
  rank_national INTEGER,   -- rank among all stations (1 = highest crime)
  rank_province INTEGER,
  UNIQUE(station_code, year, quarter)
);

-- Alert subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  station_code TEXT REFERENCES stations(code),
  suburb TEXT,
  alert_threshold INTEGER DEFAULT 10, -- % change to trigger alert
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, station_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crime_stats_station ON crime_stats(station_code);
CREATE INDEX IF NOT EXISTS idx_crime_stats_period ON crime_stats(year, quarter);
CREATE INDEX IF NOT EXISTS idx_station_trends_station ON station_trends(station_code);
CREATE INDEX IF NOT EXISTS idx_suburb_station_suburb ON suburb_station(suburb);

-- Enable RLS
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crime_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE suburb_station ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read stations" ON stations FOR SELECT USING (true);
CREATE POLICY "Public read crime_stats" ON crime_stats FOR SELECT USING (true);
CREATE POLICY "Public read station_trends" ON station_trends FOR SELECT USING (true);
CREATE POLICY "Public read suburb_station" ON suburb_station FOR SELECT USING (true);
CREATE POLICY "Public insert subscriptions" ON subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own subscription" ON subscriptions FOR SELECT USING (true);
