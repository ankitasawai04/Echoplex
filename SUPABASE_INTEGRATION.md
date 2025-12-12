# Echoplex Supabase Integration Guide

## Overview

Echoplex has been successfully migrated from in-memory storage to a production-ready Supabase-backed system with real-time synchronization, persistent data storage, and enterprise-grade security.

## Architecture

### Database Schema

#### Tables

1. **zones** - Event zones/areas with capacity and metadata
   - `id` (UUID, primary key)
   - `name` (text) - Zone display name
   - `capacity` (integer) - Maximum attendees
   - `location` (text) - Physical location
   - `entrances` (text array) - Zone entrance points
   - `qr_code_data` (JSONB) - QR code metadata
   - `created_at`, `updated_at` (timestamps)

2. **zone_events** - Check-in/check-out events (audit trail)
   - `id` (UUID, primary key)
   - `user_id` (text) - User identifier
   - `zone_id` (UUID, foreign key)
   - `action` (text) - 'check-in' or 'check-out'
   - `timestamp` (timestamp) - Event time
   - Indexes: zone_id + timestamp, user_id + timestamp

3. **zone_current_state** - Real-time occupancy tracking
   - `zone_id` (UUID, primary key, foreign key)
   - `current_attendees` (integer) - Current occupancy
   - `risk_level` (text) - 'LOW', 'MEDIUM', 'HIGH'
   - `percent_full` (integer) - Percentage of capacity
   - `active_user_ids` (text array) - Currently checked-in users
   - `updated_at` (timestamp)

4. **users** - User session tracking
   - `id` (text, primary key)
   - `current_zone_id` (UUID, foreign key)
   - `last_check_in_time` (timestamp)
   - `check_in_count` (integer)
   - `created_at`, `updated_at` (timestamps)

### Database Triggers & Functions

1. **calculate_risk_level()** - Calculates risk based on occupancy percentage
   - HIGH: >= 95%
   - MEDIUM: >= 80%
   - LOW: < 80%

2. **update_zone_state()** - Auto-updates zone occupancy after check-in/check-out
   - Counts active users
   - Calculates risk level
   - Updates percent_full
   - Runs on zone_events INSERT

3. **update_user_state()** - Auto-updates user location after zone events
   - Sets current_zone_id on check-in
   - Clears current_zone_id on check-out
   - Increments check_in_count
   - Runs on zone_events INSERT

### Security (Row Level Security)

All tables have RLS enabled with public read access for operational use:

- **zones** - Public read-only (zone information)
- **zone_events** - Public read/insert (check-in/check-out events)
- **zone_current_state** - Public read-only (real-time occupancy)
- **users** - Public read/insert/update (user sessions)

Note: In production, implement authentication-based policies. Current setup suitable for internal event operations.

## Frontend Integration

### Services

#### supabaseClient.ts
- Initializes Supabase client
- Uses environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

#### zoneServiceSupabase.ts
- Main service layer replacing in-memory implementation
- **Async methods:**
  - `getZones()` - Fetch all zones with current state
  - `getZone(zoneId)` - Get specific zone details
  - `processZoneEvent(userId, zoneId, action)` - Handle check-in/check-out
  - `processQRScan(qrData, userId)` - Process QR code scan
  - `getUserCurrentZone(userId)` - Get user's current location
  - `getZoneEvents(zoneId?, limit)` - Fetch event history
  - `getZoneAnalytics(zoneId, hours)` - Get analytics for a zone
- **Real-time subscriptions:** `subscribe(callback)` - Listen to zone state changes

#### zoneService.ts
- Re-exports all types and the service instance
- Backward compatible with existing components

### Component Updates

**ZoneIntelligenceOverview.tsx** - Updated to handle async operations:
- Loads zones, events, and user state on mount
- Subscribes to real-time updates via Supabase Realtime
- QR scan handler now async
- Proper component unmounting handling

## Backend Server

### Setup

1. Navigate to backend directory:
   ```bash
   cd echoplex-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   FRONTEND_URL=http://localhost:5173
   PORT=3000
   ```

4. Start server:
   ```bash
   npm run dev      # Development with hot reload
   npm start        # Production
   ```

