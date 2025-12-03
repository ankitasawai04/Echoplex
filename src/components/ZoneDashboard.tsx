// src/components/ZoneDashboard.tsx
import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { attendeeService } from '../services/attendeeService';

const ZoneDashboard: React.FC = () => {
  const [zones, setZones] = useState(attendeeService.getZones());
  const [stats, setStats] = useState(attendeeService.getStats());

  useEffect(() => {
    const updateData = () => {
      setZones(attendeeService.getZones());
      setStats(attendeeService.getStats());
    };

    updateData();
    const unsubscribe = attendeeService.subscribe(updateData);
    return unsubscribe;
  }, []);

  const getAlertLevel = (occupancy: number, capacity: number) => {
    if (occupancy === 0) {
      return { level: 'LOW', color: 'emerald', percentage: 0 };
    }
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 90) return { level: 'CRITICAL', color: 'red', percentage };
    if (percentage >= 75) return { level: 'HIGH', color: 'orange', percentage };
    if (percentage >= 50) return { level: 'MEDIUM', color: 'amber', percentage };
    return { level: 'LOW', color: 'emerald', percentage };
  };

  const highRiskZones = zones.filter(z => {
    const alert = getAlertLevel(z.currentOccupancy, z.capacity);
    return alert.level === 'HIGH' || alert.level === 'CRITICAL';
  });

  return (
    <div className="space-y-6">
      {/* Risk Assessment Panel */}
      {stats.checkedIn > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-semibold text-white">Real-Time Risk Assessment</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <Activity className="w-4 h-4" />
                <span>Overall Crowd Density</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {((stats.checkedIn / stats.totalAttendees) * 100).toFixed(1)}%
              </div>
              <div className="text-slate-500 text-xs mt-1">of total registered</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>High Risk Zones</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">{highRiskZones.length}</div>
              <div className="text-slate-500 text-xs mt-1">require attention</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>AI Recommendation</span>
              </div>
              <div className="text-sm text-cyan-400">
                {zones.some(z => getAlertLevel(z.currentOccupancy, z.capacity).level === 'CRITICAL')
                  ? 'Redirect traffic immediately'
                  : stats.checkedIn === 0
                  ? 'No attendees checked in'
                  : highRiskZones.length > 0
                  ? 'Monitor high-risk zones'
                  : 'Crowd levels normal'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone Occupancy Cards */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Zone Occupancy Dashboard</h3>
            <p className="text-slate-400 text-sm">Real-time occupancy based on check-ins</p>
          </div>
        </div>

        {stats.checkedIn === 0 ? (
          <div className="text-center py-12 bg-slate-700/50 rounded-lg border border-slate-600">
            <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">No attendees checked in yet</p>
            <p className="text-slate-500 text-sm mt-2">
              Upload attendees via Bulk Import and check them in to see zone occupancy
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zones.map((zone) => {
              const alert = getAlertLevel(zone.currentOccupancy, zone.capacity);

              return (
                <div
                  key={zone.id}
                  className={`bg-slate-700 rounded-xl p-5 border transition-all ${
                    alert.level === 'CRITICAL'
                      ? 'border-red-500 shadow-lg shadow-red-500/20'
                      : alert.level === 'HIGH'
                      ? 'border-orange-500'
                      : 'border-slate-600 hover:border-cyan-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">{zone.name}</h4>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 bg-${alert.color}-500 rounded-full ${
                          alert.level === 'CRITICAL' ? 'animate-pulse' : ''
                        }`}
                      ></span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {zone.currentOccupancy}
                      </span>
                      <span className="text-slate-400 text-sm">/ {zone.capacity}</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">capacity</p>
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full bg-${alert.color}-500 transition-all duration-500`}
                        style={{ width: `${alert.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold bg-${alert.color}-500/20 text-${alert.color}-400 border border-${alert.color}-500/30`}
                    >
                      {alert.level}
                    </span>
                    <span className="text-slate-400 text-sm font-medium">
                      {Math.round(alert.percentage)}%
                    </span>
                  </div>

                  {alert.level === 'CRITICAL' && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <div className="flex items-center gap-2 text-red-400 text-xs">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">Near Capacity!</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {stats.checkedIn > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>Updates automatically with check-ins</span>
          </div>
        )}
      </div>

      {/* High Risk Zones Alert */}
      {highRiskZones.length > 0 && (
        <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <h4 className="text-lg font-semibold text-white">High Risk Zones Alert</h4>
          </div>
          <div className="space-y-2">
            {highRiskZones.map(zone => (
              <div key={zone.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{zone.name}</p>
                  <p className="text-slate-400 text-sm">
                    {zone.currentOccupancy}/{zone.capacity} occupancy
                  </p>
                </div>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold border border-orange-500/30">
                  {Math.round((zone.currentOccupancy / zone.capacity) * 100)}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-orange-300 text-sm mt-4">
            ⚠️ Consider redirecting new attendees to lower-occupancy zones
          </p>
        </div>
      )}
    </div>
  );
};

export default ZoneDashboard;