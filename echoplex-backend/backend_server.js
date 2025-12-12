// server.js - Main Backend Server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database (replace with real DB later)
let zones = {
  main_stage: { id: 'main_stage', name: 'Main Stage', capacity: 500, currentAttendees: 0, activeUsers: new Set() },
  food_court: { id: 'food_court', name: 'Food Court', capacity: 200, currentAttendees: 0, activeUsers: new Set() },
  vip_lounge: { id: 'vip_lounge', name: 'VIP Lounge', capacity: 100, currentAttendees: 0, activeUsers: new Set() },
  parking: { id: 'parking', name: 'Parking Area', capacity: 300, currentAttendees: 0, activeUsers: new Set() }
};

let zoneEvents = []; // Store all check-in/check-out events

// Helper function to calculate risk level
function calculateRiskLevel(currentAttendees, capacity) {
  const percentage = (currentAttendees / capacity) * 100;
  if (percentage >= 95) return 'HIGH';
  if (percentage >= 80) return 'MEDIUM';
  return 'LOW';
}

// Helper function to get zone stats
function getZoneStats(zoneId) {
  const zone = zones[zoneId];
  if (!zone) return null;
  
  const percentage = (zone.currentAttendees / zone.capacity) * 100;
  const riskLevel = calculateRiskLevel(zone.currentAttendees, zone.capacity);
  
  return {
    id: zone.id,
    name: zone.name,
    currentAttendees: zone.currentAttendees,
    capacity: zone.capacity,
    percentageFull: Math.round(percentage),
    riskLevel: riskLevel
  };
}

// API ENDPOINTS

// 1. Get all zones overview
app.get('/api/zones', (req, res) => {
  const zonesArray = Object.keys(zones).map(zoneId => getZoneStats(zoneId));
  res.json({ zones: zonesArray });
});

// 2. Get specific zone details
app.get('/api/zones/:zoneId', (req, res) => {
  const { zoneId } = req.params;
  const stats = getZoneStats(zoneId);
  
  if (!stats) {
    return res.status(404).json({ error: 'Zone not found' });
  }
  
  res.json(stats);
});

// 3. Zone check-in/check-out (Main endpoint)
app.post('/api/zone-event', (req, res) => {
  const { user_id, zone_id, action, timestamp } = req.body;
  
  // Validation
  if (!user_id || !zone_id || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!zones[zone_id]) {
    return res.status(404).json({ error: 'Zone not found' });
  }
  
  if (action !== 'check-in' && action !== 'check-out') {
    return res.status(400).json({ error: 'Invalid action. Use "check-in" or "check-out"' });
  }
  
  const zone = zones[zone_id];
  
  // Handle check-in
  if (action === 'check-in') {
    // Prevent duplicate check-ins
    if (zone.activeUsers.has(user_id)) {
      return res.status(400).json({ error: 'User already checked in to this zone' });
    }
    
    // Check capacity
    if (zone.currentAttendees >= zone.capacity) {
      return res.status(400).json({ error: 'Zone is at full capacity' });
    }
    
    zone.activeUsers.add(user_id);
    zone.currentAttendees++;
  }
  
  // Handle check-out
  if (action === 'check-out') {
    if (!zone.activeUsers.has(user_id)) {
      return res.status(400).json({ error: 'User not checked in to this zone' });
    }
    
    zone.activeUsers.delete(user_id);
    zone.currentAttendees = Math.max(0, zone.currentAttendees - 1);
  }
  
  // Log the event
  const event = {
    user_id,
    zone_id,
    action,
    timestamp: timestamp || new Date().toISOString()
  };
  zoneEvents.push(event);
  
  // Get updated stats
  const updatedStats = getZoneStats(zone_id);
  
  // Broadcast update to all connected clients via WebSocket
  io.emit('zone-update', updatedStats);
  
  // Send response
  res.json({
    success: true,
    message: `Successfully ${action === 'check-in' ? 'checked in to' : 'checked out from'} ${zone.name}`,
    zone: updatedStats
  });
});

// 4. Get zone events history
app.get('/api/zone-events', (req, res) => {
  const { zone_id, user_id, limit = 50 } = req.query;
  
  let filteredEvents = zoneEvents;
  
  if (zone_id) {
    filteredEvents = filteredEvents.filter(e => e.zone_id === zone_id);
  }
  
  if (user_id) {
    filteredEvents = filteredEvents.filter(e => e.user_id === user_id);
  }
  
  // Return latest events (limited)
  const recentEvents = filteredEvents.slice(-parseInt(limit));
  
  res.json({ events: recentEvents, total: filteredEvents.length });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current zone data on connection
  const zonesArray = Object.keys(zones).map(zoneId => getZoneStats(zoneId));
  socket.emit('initial-data', { zones: zonesArray });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready for real-time updates`);
});