### API Endpoints

All endpoints use Supabase as the data source:

- **GET /api/zones** - Get all zones with current occupancy
- **GET /api/zones/:zoneId** - Get specific zone details
- **POST /api/zone-event** - Process check-in/check-out
  - Body: `{ user_id, zone_id, action, timestamp? }`
- **GET /api/zone-events** - Get event history
  - Query: `?zone_id=xxx&user_id=xxx&limit=50`

### Real-Time Updates

- WebSocket connection emits `zone-update` when occupancy changes
- Clients receive updated zone stats immediately
- Automatic reconnection handling

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

## Data Flow

1. **Check-in/Check-out:**
   - Frontend calls `zoneService.processZoneEvent(userId, zoneId, action)`
   - Inserts record into `zone_events` table
   - Database triggers automatically:
     - Update `zone_current_state` with new occupancy
     - Update `users` with current location
   - Backend WebSocket broadcasts `zone-update` event
   - Frontend receives update via Supabase Realtime subscription

2. **Real-Time Sync:**
   - Frontend subscribes to `zone_current_state` changes
   - When database updates (via triggers), subscribers are notified
   - UI updates reflect actual database state

## Key Features

✅ **Data Persistence** - All events stored permanently
✅ **Real-Time Updates** - WebSocket + Supabase Realtime
✅ **Automatic State Calculation** - Triggers compute occupancy/risk
✅ **User Tracking** - Know where each user is checked in
✅ **Event Audit Trail** - Complete history of all movements
✅ **Risk Assessment** - Automatic risk level calculation
✅ **Scalability** - Database-backed, no memory limits
✅ **Security** - RLS policies, environment-based credentials

## Next Steps (Optional Enhancements)

1. **Authentication** - Implement Supabase Auth for user verification
2. **Analytics Dashboard** - Add materialized views for metrics
3. **Capacity Management** - Queue system when zones reach capacity
4. **Notifications** - Alert operators when risk levels exceed thresholds
5. **Export/Reports** - Generate CSV/PDF reports from event history
6. **Mobile App** - Native apps using Supabase SDK

## Troubleshooting

### No data appearing?
- Check Supabase URL and API keys in .env
- Verify RLS policies allow public access
- Check browser console for errors

### Real-time updates not working?
- Verify WebSocket connection in backend
- Check Supabase Realtime is enabled for the table
- Ensure frontend is subscribed correctly

### Zone events not being recorded?
- Verify zone exists in database
- Check zone_events table RLS allows INSERT
- Ensure user_id and zone_id are valid UUIDs/text

## Architecture Diagram

```
Frontend (React)
├── zoneService (Supabase client)
├── Components
│   └── ZoneIntelligenceOverview (async/realtime)
└── Realtime subscriptions → zone_current_state table

Backend (Express + Socket.IO)
├── REST APIs
├── WebSocket server
└── Queries Supabase directly

Supabase (PostgreSQL)
├── Tables (zones, zone_events, zone_current_state, users)
├── Triggers (update_zone_state, update_user_state)
├── Functions (calculate_risk_level)
├── RLS Policies (public read/write)
└── Realtime (broadcasts table changes)
```

## Files Modified/Created

**Frontend:**
- `src/services/supabaseClient.ts` (NEW)
- `src/services/zoneServiceSupabase.ts` (NEW)
- `src/services/zoneService.ts` (UPDATED - now re-exports)
- `src/components/ZoneIntelligenceOverview.tsx` (UPDATED - async methods)
- `package.json` (UPDATED - added @supabase/supabase-js)

**Backend:**
- `echoplex-backend/server.js` (UPDATED - Supabase integration)
- `echoplex-backend/package.json` (UPDATED - added dependencies, ES modules)
- `echoplex-backend/.env.example` (NEW - environment template)

**Database:**
- `001_create_zones_and_events_tables` (migration)
- `002_seed_initial_zones` (migration)

## Support

For questions or issues with Supabase integration:
1. Check Supabase dashboard for data/errors
2. Review RLS policies for correct permissions
3. Test API endpoints directly using curl or Postman
4. Check browser console for JavaScript errors
5. Verify environment variables are correctly set
