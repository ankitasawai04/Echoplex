// src/services/attendeeService.ts
// Enhanced service with localStorage persistence and fixed alert calculations

export interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  ticketId: string;
  isCheckedIn: boolean;
  checkInTime?: string; // Changed to string for JSON serialization
  checkOutTime?: string;
  currentZone?: string;
  status: 'not_checked_in' | 'checked_in' | 'checked_out';
}

export interface Zone {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
}

export interface GlobalStats {
  totalAttendees: number;
  checkedIn: number;
  notCheckedIn: number;
  totalOccupancy: number;
}

export interface CrowdMetrics {
  averageDensity: number;
  peakZone: { name: string; occupancy: number; capacity: number } | null;
  crowdFlow: 'increasing' | 'stable' | 'decreasing';
  predictedPeakTime: string;
}

export interface RiskAssessment {
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  highRiskZones: Array<{ id: string; name: string; riskLevel: string; occupancy: number; capacity: number }>;
  recommendations: string[];
  incidentProbability: number;
}

export interface EventOverview {
  activeAttendees: number;
  totalCapacity: number;
  utilizationRate: number;
  activeZones: number;
  averageStayDuration: number;
  checkInRate: number;
  checkOutRate: number;
}

interface CheckInHistoryItem {
  timestamp: string;
  action: 'check-in' | 'check-out';
}

class AttendeeServiceClass {
  private attendees: Map<string, Attendee> = new Map();
  private zones: Map<string, Zone> = new Map();
  private checkInHistory: CheckInHistoryItem[] = [];
  private subscribers: Set<() => void> = new Set();
  private readonly STORAGE_KEY_ATTENDEES = 'echoplex_attendees';
  private readonly STORAGE_KEY_ZONES = 'echoplex_zones';
  private readonly STORAGE_KEY_HISTORY = 'echoplex_history';

  constructor() {
    this.initializeZones();
    this.loadFromStorage();
  }

  private initializeZones() {
    const defaultZones: Zone[] = [
      { id: 'zone-1', name: 'Main Hall', capacity: 200, currentOccupancy: 0 },
      { id: 'zone-2', name: 'Workshop Area', capacity: 100, currentOccupancy: 0 },
      { id: 'zone-3', name: 'Exhibition', capacity: 150, currentOccupancy: 0 },
      { id: 'zone-4', name: 'Food Court', capacity: 50, currentOccupancy: 0 },
    ];

    defaultZones.forEach(zone => {
      this.zones.set(zone.id, zone);
    });
  }

  // Load data from localStorage
  private loadFromStorage() {
    try {
      // Load attendees
      const attendeesData = localStorage.getItem(this.STORAGE_KEY_ATTENDEES);
      if (attendeesData) {
        const attendeesArray: Attendee[] = JSON.parse(attendeesData);
        attendeesArray.forEach(attendee => {
          this.attendees.set(attendee.ticketId, attendee);
        });
      }

      // Load zones
      const zonesData = localStorage.getItem(this.STORAGE_KEY_ZONES);
      if (zonesData) {
        const zonesArray: Zone[] = JSON.parse(zonesData);
        zonesArray.forEach(zone => {
          this.zones.set(zone.id, zone);
        });
      }

      // Load history
      const historyData = localStorage.getItem(this.STORAGE_KEY_HISTORY);
      if (historyData) {
        this.checkInHistory = JSON.parse(historyData);
      }

      console.log('✅ Data loaded from storage:', {
        attendees: this.attendees.size,
        checkedIn: Array.from(this.attendees.values()).filter(a => a.isCheckedIn).length
      });
    } catch (error) {
      console.error('❌ Error loading from storage:', error);
    }
  }

