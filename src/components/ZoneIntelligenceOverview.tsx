import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp } from 'lucide-react';

// Type definitions
interface Zone {
  id: string;
  name: string;
  capacity: number;
  currentAttendees: number;
}

interface ZoneEvent {
  id: string;
  zoneId: string;
  zoneName: string;
  userId: string;
  action: 'check-in' | 'check-out';
  timestamp: Date;
}

interface ZoneDefinition {
  id: string;
  name: string;
  capacity: number;
}

// Zone definitions
const zoneDefinitions: ZoneDefinition[] = [
  { id: 'zone-1', name: 'Main Hall', capacity: 500 },
  { id: 'zone-2', name: 'Workshop Area', capacity: 200 },
  { id: 'zone-3', name: 'Exhibition', capacity: 300 },
  { id: 'zone-4', name: 'Food Court', capacity: 150 },
];

// Zone service implementation
class ZoneServiceClass {
  private zones = new Map<string, Zone>();
  private userZones = new Map<string, string>();
  private events: ZoneEvent[] = [];
  private subscribers = new Set<(zones: Zone[]) => void>();

  initialize() {
    zoneDefinitions.forEach(def => {
      this.zones.set(def.id, {
        ...def,
        currentAttendees: Math.floor(Math.random() * def.capacity * 0.6)
      });
    });
  }

  getZones(): Zone[] {
    return Array.from(this.zones.values());
  }

  getZoneEvents(zoneId?: string, limit: number = 10): ZoneEvent[] {
    let filtered = this.events;
    if (zoneId) {
      filtered = this.events.filter(e => e.zoneId === zoneId);
    }
    return filtered.slice(-limit);
  }

  getUserCurrentZone(userId: string): Zone | undefined {
    const zoneId = this.userZones.get(userId);
    return zoneId ? this.zones.get(zoneId) : undefined;
  }

  processQRScan(qrData: string, userId: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(qrData);
      const zone = this.zones.get(data.zoneId);
      
      if (!zone) {
        return { success: false, message: 'Invalid zone' };
      }

      const currentZoneId = this.userZones.get(userId);
      
      if (currentZoneId === data.zoneId) {
        zone.currentAttendees = Math.max(0, zone.currentAttendees - 1);
        this.userZones.delete(userId);
        this.addEvent(data.zoneId, zone.name, userId, 'check-out');
        this.notifySubscribers();
        return { success: true, message: `Checked out from ${zone.name}` };
      } else {
        if (currentZoneId) {
          const prevZone = this.zones.get(currentZoneId);
          if (prevZone) {
            prevZone.currentAttendees = Math.max(0, prevZone.currentAttendees - 1);
            this.addEvent(currentZoneId, prevZone.name, userId, 'check-out');
          }
        }
        
        if (zone.currentAttendees < zone.capacity) {
          zone.currentAttendees++;
          this.userZones.set(userId, data.zoneId);
          this.addEvent(data.zoneId, zone.name, userId, 'check-in');
          this.notifySubscribers();
          return { success: true, message: `Checked in to ${zone.name}` };
        } else {
          return { success: false, message: `${zone.name} is at full capacity` };
        }
      }
    } catch {
      return { success: false, message: 'Invalid QR code' };
    }
  }

  private addEvent(zoneId: string, zoneName: string, userId: string, action: 'check-in' | 'check-out') {
    this.events.push({
      id: `event-${Date.now()}-${Math.random()}`,
      zoneId,
      zoneName,
      userId,
      action,
      timestamp: new Date()
    });
  }

  subscribe(callback: (zones: Zone[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    const zones = this.getZones();
    this.subscribers.forEach(callback => callback(zones));
  }
}

const zoneService = new ZoneServiceClass();
zoneService.initialize();

const ZoneIntelligenceOverview: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const zonesData = zoneService.getZones();
        if (isMounted) {
          setZones(zonesData);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    const unsubscribe = zoneService.subscribe((updatedZones) => {
      if (isMounted) {
        setZones(updatedZones);
      }
    });

    const interval = setInterval(() => {
      const zones = zoneService.getZones();
      const randomZone = zones[Math.floor(Math.random() * zones.length)];
      if (randomZone && Math.random() > 0.5) {
        const change = Math.random() > 0.5 ? 1 : -1;
        randomZone.currentAttendees = Math.max(
          0,
          Math.min(randomZone.capacity, randomZone.currentAttendees + change)
        );
        zoneService.notifySubscribers();
      }
    }, 5000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [userId]);

  const getRiskLevel = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 80) return 'HIGH RISK';
    if (percentage >= 50) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  const getRiskColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getPercentageFull = (current: number, capacity: number) => {
    return Math.min(Math.round((current / capacity) * 100), 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Zone Intelligence Overview</h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-slate-400 mt-4">Loading zone data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {zones.map((zone) => {
                const currentAttendees = zone.currentAttendees;
                const percentageFull = getPercentageFull(currentAttendees, zone.capacity);
                const riskLevel = getRiskLevel(currentAttendees, zone.capacity);
                const riskColor = getRiskColor(currentAttendees, zone.capacity);

                return (
                  <div key={zone.id} className="bg-slate-700 rounded-xl p-5 border border-slate-600 hover:border-cyan-500 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{zone.name}</h3>
                      <div className="flex items-center gap-2">
                        {percentageFull >= 80 && (
                          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                        {percentageFull >= 50 && percentageFull < 80 && (
                          <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                        )}
                        {percentageFull < 50 && (
                          <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                          {currentAttendees.toLocaleString()}
                        </span>
                        <span className="text-slate-400 text-sm">
                          / {zone.capacity.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">capacity</p>
                    </div>

                    <div className="mb-4">
                      <div className="w-full bg-slate-600 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full ${riskColor} transition-all duration-500`}
                          style={{ width: `${percentageFull}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          riskLevel === 'HIGH RISK'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : riskLevel === 'MEDIUM RISK'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {riskLevel}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">
                        {percentageFull}% full
                      </span>
                    </div>

                    {percentageFull >= 80 && (
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <div className="flex items-center gap-2 text-red-400 text-xs">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-medium">Near Capacity Alert</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>Real-time updates every 5 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneIntelligenceOverview;