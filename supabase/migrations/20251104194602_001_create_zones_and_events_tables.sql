/*
  # Echoplex Zone Intelligence System - Database Schema

  1. New Tables
    - `zones` - Event zones/areas with capacity and metadata
      - `id` (uuid, primary key)
      - `name` (text) - Zone display name
      - `capacity` (integer) - Maximum attendees
      - `location` (text) - Physical location description
      - `entrances` (text array) - Zone entrance points
      - `qr_code_data` (jsonb) - QR code metadata
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `zone_events` - Check-in/check-out events
      - `id` (uuid, primary key)
      - `user_id` (text) - User identifier
      - `zone_id` (uuid, foreign key to zones)
      - `action` (text) - 'check-in' or 'check-out'
      - `timestamp` (timestamp) - Event time
      - `created_at` (timestamp)
    
    - `zone_current_state` - Real-time zone occupancy tracking
      - `zone_id` (uuid, primary key, foreign key to zones)
      - `current_attendees` (integer) - Current occupancy
      - `risk_level` (text) - 'LOW', 'MEDIUM', 'HIGH'
      - `percent_full` (integer) - Percentage of capacity
      - `active_user_ids` (text array) - Currently checked-in users
      - `updated_at` (timestamp)
    
    - `users` - User session tracking
      - `id` (text, primary key) - User identifier
      - `current_zone_id` (uuid, foreign key to zones)
      - `last_check_in_time` (timestamp)
      - `check_in_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Indexes for Performance
    - Index on zone_events(zone_id, timestamp) for event queries
    - Index on zone_events(user_id, timestamp) for user history
    - Index on zone_current_state for real-time lookups

  3. Security
    - Enable RLS on all tables
    - Public read access for zone information
    - Public read access for aggregated zone state
    - Public write access for zone events (rate limited at API layer)
    - Public read access for user state

  4. Notes
    - zone_current_state is updated by database triggers
    - Risk level calculated as: HIGH >= 95%, MEDIUM >= 80%, LOW < 80%
    - All times stored in UTC
*/

-- Create zones table
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1000,
  location TEXT NOT NULL,
  entrances TEXT[] DEFAULT ARRAY[]::TEXT[],
  qr_code_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create zone_events table
CREATE TABLE IF NOT EXISTS zone_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('check-in', 'check-out')),
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create zone_current_state table for real-time occupancy tracking
CREATE TABLE IF NOT EXISTS zone_current_state (
  zone_id UUID PRIMARY KEY REFERENCES zones(id) ON DELETE CASCADE,
  current_attendees INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  percent_full INTEGER DEFAULT 0,
  active_user_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create users table for session tracking
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  current_zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  last_check_in_time TIMESTAMPTZ,
  check_in_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zone_events_zone_timestamp 
  ON zone_events(zone_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_zone_events_user_timestamp 
  ON zone_events(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_users_current_zone 
  ON users(current_zone_id);

-- Enable RLS on all tables
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_current_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zones table (public read-only)
CREATE POLICY "zones_public_read"
  ON zones FOR SELECT
  TO public
  USING (true);

-- RLS Policies for zone_events table (public read/write)
CREATE POLICY "zone_events_public_read"
  ON zone_events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "zone_events_public_insert"
  ON zone_events FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for zone_current_state table (public read-only)
CREATE POLICY "zone_current_state_public_read"
  ON zone_current_state FOR SELECT
  TO public
  USING (true);

-- RLS Policies for users table (public read/write)
CREATE POLICY "users_public_read"
  ON users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "users_public_insert"
  ON users FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "users_public_update"
  ON users FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Function to calculate risk level
CREATE OR REPLACE FUNCTION calculate_risk_level(current_attendees INT, capacity INT)
RETURNS TEXT AS $$
BEGIN
  IF (current_attendees::FLOAT / capacity) >= 0.95 THEN
    RETURN 'HIGH';
  ELSIF (current_attendees::FLOAT / capacity) >= 0.80 THEN
    RETURN 'MEDIUM';
  ELSE
    RETURN 'LOW';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update zone state after zone_events insert
CREATE OR REPLACE FUNCTION update_zone_state()
RETURNS TRIGGER AS $$
DECLARE
  v_current_attendees INT;
  v_capacity INT;
  v_active_users TEXT[];
BEGIN
  -- Get zone capacity
  SELECT capacity INTO v_capacity FROM zones WHERE id = NEW.zone_id;
  
  -- Get active user IDs (users currently checked in to this zone)
  SELECT ARRAY_AGG(DISTINCT user_id) INTO v_active_users
  FROM (
    SELECT user_id FROM zone_events
    WHERE zone_id = NEW.zone_id
    AND action = 'check-in'
    EXCEPT
    SELECT user_id FROM zone_events
    WHERE zone_id = NEW.zone_id
    AND action = 'check-out'
  ) AS active;
  
  -- Count current attendees
  v_current_attendees := ARRAY_LENGTH(v_active_users, 1);
  IF v_current_attendees IS NULL THEN
    v_current_attendees := 0;
  END IF;
  
  -- Update or insert zone_current_state
  INSERT INTO zone_current_state (zone_id, current_attendees, risk_level, percent_full, active_user_ids, updated_at)
  VALUES (
    NEW.zone_id,
    v_current_attendees,
    calculate_risk_level(v_current_attendees, v_capacity),
    CASE WHEN v_capacity > 0 THEN (v_current_attendees::FLOAT / v_capacity * 100)::INT ELSE 0 END,
    v_active_users,
    now()
  )
  ON CONFLICT (zone_id) DO UPDATE SET
    current_attendees = v_current_attendees,
    risk_level = calculate_risk_level(v_current_attendees, v_capacity),
    percent_full = CASE WHEN v_capacity > 0 THEN (v_current_attendees::FLOAT / v_capacity * 100)::INT ELSE 0 END,
    active_user_ids = v_active_users,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update zone state after zone_events insert
DROP TRIGGER IF EXISTS trg_update_zone_state ON zone_events;
CREATE TRIGGER trg_update_zone_state
AFTER INSERT ON zone_events
FOR EACH ROW
EXECUTE FUNCTION update_zone_state();

-- Function to update user state after zone_events insert
CREATE OR REPLACE FUNCTION update_user_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'check-in' THEN
    INSERT INTO users (id, current_zone_id, last_check_in_time, check_in_count, created_at, updated_at)
    VALUES (NEW.user_id, NEW.zone_id, NEW.timestamp, 1, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      current_zone_id = NEW.zone_id,
      last_check_in_time = NEW.timestamp,
      check_in_count = users.check_in_count + 1,
      updated_at = now();
  ELSIF NEW.action = 'check-out' THEN
    UPDATE users
    SET current_zone_id = NULL, updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user state after zone_events insert
DROP TRIGGER IF EXISTS trg_update_user_state ON zone_events;
CREATE TRIGGER trg_update_user_state
AFTER INSERT ON zone_events
FOR EACH ROW
EXECUTE FUNCTION update_user_state();