  // Save data to localStorage
  private saveToStorage() {
    try {
      // Save attendees
      const attendeesArray = Array.from(this.attendees.values());
      localStorage.setItem(this.STORAGE_KEY_ATTENDEES, JSON.stringify(attendeesArray));

      // Save zones
      const zonesArray = Array.from(this.zones.values());
      localStorage.setItem(this.STORAGE_KEY_ZONES, JSON.stringify(zonesArray));

      // Save history
      localStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(this.checkInHistory));

      console.log('💾 Data saved to storage');
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
    }
  }

  // Subscribe to changes
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach(callback => callback());
  }

  // Load attendees from CSV
  loadAttendeesFromCSV(csvData: string): { success: boolean; count: number; error?: string } {
    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return { success: false, count: 0, error: 'CSV file is empty' };
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      if (!headers.includes('name') || !headers.includes('email') || !headers.includes('ticketid')) {
        return { success: false, count: 0, error: 'CSV must have columns: name, email, ticketId' };
      }

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map(v => v.trim());
        const attendee: any = { isCheckedIn: false, status: 'not_checked_in' };

        headers.forEach((header, index) => {
          if (header === 'ticketid') {
            attendee.ticketId = values[index];
            attendee.id = values[index];
          } else {
            attendee[header] = values[index] || '';
          }
        });

        if (attendee.ticketId && attendee.name && attendee.email) {
          this.attendees.set(attendee.ticketId, attendee as Attendee);
          count++;
        }
      }

      this.saveToStorage();
      this.notify();
      return { success: true, count };
    } catch (error) {
      return { success: false, count: 0, error: 'Failed to parse CSV file' };
    }
  }

  // Get all attendees
  getAllAttendees(): Attendee[] {
    return Array.from(this.attendees.values());
  }

  // Get attendee by ticket ID
  getAttendee(ticketId: string): Attendee | undefined {
    return this.attendees.get(ticketId);
  }

  // Check-in attendee
  checkIn(ticketId: string, zoneId: string, location?: string): { success: boolean; message: string; attendee?: Attendee } {
    const attendee = this.attendees.get(ticketId);
    
    if (!attendee) {
      return { success: false, message: 'Attendee not found' };
    }

    if (attendee.isCheckedIn) {
      return { success: false, message: 'Attendee already checked in' };
    }

    const zone = this.zones.get(zoneId);
    if (!zone) {
      return { success: false, message: 'Invalid zone' };
    }

    if (zone.currentOccupancy >= zone.capacity) {
      return { success: false, message: `${zone.name} is at full capacity` };
    }

    // Update attendee
    attendee.isCheckedIn = true;
    attendee.checkInTime = new Date().toISOString();
    attendee.currentZone = zoneId;
    attendee.status = 'checked_in';

    // Update zone occupancy
    zone.currentOccupancy++;

    // Track history
    this.checkInHistory.push({ timestamp: new Date().toISOString(), action: 'check-in' });

    // Save to storage
    this.saveToStorage();
    this.notify();

    console.log(`✅ Checked in: ${attendee.name} to ${zone.name}`, {
      zoneOccupancy: `${zone.currentOccupancy}/${zone.capacity}`,
      percentage: `${((zone.currentOccupancy / zone.capacity) * 100).toFixed(1)}%`
    });

    return { success: true, message: `Checked in to ${zone.name}`, attendee };
  }

  // Check-out attendee
  checkOut(ticketId: string): { success: boolean; message: string; attendee?: Attendee; duration?: number } {
    const attendee = this.attendees.get(ticketId);
    
    if (!attendee) {
      return { success: false, message: 'Attendee not found' };
    }

    if (!attendee.isCheckedIn) {
      return { success: false, message: 'Attendee is not checked in' };
    }

    const zone = this.zones.get(attendee.currentZone!);
    if (zone) {
      zone.currentOccupancy = Math.max(0, zone.currentOccupancy - 1);
    }

    const duration = attendee.checkInTime 
      ? Math.floor((new Date().getTime() - new Date(attendee.checkInTime).getTime()) / 60000)
      : 0;

    // Update attendee
    attendee.isCheckedIn = false;
    attendee.checkOutTime = new Date().toISOString();
    attendee.status = 'checked_out';
    attendee.currentZone = undefined;

    // Track history
    this.checkInHistory.push({ timestamp: new Date().toISOString(), action: 'check-out' });

    // Save to storage
    this.saveToStorage();
    this.notify();

    console.log(`✅ Checked out: ${attendee.name}`, { duration: `${duration} min` });

    return { 
      success: true, 
      message: `Checked out from ${zone?.name || 'zone'}`,
      attendee,
      duration
    };
  }

  // Get all zones
  getZones(): Zone[] {
    return Array.from(this.zones.values());
  }

  // Get zone by ID
  getZone(zoneId: string): Zone | undefined {
    return this.zones.get(zoneId);
  }

  // Get global statistics
  getStats(): GlobalStats {
    const attendeeList = Array.from(this.attendees.values());
    const checkedIn = attendeeList.filter(a => a.isCheckedIn).length;
    const totalOccupancy = Array.from(this.zones.values())
      .reduce((sum, zone) => sum + zone.currentOccupancy, 0);

    return {
      totalAttendees: attendeeList.length,
      checkedIn,
      notCheckedIn: attendeeList.length - checkedIn,
      totalOccupancy
    };
  }

  // Get Event Overview Data
  getEventOverview(): EventOverview {
    const stats = this.getStats();
    const zones = this.getZones();
    const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
    const activeZones = zones.filter(z => z.currentOccupancy > 0).length;

    const checkedInAttendees = Array.from(this.attendees.values())
      .filter(a => a.isCheckedIn && a.checkInTime);
    
    const avgDuration = checkedInAttendees.length > 0
      ? checkedInAttendees.reduce((sum, a) => {
          const duration = a.checkInTime 
            ? (new Date().getTime() - new Date(a.checkInTime).getTime()) / 60000 
            : 0;
          return sum + duration;
        }, 0) / checkedInAttendees.length
      : 0;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
    const recentHistory = this.checkInHistory.filter(h => h.timestamp > fiveMinutesAgo);
    const checkInRate = recentHistory.filter(h => h.action === 'check-in').length / 5;
    const checkOutRate = recentHistory.filter(h => h.action === 'check-out').length / 5;

    return {
      activeAttendees: stats.checkedIn,
      totalCapacity,
      utilizationRate: totalCapacity > 0 ? (stats.totalOccupancy / totalCapacity) * 100 : 0,
      activeZones,
      averageStayDuration: Math.round(avgDuration),
      checkInRate: Math.round(checkInRate * 10) / 10,
      checkOutRate: Math.round(checkOutRate * 10) / 10,
    };
  }

  // Get Crowd Intelligence Metrics
  getCrowdMetrics(): CrowdMetrics {
    const zones = this.getZones();
    const stats = this.getStats();

    if (stats.checkedIn === 0) {
      return {
        averageDensity: 0,
        peakZone: null,
        crowdFlow: 'stable',
        predictedPeakTime: 'No data available',
      };
    }

    const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
    const totalOccupancy = zones.reduce((sum, z) => sum + z.currentOccupancy, 0);
    const averageDensity = (totalOccupancy / totalCapacity) * 100;

    const peakZone = zones.reduce((max, zone) => {
      const density = (zone.currentOccupancy / zone.capacity) * 100;
      const maxDensity = max ? (max.occupancy / max.capacity) * 100 : 0;
      return density > maxDensity ? zone : max;
    }, zones[0]);

    const lastMinute = new Date(Date.now() - 60000).toISOString();
    const recentActivity = this.checkInHistory.filter(h => h.timestamp > lastMinute);
    const recentCheckIns = recentActivity.filter(h => h.action === 'check-in').length;
    const recentCheckOuts = recentActivity.filter(h => h.action === 'check-out').length;
    
    let crowdFlow: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (recentCheckIns > recentCheckOuts + 2) crowdFlow = 'increasing';
    else if (recentCheckOuts > recentCheckIns + 2) crowdFlow = 'decreasing';

    const currentHour = new Date().getHours();
    const predictedPeakTime = currentHour < 14 
      ? '2:00 PM - 4:00 PM' 
      : currentHour < 18 
      ? '6:00 PM - 8:00 PM' 
      : 'Peak time has passed';

    return {
      averageDensity: Math.round(averageDensity * 10) / 10,
      peakZone: peakZone ? {
        name: peakZone.name,
        occupancy: peakZone.currentOccupancy,
        capacity: peakZone.capacity,
      } : null,
      crowdFlow,
      predictedPeakTime,
    };
  }

  // Get Risk Assessment
  getRiskAssessment(): RiskAssessment {
    const zones = this.getZones();
    const stats = this.getStats();

    if (stats.checkedIn === 0) {
      return {
        overallRiskLevel: 'LOW',
        highRiskZones: [],
        recommendations: ['No attendees currently checked in'],
        incidentProbability: 0,
      };
    }

    const highRiskZones = zones
      .map(zone => {
        const percentage = (zone.currentOccupancy / zone.capacity) * 100;
        let riskLevel = 'LOW';
        if (percentage >= 90) riskLevel = 'CRITICAL';
        else if (percentage >= 75) riskLevel = 'HIGH';
        else if (percentage >= 50) riskLevel = 'MEDIUM';

        return {
          id: zone.id,
          name: zone.name,
          riskLevel,
          occupancy: zone.currentOccupancy,
          capacity: zone.capacity,
          percentage,
        };
      })
      .filter(zone => zone.riskLevel === 'HIGH' || zone.riskLevel === 'CRITICAL')
      .sort((a, b) => b.percentage - a.percentage);

    let overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    const maxRisk = highRiskZones[0]?.riskLevel;
    if (maxRisk === 'CRITICAL') overallRiskLevel = 'CRITICAL';
    else if (maxRisk === 'HIGH' || highRiskZones.length >= 2) overallRiskLevel = 'HIGH';
    else if (highRiskZones.length === 1) overallRiskLevel = 'MEDIUM';

    const recommendations: string[] = [];
    if (highRiskZones.length === 0) {
      recommendations.push('All zones operating within safe capacity');
      recommendations.push('Continue monitoring crowd density');
    } else {
      highRiskZones.forEach(zone => {
        if (zone.riskLevel === 'CRITICAL') {
          recommendations.push(`🚨 URGENT: Redirect traffic from ${zone.name} immediately`);
          recommendations.push(`Consider closing entry to ${zone.name} temporarily`);
        } else if (zone.riskLevel === 'HIGH') {
          recommendations.push(`⚠️ Monitor ${zone.name} closely - approaching capacity`);
        }
      });
      recommendations.push('Deploy additional staff to high-density areas');
      recommendations.push('Prepare emergency evacuation routes');
    }

    const avgOccupancy = zones.reduce((sum, z) => sum + (z.currentOccupancy / z.capacity), 0) / zones.length;
    const incidentProbability = Math.min(Math.round(avgOccupancy * 100 * 0.8), 95);

    return {
      overallRiskLevel,
      highRiskZones,
      recommendations,
      incidentProbability,
    };
  }

  // Get alert level for a zone - FIXED CALCULATION
  getAlertLevel(zoneId: string): { level: string; color: string; percentage: number } {
    const zone = this.zones.get(zoneId);
    
    // If zone doesn't exist, return LOW
    if (!zone) {
      return { level: 'LOW', color: 'emerald', percentage: 0 };
    }

    // Calculate actual percentage based on current occupancy
    const percentage = zone.capacity > 0 ? (zone.currentOccupancy / zone.capacity) * 100 : 0;

    // FIXED: Alert level based on actual occupancy percentage
    if (zone.currentOccupancy === 0) {
      return { level: 'LOW', color: 'emerald', percentage: 0 };
    }
    
    if (percentage >= 90) return { level: 'CRITICAL', color: 'red', percentage };
    if (percentage >= 75) return { level: 'HIGH', color: 'orange', percentage };
    if (percentage >= 50) return { level: 'MEDIUM', color: 'amber', percentage };
    return { level: 'LOW', color: 'emerald', percentage };
  }

  // Clear all data
  clear() {
    if (confirm('⚠️ This will delete all attendee data and check-ins. Are you sure?')) {
      this.attendees.clear();
      this.zones.forEach(zone => {
        zone.currentOccupancy = 0;
      });
      this.checkInHistory = [];
      
      // Clear localStorage
      localStorage.removeItem(this.STORAGE_KEY_ATTENDEES);
      localStorage.removeItem(this.STORAGE_KEY_ZONES);
      localStorage.removeItem(this.STORAGE_KEY_HISTORY);
      
      this.notify();
      console.log('🗑️ All data cleared');
    }
  }
}

// Export singleton instance
export const attendeeService = new AttendeeServiceClass();