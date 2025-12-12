import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.use(cors());
app.use(express.json());

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function getZoneStats(zoneId) {
  const { data: zone, error: zoneError } = await supabase
    .from('zones')
    .select('*')
    .eq('id', zoneId)
    .maybeSingle();

  if (zoneError || !zone) return null;

  const { data: state, error: stateError } = await supabase
    .from('zone_current_state')
    .select('*')
    .eq('zone_id', zoneId)
    .maybeSingle();

  if (stateError) return null;

  return {
    id: zone.id,
    name: zone.name,
    currentAttendees: state?.current_attendees || 0,
    capacity: zone.capacity,
    percentageFull: state?.percent_full || 0,
    riskLevel: state?.risk_level || 'LOW'
  };
}

app.get('/api/zones', async (req, res) => {
  try {
    const { data: zones, error } = await supabase
      .from('zones')
      .select('*');

    if (error) throw error;

    const { data: states } = await supabase
      .from('zone_current_state')
      .select('*');

    const stateMap = new Map((states || []).map(s => [s.zone_id, s]));

    const zonesArray = (zones || []).map(zone => {
      const state = stateMap.get(zone.id) || {};
      return {
        id: zone.id,
        name: zone.name,
        currentAttendees: state.current_attendees || 0,
        capacity: zone.capacity,
        percentageFull: state.percent_full || 0,
        riskLevel: state.risk_level || 'LOW'
      };
    });

    res.json({ zones: zonesArray });
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

app.get('/api/zones/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const stats = await getZoneStats(zoneId);

    if (!stats) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching zone:', error);
    res.status(500).json({ error: 'Failed to fetch zone' });
  }
});

app.post('/api/zone-event', async (req, res) => {
  try {
    const { user_id, zone_id, action, timestamp } = req.body;

    if (!user_id || !zone_id || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (action !== 'check-in' && action !== 'check-out') {
      return res.status(400).json({ error: 'Invalid action. Use "check-in" or "check-out"' });
    }

    const { data: zone, error: zoneError } = await supabase
      .from('zones')
      .select('*')
      .eq('id', zone_id)
      .maybeSingle();

    if (zoneError || !zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') throw userError;

    if (action === 'check-in') {
      if (user?.current_zone_id === zone_id) {
        return res.status(400).json({ error: 'User already checked in to this zone' });
      }

      const { data: state } = await supabase
        .from('zone_current_state')
        .select('current_attendees')
        .eq('zone_id', zone_id)
        .maybeSingle();

      if (state && state.current_attendees >= zone.capacity) {
        return res.status(400).json({ error: 'Zone is at full capacity' });
      }
    }

    if (action === 'check-out') {
      if (user?.current_zone_id !== zone_id) {
        return res.status(400).json({ error: 'User not checked in to this zone' });
      }
    }

    const { error: eventError } = await supabase
      .from('zone_events')
      .insert({
        id: generateUUID(),
        user_id,
        zone_id,
        action,
        timestamp: timestamp || new Date().toISOString()
      });

    if (eventError) throw eventError;

    const updatedStats = await getZoneStats(zone_id);

    io.emit('zone-update', updatedStats);

    res.json({
      success: true,
      message: `Successfully ${action === 'check-in' ? 'checked in to' : 'checked out from'} ${zone.name}`,
      zone: updatedStats
    });
  } catch (error) {
    console.error('Error processing zone event:', error);
    res.status(500).json({ error: 'Failed to process zone event' });
  }
});

app.get('/api/zone-events', async (req, res) => {
  try {
    const { zone_id, user_id, limit = 50 } = req.query;

    let query = supabase
      .from('zone_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (zone_id) {
      query = query.eq('zone_id', zone_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    res.json({ events: events || [], total: events?.length || 0 });
  } catch (error) {
    console.error('Error fetching zone events:', error);
    res.status(500).json({ error: 'Failed to fetch zone events' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  (async () => {
    try {
      const { data: zones } = await supabase.from('zones').select('*');
      const { data: states } = await supabase.from('zone_current_state').select('*');

      const stateMap = new Map((states || []).map(s => [s.zone_id, s]));

      const zonesArray = (zones || []).map(zone => {
        const state = stateMap.get(zone.id) || {};
        return {
          id: zone.id,
          name: zone.name,
          currentAttendees: state.current_attendees || 0,
          capacity: zone.capacity,
          percentageFull: state.percent_full || 0,
          riskLevel: state.risk_level || 'LOW'
        };
      });

      socket.emit('initial-data', { zones: zonesArray });
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  })();

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready for real-time updates`);
});
