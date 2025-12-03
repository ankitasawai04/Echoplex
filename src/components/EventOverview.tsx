// src/components/EventOverview.tsx
import React, { useState, useEffect } from 'react';
import { Users, MapPin, Clock, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { attendeeService } from '../services/attendeeService';

const EventOverview: React.FC = () => {
  const [overview, setOverview] = useState(attendeeService.getEventOverview());
  const [stats, setStats] = useState(attendeeService.getStats());

  useEffect(() => {
    const updateData = () => {
      setOverview(attendeeService.getEventOverview());
      setStats(attendeeService.getStats());
    };

    updateData();
    const unsubscribe = attendeeService.subscribe(updateData);

    // Update every 30 seconds for live metrics
    const interval = setInterval(updateData, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-red-400';
    if (rate >= 60) return 'text-amber-400';
    if (rate >= 40) return 'text-cyan-400';
    return 'text-emerald-400';
  };

  const getFlowIndicator = () => {
    if (overview.checkInRate > overview.checkOutRate + 1) {
      return { text: 'Increasing', icon: '📈', color: 'text-cyan-400' };
    } else if (overview.checkOutRate > overview.checkInRate + 1) {
      return { text: 'Decreasing', icon: '📉', color: 'text-amber-400' };
    }
    return { text: 'Stable', icon: '➡️', color: 'text-emerald-400' };
  };

  const flow = getFlowIndicator();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-xl p-6 border border-cyan-500/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Event Overview</h1>
            <p className="text-cyan-200 text-sm">Real-time event status based on check-ins</p>
          </div>
        </div>
      </div>

      {/* No Data State */}
      {stats.checkedIn === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
          <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Attendees</h3>
          <p className="text-slate-400 mb-4">
            Upload attendee list and check them in to see real-time event metrics
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
            <span className="text-slate-300 text-sm">
              Go to <strong className="text-cyan-400">Check-In Section</strong> to get started
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Attendees */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {overview.activeAttendees.toLocaleString()}
              </div>
              <div className="text-slate-400 text-sm">Active Attendees</div>
              <div className="mt-2 text-xs text-slate-500">
                of {stats.totalAttendees} registered
              </div>
            </div>

            {/* Utilization Rate */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className={`text-3xl font-bold mb-1 ${getUtilizationColor(overview.utilizationRate)}`}>
                {overview.utilizationRate.toFixed(1)}%
              </div>
              <div className="text-slate-400 text-sm">Venue Utilization</div>
              <div className="mt-2">
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-full rounded-full ${
                      overview.utilizationRate >= 80
                        ? 'bg-red-500'
                        : overview.utilizationRate >= 60
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(overview.utilizationRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Active Zones */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-teal-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {overview.activeZones}
              </div>
              <div className="text-slate-400 text-sm">Active Zones</div>
              <div className="mt-2 text-xs text-slate-500">
                with checked-in attendees
              </div>
            </div>

            {/* Average Stay Duration */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {overview.averageStayDuration}
                <span className="text-lg text-slate-400 ml-1">min</span>
              </div>
              <div className="text-slate-400 text-sm">Avg. Stay Duration</div>
              <div className="mt-2 text-xs text-slate-500">
                per attendee
              </div>
            </div>
          </div>

          {/* Crowd Flow Analysis */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-semibold text-white">Crowd Flow Analysis</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Check-In Rate */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Check-In Rate</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  {overview.checkInRate}
                  <span className="text-sm text-slate-400 ml-1">/min</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Last 5 minutes</div>
              </div>

              {/* Check-Out Rate */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Check-Out Rate</span>
                  <TrendingUp className="w-4 h-4 text-cyan-400 transform rotate-180" />
                </div>
                <div className="text-2xl font-bold text-cyan-400">
                  {overview.checkOutRate}
                  <span className="text-sm text-slate-400 ml-1">/min</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Last 5 minutes</div>
              </div>

              {/* Crowd Trend */}
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm">Crowd Trend</span>
                  <span className="text-xl">{flow.icon}</span>
                </div>
                <div className={`text-2xl font-bold ${flow.color}`}>
                  {flow.text}
                </div>
                <div className="text-xs text-slate-500 mt-1">Current flow direction</div>
              </div>
            </div>
          </div>

          {/* Capacity Overview */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-semibold text-white">Capacity Overview</h3>
              </div>
              <div className="text-sm text-slate-400">
                Total Capacity: <span className="text-white font-semibold">{overview.totalCapacity}</span>
              </div>
            </div>

            <div className="space-y-4">
              {attendeeService.getZones().map((zone) => {
                const percentage = (zone.currentOccupancy / zone.capacity) * 100;
                const alert = attendeeService.getAlertLevel(zone.id);

                return (
                  <div key={zone.id} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-3 h-3 bg-${alert.color}-500 rounded-full ${
                            alert.level === 'CRITICAL' ? 'animate-pulse' : ''
                          }`}
                        ></span>
                        <span className="text-white font-medium">{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm">
                          {zone.currentOccupancy} / {zone.capacity}
                        </span>
                        <span className={`text-sm font-semibold ${getUtilizationColor(percentage)}`}>
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-full rounded-full bg-${alert.color}-500 transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Updates Indicator */}
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span>Updates automatically when attendees check in/out</span>
          </div>
        </>
      )}
    </div>
  );
};

export default EventOverview;