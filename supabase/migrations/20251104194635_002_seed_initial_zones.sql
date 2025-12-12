/*
  # Seed Initial Zones Data

  Populates the zones table with the event zones from the Echoplex system.
  Each zone includes capacity, location, entrances, and QR code metadata.
*/

-- Insert initial zones
INSERT INTO zones (id, name, capacity, location, entrances, qr_code_data, created_at, updated_at)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440000'::UUID,
    'Main Stage',
    25000,
    'Central Arena',
    ARRAY['North Gate', 'South Gate', 'VIP Entrance'],
    jsonb_build_object(
      'type', 'echoplex_zone',
      'zoneId', 'main_stage',
      'zoneName', 'Main Stage',
      'version', '1.0'
    ),
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001'::UUID,
    'Food Court',
    8000,
    'East Wing',
    ARRAY['East Gate', 'Food Court Bridge'],
    jsonb_build_object(
      'type', 'echoplex_zone',
      'zoneId', 'food_court',
      'zoneName', 'Food Court',
      'version', '1.0'
    ),
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002'::UUID,
    'West Gate',
    5000,
    'West Entrance',
    ARRAY['West Gate Main', 'West Gate Secondary'],
    jsonb_build_object(
      'type', 'echoplex_zone',
      'zoneId', 'west_gate',
      'zoneName', 'West Gate',
      'version', '1.0'
    ),
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003'::UUID,
    'VIP Area',
    1000,
    'Premium Section',
    ARRAY['VIP Entrance', 'VIP Lounge'],
    jsonb_build_object(
      'type', 'echoplex_zone',
      'zoneId', 'vip_area',
      'zoneName', 'VIP Area',
      'version', '1.0'
    ),
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004'::UUID,
    'Parking Lot A',
    3000,
    'North Parking',
    ARRAY['Parking Entry A1', 'Parking Entry A2'],
    jsonb_build_object(
      'type', 'echoplex_zone',
      'zoneId', 'parking_lot_a',
      'zoneName', 'Parking Lot A',
      'version', '1.0'
    ),
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005'::UUID,
    'Emergency Exit 1',
    2000,
    'South Emergency',
    ARRAY['Emergency Exit 1'],
    jsonb_build_object(
      'type', 'echoplex_zone',
      'zoneId', 'emergency_exit_1',
      'zoneName', 'Emergency Exit 1',
      'version', '1.0'
    ),
    now(),
    now()
  )
ON CONFLICT DO NOTHING;

-- Initialize zone_current_state for all zones
INSERT INTO zone_current_state (zone_id, current_attendees, risk_level, percent_full, active_user_ids, updated_at)
SELECT id, 0, 'LOW', 0, ARRAY[]::TEXT[], now()
FROM zones
ON CONFLICT (zone_id) DO NOTHING;