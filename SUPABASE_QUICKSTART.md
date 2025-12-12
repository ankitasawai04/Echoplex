# Supabase Integration - Quick Start

## For Frontend Developers

### 1. Environment Setup
Your `.env` is already configured with Supabase credentials.

### 2. Run Frontend
```bash
npm install      # If needed
npm run dev      # Start dev server on http://localhost:5173
```

### 3. How It Works
- All zone data fetches from Supabase automatically
- Real-time updates via Supabase Realtime subscriptions
- QR scanner communicates with Supabase

### 4. Using zoneService in Components
```tsx
import { zoneService, Zone } from '../services/zoneService';

const MyComponent = () => {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    // Load zones asynchronously
    zoneService.getZones().then(setZones);

    // Subscribe to real-time updates
    const unsubscribe = zoneService.subscribe((updatedZones) => {
      setZones(updatedZones);
    });

    return unsubscribe;
  }, []);

  // Process QR scan
  const handleScan = async (qrData: string) => {
    const result = await zoneService.processQRScan(qrData, userId);
    if (result.success) {
      console.log('Checked in to:', result.zone?.name);
    }
  };

  return <div>{/* UI */}</div>;
};
```

---

## For Backend Developers

### 1. Setup Backend
```bash
cd echoplex-backend
npm install
```

### 2. Configure Environment
Create `.env` file (copy from `.env.example`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Get credentials from:
1. Go to Supabase project settings
2. Find "API" section
3. Copy Project URL and Service Role Key

### 3. Start Backend
```bash
npm run dev      # Development with hot reload
npm start        # Production
```

Server will run on `http://localhost:3000`

### 4. Test API Endpoints

**Get all zones:**
```bash
curl http://localhost:3000/api/zones
```

**Process check-in:**
```bash
curl -X POST http://localhost:3000/api/zone-event \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "zone_id": "550e8400-e29b-41d4-a716-446655440000",
    "action": "check-in"
  }'
```

**Get zone events:**
```bash
curl "http://localhost:3000/api/zone-events?zone_id=550e8400-e29b-41d4-a716-446655440000&limit=10"
```

---

## How Data Flows

```
User scans QR code
    ↓
Frontend calls zoneService.processQRScan()
    ↓
Inserts event into Supabase zone_events table
    ↓
Database triggers run:
  - calculate_risk_level()
  - update_zone_state()
  - update_user_state()
    ↓
Backend broadcasts via WebSocket
    ↓
Frontend receives update via Realtime subscription
    ↓
UI updates with new zone occupancy
```

---

## Key Database Views

### Get all zones with current occupancy
```sql
SELECT z.id, z.name, z.capacity, zcs.current_attendees, zcs.risk_level
FROM zones z
LEFT JOIN zone_current_state zcs ON z.id = zcs.zone_id;
```

### Get user's current location
```sql
SELECT u.id, u.current_zone_id, z.name
FROM users u
LEFT JOIN zones z ON u.current_zone_id = z.id
WHERE u.id = 'user123';
```

### Get events in last hour
```sql
SELECT * FROM zone_events
WHERE timestamp > now() - interval '1 hour'
ORDER BY timestamp DESC;
```

---

## Common Issues

### "VITE_SUPABASE_URL is not defined"
- Check `.env` file exists in project root
- Restart dev server after adding .env
- Clear browser cache

### "Missing Supabase environment variables"
- Backend needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Frontend needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Both must be set for system to work

### "WebSocket connection refused"
- Make sure backend is running on port 3000
- Check FRONTEND_URL in backend .env matches frontend URL
- Verify CORS is not blocking the connection

### "No real-time updates"
- Ensure Realtime is enabled in Supabase project
- Check zone_current_state table exists
- Verify RLS policies allow SELECT on the table

---

## Development Tips

1. **Monitor Data Flow**
   - Watch Supabase dashboard to see database changes in real-time
   - Use browser DevTools Network tab to see API calls
   - Check console for any errors

2. **Test QR Scanning**
   - Each zone has a QR code in zone.qrCode field
   - Generate test QR with: `JSON.stringify({ type: 'echoplex_zone', zoneId: '...' })`

3. **Simulate Load**
   - Run multiple check-ins in quick succession
   - Watch zone occupancy and risk levels update
   - Verify no race conditions occur

4. **Database Inspection**
   - Open Supabase SQL editor
   - Query tables directly to verify data
   - Check for NULL values or constraint violations

---

## Deploying to Production

1. **Database:**
   - Supabase runs in production automatically
   - Consider enabling Point-in-Time Recovery
   - Set up automated backups

2. **Backend:**
   - Deploy to Heroku, Railway, or similar
   - Set environment variables in hosting platform
   - Use SERVICE_ROLE_KEY for server-side operations

3. **Frontend:**
   - Build: `npm run build`
   - Deploy dist/ folder to Netlify, Vercel, or similar
   - Ensure .env variables are set in hosting platform

4. **Security:**
   - Rotate API keys regularly
   - Never commit .env files
   - Enable RLS policies for production
   - Implement authentication before public release

---

## Documentation

- Full integration docs: `SUPABASE_INTEGRATION.md`
- Supabase docs: https://supabase.com/docs
- Realtime docs: https://supabase.com/docs/guides/realtime
- RLS guide: https://supabase.com/docs/guides/auth/row-level-security
