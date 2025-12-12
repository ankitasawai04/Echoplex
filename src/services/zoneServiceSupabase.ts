import { supabase } from './supabaseClient';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface Zone {
  id: string;
  name: string;
  capacity: number;
  currentAttendees: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  percentFull: number;
  qrCode: string;
  location: string;
  entrances: string[];
}

export interface ZoneEvent {
  id: string;
  userId: string;
  zoneId: string;
  action: 'check-in' | 'check-out';
  timestamp: Date;
  location?: string;
}

export interface User {
  id: string;
  currentZone?: string;
  checkInHistory: ZoneEvent[];
}

class ZoneServiceSupabase {
  private listeners: ((zones: Zone[]) => void)[] = [];
  private realtimeSubscription: any = null;

  constructor() {
    this.setupRealtimeSubscription();
  }

  private setupRealtimeSubscription() {
    try {
      this.realtimeSubscription = supabase
        .channel('zone_current_state_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'zone_current_state'
          },
          async (payload) => {
            const zones = await this.getZones();
            this.notifyListeners(zones);
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error);
    }
  }

  private notifyListeners(zones: Zone[]) {
    this.listeners.forEach(callback => callback(zones));
  }

  private mapZoneRow(row: any): Zone {
    const entrances = row.entrances || [];
    return {
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      currentAttendees: row.current_attendees || 0,
      riskLevel: row.risk_level || 'LOW',
      percentFull: row.percent_full || 0,
      qrCode: typeof row.qr_code_data === 'string'
        ? row.qr_code_data
        : JSON.stringify(row.qr_code_data || {}),
      location: row.location,
      entrances: Array.isArray(entrances) ? entrances : []
    };
  }

  public async getZones(): Promise<Zone[]> {
    try {
      const { data: zones, error: zonesError } = await supabase
        .from('zones')
        .select('*');

      if (zonesError) throw zonesError;

      const { data: states, error: statesError } = await supabase
        .from('zone_current_state')
        .select('*');

      if (statesError) throw statesError;

      const stateMap = new Map(states?.map(s => [s.zone_id, s]) || []);

      return (zones || []).map(zone => {
        const state = stateMap.get(zone.id) || {};
        return this.mapZoneRow({
          ...zone,
          current_attendees: state.current_attendees || 0,
          risk_level: state.risk_level || 'LOW',
          percent_full: state.percent_full || 0
        });
      });
    } catch (error) {
      console.error('Error fetching zones:', error);
      return [];
    }
  }

  public async getZone(zoneId: string): Promise<Zone | undefined> {
    try {
      const { data: zone, error: zoneError } = await supabase
        .from('zones')
        .select('*')
        .eq('id', zoneId)
        .maybeSingle();

      if (zoneError) throw zoneError;
      if (!zone) return undefined;

      const { data: state, error: stateError } = await supabase
        .from('zone_current_state')
        .select('*')
        .eq('zone_id', zoneId)
        .maybeSingle();

      if (stateError) throw stateError;

      return this.mapZoneRow({
        ...zone,
        current_attendees: state?.current_attendees || 0,
        risk_level: state?.risk_level || 'LOW',
        percent_full: state?.percent_full || 0
      });
    } catch (error) {
      console.error(`Error fetching zone ${zoneId}:`, error);
      return undefined;
    }
  }

  public async processZoneEvent(
    userId: string,
    zoneId: string,
    action: 'check-in' | 'check-out'
  ): Promise<boolean> {
    try {
      const zone = await this.getZone(zoneId);
      if (!zone) return false;

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') throw userError;

      if (action === 'check-in') {
        if (user?.current_zone_id === zoneId) return false;
        if (zone.currentAttendees >= zone.capacity) return false;
      } else {
        if (user?.current_zone_id !== zoneId) return false;
      }

      const { error: eventError } = await supabase
        .from('zone_events')
        .insert({
          id: generateUUID(),
          user_id: userId,
          zone_id: zoneId,
          action,
          timestamp: new Date().toISOString()
        });

      if (eventError) throw eventError;

      return true;
    } catch (error) {
      console.error('Error processing zone event:', error);
      return false;
    }
  }

  public async processQRScan(
    qrData: string,
    userId: string
  ): Promise<{ success: boolean; message: string; zone?: Zone }> {
    try {
      const data = JSON.parse(qrData);

      if (data.type !== 'echoplex_zone') {
        return { success: false, message: 'Invalid QR code format' };
      }

      const zone = await this.getZone(data.zoneId);
      if (!zone) {
        return { success: false, message: 'Zone not found' };
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') throw userError;

      const isCurrentlyInZone = user?.current_zone_id === data.zoneId;
      const action = isCurrentlyInZone ? 'check-out' : 'check-in';

      const success = await this.processZoneEvent(userId, data.zoneId, action);

      if (success) {
        return {
          success: true,
          message: `Successfully ${action === 'check-in' ? 'checked into' : 'checked out of'} ${zone.name}`,
          zone
        };
      } else {
        return { success: false, message: 'Failed to process zone event' };
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      return { success: false, message: 'Invalid QR code data' };
    }
  }

  public async getUserCurrentZone(userId: string): Promise<Zone | undefined> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('current_zone_id')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (!user?.current_zone_id) return undefined;

      return this.getZone(user.current_zone_id);
    } catch (error) {
      console.error('Error getting user current zone:', error);
      return undefined;
    }
  }

  public async getZoneEvents(zoneId?: string, limit: number = 50): Promise<ZoneEvent[]> {
    try {
      let query = supabase
        .from('zone_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (zoneId) {
        query = query.eq('zone_id', zoneId);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      return (events || []).map(event => ({
        id: event.id,
        userId: event.user_id,
        zoneId: event.zone_id,
        action: event.action,
        timestamp: new Date(event.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching zone events:', error);
      return [];
    }
  }

  public subscribe(callback: (zones: Zone[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  public async getZoneAnalytics(zoneId: string, hours: number = 24) {
    try {
      const zone = await this.getZone(zoneId);
      if (!zone) return null;

      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const events = await this.getZoneEvents(zoneId, 10000);

      const recentEvents = events.filter(e => e.timestamp >= cutoffTime);
      const checkIns = recentEvents.filter(e => e.action === 'check-in').length;
      const checkOuts = recentEvents.filter(e => e.action === 'check-out').length;

      return {
        zone,
        checkIns,
        checkOuts,
        netFlow: checkIns - checkOuts,
        peakOccupancy: zone.currentAttendees,
        averageOccupancy: zone.currentAttendees * 0.8,
        events: recentEvents
      };
    } catch (error) {
      console.error('Error getting zone analytics:', error);
      return null;
    }
  }

  public destroy() {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription);
    }
  }
}

export const zoneService = new ZoneServiceSupabase();
