// src/components/IncidentManagement.tsx
import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, MapPin, AlertOctagon } from 'lucide-react';
import { attendeeService } from '../services/attendeeService';

const IncidentManagement: React.FC = () => {
  const [riskData, setRiskData] = useState(attendeeService.getRiskAssessment());
  const [stats, setStats] = useState(attendeeService.getStats());

  useEffect(() => {
    const updateData = () => {
      setRiskData(attendeeService.getRiskAssessment());
      setStats(attendeeService.getStats());
    };

    updateData();
    const unsubscribe = attendeeService.subscribe(updateData);

    // Update every 15 seconds for risk assessment
    const interval = setInterval(updateData, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getRiskLevelConfig = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          color: 'red',
          bg: 'bg-red-500/20',
          border: 'border-red-500',
          text: 'text-red-400',
          icon: AlertOctagon,
          pulse: true,
        };
      case 'HIGH':
        return {
          color: 'orange',
          bg: 'bg-orange-500/20',
          border: 'border-orange-500',
          text: 'text-orange-400',
          icon: AlertTriangle,
          pulse: false,
        };
      case 'MEDIUM':
        return {
          color: 'amber',
          bg: 'bg-amber-500/20',
          border: 'border-amber-500',
          text: 'text-amber-400',
          icon: AlertTriangle,
          pulse: false,
        };
      default:
        return {
          color: 'emerald',
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500',
          text: 'text-emerald-400',
          icon: CheckCircle,
          pulse: false,
        };
    }
  };

  const riskConfig = getRiskLevelConfig(riskData.overallRiskLevel);
  const RiskIcon = riskConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 rounded-xl p-6 border border-red-500/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Risk Assessment</h1>
            <p className="text-red-200 text-sm">Predictive safety analytics based on real-time occupancy</p>
          </div>
        </div>
      </div>

      {/* No Data State */}
      {stats.checkedIn === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
          <Shield className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-white mb-2">Risk Assessment Inactive</h3>
          <p className="text-slate-400 mb-4">
            No attendees checked in. Risk analysis requires active attendance data.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">All zones safe - No current risk</span>
          </div>
        </div>
      ) : (
        <>
          {/* Overall Risk Status */}
          <div className={`bg-slate-800 rounded-xl p-6 border-2 ${riskConfig.border}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${riskConfig.bg} rounded-xl flex items-center justify-center ${riskConfig.pulse ? 'animate-pulse' : ''}`}>
                  <RiskIcon className={`w-8 h-8 ${riskConfig.text}`} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Overall Risk Level</p>
                  <p className={`text-3xl font-bold ${riskConfig.text}`}>
                    {riskData.overallRiskLevel}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-slate-400 text-sm mb-1">Incident Probability</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${riskConfig.text}`}>
                    {riskData.incidentProbability}
                  </span>
                  <span className="text-xl text-slate-400">%</span>
                </div>
              </div>
            </div>

            {riskData.overallRiskLevel !== 'LOW' && (
              <div className={`mt-4 p-3 ${riskConfig.bg} border ${riskConfig.border} rounded-lg`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${riskConfig.text}`} />
                  <p className={`font-medium ${riskConfig.text}`}>
                    {riskData.overallRiskLevel === 'CRITICAL'
                      ? '⚠️ CRITICAL: Immediate action required!'
                      : riskData.overallRiskLevel === 'HIGH'
                      ? '⚠️ HIGH RISK: Enhanced monitoring activated'
                      : '⚠️ Elevated risk levels detected'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* High Risk Zones */}
          {riskData.highRiskZones.length > 0 ? (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-semibold text-white">High Risk Zones</h3>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
                  {riskData.highRiskZones.length} Alert{riskData.highRiskZones.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {riskData.highRiskZones.map((zone) => {
                  const zoneConfig = getRiskLevelConfig(zone.riskLevel);
                  const ZoneIcon = zoneConfig.icon;
                  const percentage = (zone.occupancy / zone.capacity) * 100;

                  return (
                    <div
                      key={zone.id}
                      className={`bg-slate-700/50 rounded-lg p-5 border-2 ${zoneConfig.border} ${
                        zoneConfig.pulse ? 'animate-pulse' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <ZoneIcon className={`w-6 h-6 ${zoneConfig.text}`} />
                          <span className="text-white font-semibold">{zone.name}</span>
                        </div>
                        <span className={`px-3 py-1 ${zoneConfig.bg} ${zoneConfig.text} rounded-full text-sm font-bold`}>
                          {zone.riskLevel}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-sm">Occupancy</span>
                          <span className="text-white font-medium">
                            {zone.occupancy} / {zone.capacity}
                          </span>
                        </div>

                        <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full bg-${zoneConfig.color}-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className={zoneConfig.text}>{Math.round(percentage)}% Full</span>
                          <span className="text-slate-400">
                            {zone.capacity - zone.occupancy} available
                          </span>
                        </div>

                        {zone.riskLevel === 'CRITICAL' && (
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                              <AlertOctagon className="w-4 h-4" />
                              Immediate evacuation plan ready
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-xl p-6 border border-emerald-500/30">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-semibold text-white">All Zones Safe</h3>
              </div>
              <p className="text-slate-300">No high-risk zones detected. All areas operating within safe capacity limits.</p>
            </div>
          )}

          {/* Safety Recommendations */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-semibold text-white">Safety Recommendations</h3>
            </div>

            <div className="space-y-3">
              {riskData.recommendations.map((recommendation, index) => {
                const isUrgent = recommendation.includes('🚨') || recommendation.includes('URGENT');
                const isWarning = recommendation.includes('⚠️');

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-lg border ${
                      isUrgent
                        ? 'bg-red-500/10 border-red-500/30'
                        : isWarning
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-slate-700/50 border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isUrgent
                          ? 'bg-red-500/20 text-red-400'
                          : isWarning
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {isUrgent || isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                    <p
                      className={`flex-1 ${
                        isUrgent
                          ? 'text-red-300 font-semibold'
                          : isWarning
                          ? 'text-orange-300 font-medium'
                          : 'text-slate-300'
                      }`}
                    >
                      {recommendation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-400 text-sm">Total Zones</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {attendeeService.getZones().length}
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {riskData.highRiskZones.length} require attention
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-slate-400 text-sm">Active Attendees</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats.checkedIn}</div>
              <div className="text-slate-500 text-xs mt-1">
                of {stats.totalAttendees} registered
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-3">
                <Shield className={`w-5 h-5 ${riskConfig.text}`} />
                <span className="text-slate-400 text-sm">Risk Status</span>
              </div>
              <div className={`text-2xl font-bold ${riskConfig.text}`}>
                {riskData.overallRiskLevel}
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {riskData.incidentProbability}% probability
              </div>
            </div>
          </div>

          {/* Live Monitoring Indicator */}
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <div className={`w-2 h-2 ${riskConfig.color === 'red' ? 'bg-red-400' : 'bg-cyan-400'} rounded-full animate-pulse`}></div>
            <span>Risk assessment updates every 15 seconds based on zone occupancy</span>
          </div>
        </>
      )}
    </div>
  );
};

export default IncidentManagement;