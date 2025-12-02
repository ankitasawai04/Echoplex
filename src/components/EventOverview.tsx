import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Users, Clock, AlertTriangle, Camera, Bone as Drone, Activity, Zap, Shield} from 'lucide-react';
import ZoneIntelligenceOverview from './ZoneIntelligenceOverview';
;

const EventOverview: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'zones' > ('overview');
  const [crowdDensity, setCrowdDensity] = useState(0);
  const [weatherRisk, setWeatherRisk] = useState(0.15);
  const [securityScore, setSecurityScore] = useState(0.91);
  const [emergencyReadiness, setEmergencyReadiness] = useState(0.94);

  useEffect(() => {
    const interval = setInterval(() => {
      
      setWeatherRisk(prev => Math.max(0, Math.min(1, prev + (Math.random() - 0.5) * 0.02)));
      setSecurityScore(prev => Math.max(0.5, Math.min(1, prev + (Math.random() - 0.5) * 0.02)));
      setEmergencyReadiness(prev => Math.max(0.8, Math.min(1, prev + (Math.random() - 0.5) * 0.01)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (activeView === 'zones') {
    return (
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex space-x-4">
          
        </div>
        <ZoneIntelligenceOverview />
      </div>
    );
  }

  

  const [zoneStats, setZoneStats] = useState<any>(null);
const [loading, setLoading] = useState(true);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const eventId = 'EVT-2024-001';

// Zone definitions with capacities
const zoneDefinitions = [
  { id: 'ZONE-A', name: 'Main Entrance', capacity: 5000 },
  { id: 'ZONE-B', name: 'VIP Section', capacity: 500 },
  { id: 'ZONE-C', name: 'General Area', capacity: 10000 },
  { id: 'ZONE-D', name: 'Food Court', capacity: 2000 },
];

// Calculate total event capacity
const totalCapacity = zoneDefinitions.reduce((sum, zone) => sum + zone.capacity, 0);
// totalCapacity = 5000 + 500 + 10000 + 2000 = 17500

const fetchZoneData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/attendees/zones/${eventId}`);
    const data = await response.json();

    if (data.success) {
      setZoneStats(data.data);
      
      // Calculate and update crowd density
      const totalCheckedIn = data.data.totalCheckedIn || 0;
      const density = totalCheckedIn / totalCapacity;
      setCrowdDensity(density);
    }
  } catch (error) {
    console.error('Failed to fetch zone data:', error);
  } finally {
    setLoading(false);
  }
};

const getCrowdDensityStatus = (density: number) => {
  const percentage = density * 100;
  
  if (percentage >= 80) {
    return { 
      label: 'Critical Level', 
      color: 'text-red-400', 
      bgColor: 'bg-red-500' 
    };
  } else if (percentage >= 60) {
    return { 
      label: 'High Level', 
      color: 'text-amber-400', 
      bgColor: 'bg-amber-500' 
    };
  } else if (percentage >= 40) {
    return { 
      label: 'Moderate Level', 
      color: 'text-yellow-400', 
      bgColor: 'bg-yellow-500' 
    };
  } else {
    return { 
      label: 'Low Level', 
      color: 'text-emerald-400', 
      bgColor: 'bg-emerald-500' 
    };
  }
};


useEffect(() => {
  fetchZoneData();
  const interval = setInterval(fetchZoneData, 5000); // Refresh every 5 seconds
  return () => clearInterval(interval);
}, []);

const getRiskLevel = (current: number, capacity: number) => {
  const percentage = (current / capacity) * 100;
  if (percentage >= 80) return 'high';
  if (percentage >= 50) return 'medium';
  return 'low';
};

const getTrend = (current: number, capacity: number) => {
  const percentage = (current / capacity) * 100;
  if (percentage >= 80) return 'increasing';
  if (percentage >= 50) return 'stable';
  return 'decreasing';
};

const getPercentageFull = (current: number, capacity: number) => {
  return Math.min(Math.round((current / capacity) * 100), 100);
};

  /*const getZoneColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'from-red-500 to-red-600';
      case 'medium': return 'from-amber-500 to-amber-600';
      default: return 'from-emerald-500 to-emerald-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '➡️';
    }
  };*/

  const aiInsights = [
    {
      priority: 'High',
      type: 'Crowd Surge Prediction',
      message: 'Main Stage expected to reach critical density in 12 minutes',
      confidence: 89,
      action: 'Deploy overflow management'
    },
    {
      priority: 'Medium',
      type: 'Weather Alert',
      message: 'Light precipitation possible in 45 minutes',
      confidence: 67,
      action: 'Prepare covered areas'
    },
    {
      priority: 'Low',
      type: 'Resource Optimization',
      message: 'Medical team reallocation recommended for Food Court',
      confidence: 78,
      action: 'Reassign MED-03'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-cyan-900/60 to-cyan-800/40 rounded-xl p-6 border border-cyan-700/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-cyan-300">Crowd Density</p>
            
              <p className="text-3xl font-bold text-white">{Math.round(crowdDensity * 100)}%</p>
            </div>
            <Users className="h-10 w-10 text-cyan-400" />
          </div>
          <div className="w-full bg-cyan-900/30 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                crowdDensity >= 0.8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                crowdDensity >= 0.6 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                crowdDensity >= 0.4 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                'bg-gradient-to-r from-emerald-500 to-emerald-600'
              }`}
              style={{ width: `${crowdDensity * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-cyan-300 mt-2">
            {crowdDensity >= 0.8 ? 'Critical Level' : crowdDensity >= 0.6 ? 'High Level' : crowdDensity >= 0.4 ? 'Moderate Level' : 'Low Level'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/60 to-amber-800/40 rounded-xl p-6 border border-amber-700/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-amber-300">Weather Risk</p>
              <p className="text-3xl font-bold text-white">{Math.round(weatherRisk * 100)}%</p>
            </div>
            <TrendingUp className="h-10 w-10 text-amber-400" />
          </div>
          <div className="w-full bg-amber-900/30 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                weatherRisk > 0.5 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                weatherRisk > 0.3 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                'bg-gradient-to-r from-emerald-500 to-emerald-600'
              }`}
              style={{ width: `${weatherRisk * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-amber-300 mt-2">
            {weatherRisk > 0.5 ? 'High Risk' : weatherRisk > 0.3 ? 'Moderate Risk' : 'Low Risk'}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/60 to-emerald-800/40 rounded-xl p-6 border border-emerald-700/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-emerald-300">Security Score</p>
              <p className="text-3xl font-bold text-white">{Math.round(securityScore * 100)}%</p>
            </div>
            <Shield className="h-10 w-10 text-emerald-400" />
          </div>
          <div className="w-full bg-emerald-900/30 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${securityScore * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-emerald-300 mt-2">Excellent Status</div>
        </div>

        <div className="bg-gradient-to-br from-teal-900/60 to-teal-800/40 rounded-xl p-6 border border-teal-700/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-teal-300">Emergency Readiness</p>
              <p className="text-3xl font-bold text-white">{Math.round(emergencyReadiness * 100)}%</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-teal-400" />
          </div>
          <div className="w-full bg-teal-900/30 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-500"
              style={{ width: `${emergencyReadiness * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-teal-300 mt-2">All Systems Ready</div>
        </div>
      </div>

      {/* AI-Powered Insights */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold mb-6 flex items-center">
          <Zap className="h-6 w-6 mr-3 text-cyan-400" />
          AI-Powered Predictive Insights
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {aiInsights.map((insight, index) => (
            <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  insight.priority === 'High' ? 'bg-red-900/40 text-red-400' :
                  insight.priority === 'Medium' ? 'bg-amber-900/40 text-amber-400' :
                  'bg-cyan-900/40 text-cyan-400'
                }`}>
                  {insight.priority}
                </span>
                <span className="text-xs text-slate-400">{insight.confidence}% confidence</span>
              </div>
              <div className="text-sm font-medium text-cyan-400 mb-2">{insight.type}</div>
              <div className="text-sm text-slate-300 mb-3">{insight.message}</div>
              <button className="text-xs bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 px-3 py-1 rounded-full transition-colors">
                {insight.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Zone Status */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <MapPin className="h-6 w-6 mr-3 text-cyan-400" />
            Zone Intelligence Overview
          </h3>
          <div className="flex space-x-3">
           
              
              
            
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zoneDefinitions.map((zone) => {
  const currentAttendees = zoneStats?.zones[zone.name] || 0;
  const percentageFull = getPercentageFull(currentAttendees, zone.capacity);
  const risk = getRiskLevel(currentAttendees, zone.capacity);
  const trend = getTrend(currentAttendees, zone.capacity);

  return (
    <div key={zone.id} className="bg-slate-700 rounded-xl p-5 border border-slate-600">
      {/* Zone Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{zone.name}</h3>
        <div className="flex items-center gap-2">
          {risk === 'high' && (
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          )}
          {risk === 'medium' && (
            <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
          )}
          {risk === 'low' && (
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
          )}
        </div>
      </div>

      {/* Occupancy */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {currentAttendees.toLocaleString()}
          </span>
          <span className="text-slate-400 text-sm">
            / {zone.capacity.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-slate-600 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              risk === 'high' 
                ? 'bg-red-500' 
                : risk === 'medium' 
                ? 'bg-amber-500' 
                : 'bg-emerald-500'
            }`}
            style={{ width: `${percentageFull}%` }}
          ></div>
        </div>
      </div>

      {/* Risk and Percentage */}
      <div className="flex items-center justify-between">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
            risk === 'high'
              ? 'bg-red-500/20 text-red-400'
              : risk === 'medium'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {risk} RISK
        </span>
        <span className="text-slate-400 text-sm">{percentageFull}% full</span>
      </div>
    </div>
  );
})}
          
        </div>
        
        
        
      </div>

      {/* Enhanced Live Feeds and Drone Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <Camera className="h-6 w-6 mr-3 text-cyan-400" />
            Live AI Camera Network
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            
            {[1, 2, 3, 4].map((i) => (
  <div key={i} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
    <div className="bg-slate-600/50 h-24 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
      {i === 1 ? (
        // Camera 1 - shows video
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          src="public/videos/sample-camera-1.mp4"
        />
      ) : (
        // Cameras 2, 3, 4 - show icon
        <Camera className="h-8 w-8 text-slate-400" />
      )}
      <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
    </div>
    <div className="text-sm text-slate-300 font-medium">Camera {i}</div>
    <div className="text-xs text-emerald-400">AI Processing Active</div>
  </div>
))}
            
          </div>
          <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-700/30">
            <div className="text-sm text-cyan-400 font-medium">Network Status</div>
            <div className="text-xs text-slate-300">47/50 cameras online • 94% uptime • AI analysis: Active</div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <Drone className="h-6 w-6 mr-3 text-cyan-400" />
            Autonomous Drone Fleet
          </h3>
          <div className="space-y-4">
            {[
              { id: 'D-001', location: 'Main Stage Perimeter', battery: 85, status: 'Patrolling', mission: 'Crowd monitoring' },
              { id: 'D-002', location: 'Food Court Area', battery: 62, status: 'Investigating', mission: 'Anomaly response' },
              { id: 'D-003', location: 'VIP Section', battery: 91, status: 'Standby', mission: 'Ready for dispatch' },
              { id: 'D-004', location: 'Base Station', battery: 23, status: 'Charging', mission: 'Battery replacement' },
            ].map((drone) => (
              <div key={drone.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <Drone className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-white">{drone.id}</span>
                      <div className="text-xs text-slate-400">{drone.mission}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    drone.status === 'Patrolling' ? 'bg-emerald-900/40 text-emerald-400' :
                    drone.status === 'Investigating' ? 'bg-amber-900/40 text-amber-400' :
                    drone.status === 'Standby' ? 'bg-cyan-900/40 text-cyan-400' :
                    'bg-slate-900/40 text-slate-400'
                  }`}>
                    {drone.status}
                  </span>
                </div>
                <div className="text-sm text-slate-300 mb-2">{drone.location}</div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Battery</span>
                      <span>{drone.battery}%</span>
                    </div>
                    <div className="w-full bg-slate-600/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          drone.battery > 50 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 
                          drone.battery > 20 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                          'bg-gradient-to-r from-red-500 to-red-600'
                        }`}
                        style={{ width: `${drone.battery}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventOverview;