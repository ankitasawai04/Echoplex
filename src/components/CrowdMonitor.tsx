import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, MapPin, Clock, Activity, Brain, Zap, Eye, Target, Waves } from 'lucide-react';

interface MLPrediction {
  location: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  eta: string;
  probability: number;
  confidence: number;
  aiReasoning: string;
  mitigationSteps: string[];
}

interface AdvancedCrowdMetrics {
  density: number;
  velocity: number;
  bottleneckRisk: number;
  flowRate: number;
  entropyIndex: number; // Measure of crowd chaos
  pressurePoints: number;
  panicIndicator: number;
  congestionScore: number;
}

const CrowdMonitor: React.FC = () => {
  const [crowdData, setCrowdData] = useState<AdvancedCrowdMetrics>({
    density: 0.72,
    velocity: 1.2,
    bottleneckRisk: 0.34,
    flowRate: 850,
    entropyIndex: 0.42,
    pressurePoints: 3,
    panicIndicator: 0.08,
    congestionScore: 67,
  });

  const [predictions, setPredictions] = useState<MLPrediction[]>([
    { 
      location: 'Main Stage Exit', 
      risk: 'high', 
      eta: '12 min', 
      probability: 0.87,
      confidence: 94.2,
      aiReasoning: 'ML model detected exponential density increase pattern matching historical stampede precursors',
      mitigationSteps: [
        'Deploy 4 crowd control staff immediately',
        'Open alternative West Wing exit route',
        'Broadcast navigation guidance via PA system'
      ]
    },
    { 
      location: 'Food Court Bridge', 
      risk: 'medium', 
      eta: '18 min', 
      probability: 0.64,
      confidence: 88.5,
      aiReasoning: 'Computer vision detected cluster formation + slow movement velocity combination',
      mitigationSteps: [
        'Position 2 staff for traffic direction',
        'Monitor for aggravation signs',
        'Prepare overflow seating area'
      ]
    },
    { 
      location: 'West Gate Queue', 
      risk: 'low', 
      eta: '25 min', 
      probability: 0.23,
      confidence: 76.8,
      aiReasoning: 'Flow patterns normal, adequate space buffer detected',
      mitigationSteps: [
        'Continue standard monitoring',
        'Queue management protocol active'
      ]
    },
  ]);

  const [aiInsights, setAiInsights] = useState<string[]>([
    '🧠 Neural network detected unusual movement pattern at Main Stage - 87% probability of bottleneck in 12 minutes',
    '🎯 Predictive model recommends opening West Wing exit to reduce Main Stage congestion by 34%',
    '📊 Computer vision analysis: 3 high-pressure points detected across venue',
    '⚡ Real-time optimization: Suggest redirecting 150 people to reduce critical density',
    '🔮 Time-series forecast: Peak crowd density expected at 3:42 PM (89% confidence)'
  ]);

  const [behaviorAlerts, setBehaviorAlerts] = useState([
    { type: 'running', location: 'North Corridor', severity: 'medium', count: 3 },
    { type: 'clustering', location: 'Main Exit', severity: 'high', count: 47 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate advanced AI metrics with more realistic patterns
      setCrowdData(prev => {
        const newDensity = Math.max(0.1, Math.min(1, prev.density + (Math.random() - 0.5) * 0.05));
        const newVelocity = Math.max(0.1, Math.min(3, prev.velocity + (Math.random() - 0.5) * 0.1));
        
        return {
          density: newDensity,
          velocity: newVelocity,
          bottleneckRisk: Math.max(0, Math.min(1, prev.bottleneckRisk + (Math.random() - 0.5) * 0.05)),
          flowRate: Math.max(100, Math.min(1500, prev.flowRate + Math.floor((Math.random() - 0.5) * 50))),
          entropyIndex: Math.max(0, Math.min(1, newDensity * 0.5 + (Math.random() - 0.5) * 0.1)),
          pressurePoints: Math.floor(Math.random() * 5) + 1,
          panicIndicator: Math.max(0, Math.min(1, (1 - newVelocity / 3) * newDensity * Math.random())),
          congestionScore: Math.round(newDensity * 100 * (1 + Math.random() * 0.3)),
        };
      });

      // Simulate AI prediction updates
      if (Math.random() > 0.7) {
        setPredictions(prev => prev.map(p => ({
          ...p,
          probability: Math.max(0, Math.min(1, p.probability + (Math.random() - 0.5) * 0.1)),
          confidence: Math.max(70, Math.min(99, p.confidence + (Math.random() - 0.5) * 2))
        })));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-500';
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-500';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500';
      default: return 'text-green-400 bg-green-900/30 border-green-500';
    }
  };

  const getMetricStatus = (value: number, thresholds: {critical: number, high: number, medium: number}) => {
    if (value >= thresholds.critical) return { level: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (value >= thresholds.high) return { level: 'High', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    if (value >= thresholds.medium) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'Normal', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  // Enhanced heatmap with more granular data
  const heatmapData = Array(12).fill(0).map((_, i) => 
    Array(12).fill(0).map((_, j) => {
      const baseValue = Math.sin(i / 2) * Math.cos(j / 2) * 0.5 + 0.5;
      return Math.max(0, Math.min(1, baseValue + Math.random() * 0.2));
    })
  );

  const getHeatColor = (value: number) => {
    if (value > 0.8) return 'bg-red-500';
    if (value > 0.6) return 'bg-orange-500';
    if (value > 0.4) return 'bg-yellow-500';
    if (value > 0.2) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const densityStatus = getMetricStatus(crowdData.density, { critical: 0.85, high: 0.7, medium: 0.5 });
  const panicStatus = getMetricStatus(crowdData.panicIndicator, { critical: 0.7, high: 0.4, medium: 0.2 });

  return (
    <div className="space-y-6">
      {/* AI Status Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
            <div>
              <h2 className="text-2xl font-bold text-white">AI Crowd Intelligence</h2>
              <p className="text-slate-300 text-sm">Real-time ML analysis • Computer Vision • Predictive Modeling</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-semibold text-sm">AI Active</span>
          </div>
        </div>
      </div>

      {/* AI Insights Feed */}
      <div className="bg-gray-800 rounded-xl p-6 border border-cyan-500/30">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-6 w-6 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Live AI Insights</h3>
          <span className="ml-auto text-xs text-slate-400">Updated 2s ago</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {aiInsights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-slate-700/50 rounded-lg p-3 border border-slate-600 hover:border-cyan-500/50 transition-all">
              <Eye className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <p className="text-slate-200 text-sm">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Real-time Crowd Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <Users className="h-7 w-7 text-blue-400" />
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${densityStatus.bg} ${densityStatus.color}`}>
              {densityStatus.level}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-1">Crowd Density</p>
          <p className="text-2xl font-bold text-white">{Math.round(crowdData.density * 100)}%</p>
          <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                crowdData.density > 0.8 ? 'bg-red-500' : 
                crowdData.density > 0.6 ? 'bg-orange-500' : 
                crowdData.density > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${crowdData.density * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">ML Confidence: 94.2%</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="h-7 w-7 text-green-400" />
            <span className="text-xs text-slate-400">m/s</span>
          </div>
          <p className="text-sm text-gray-400 mb-1">Crowd Velocity</p>
          <p className="text-2xl font-bold text-white">{crowdData.velocity.toFixed(1)}</p>
          <div className="text-xs text-gray-400 mt-2">
            {crowdData.velocity > 2 ? '🏃 Fast Movement' : crowdData.velocity > 1 ? '🚶 Moderate' : '🐌 Slow Flow'}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="h-7 w-7 text-yellow-400" />
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              crowdData.bottleneckRisk > 0.7 ? 'bg-red-500/20 text-red-400' :
              crowdData.bottleneckRisk > 0.4 ? 'bg-yellow-500/20 text-yellow-400' : 
              'bg-green-500/20 text-green-400'
            }`}>
              {crowdData.bottleneckRisk > 0.7 ? 'High' : crowdData.bottleneckRisk > 0.4 ? 'Med' : 'Low'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-1">Bottleneck Risk</p>
          <p className="text-2xl font-bold text-white">{Math.round(crowdData.bottleneckRisk * 100)}%</p>
          <p className="text-xs text-slate-500 mt-2">{crowdData.pressurePoints} pressure points</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <Activity className="h-7 w-7 text-purple-400" />
            <Waves className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-sm text-gray-400 mb-1">Flow Rate</p>
          <p className="text-2xl font-bold text-white">{crowdData.flowRate}</p>
          <div className="text-xs text-gray-400 mt-2">people/min</div>
        </div>

        {/* NEW: Advanced AI Metrics */}
        <div className="bg-gray-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <Brain className="h-7 w-7 text-cyan-400" />
            <span className="text-xs text-slate-400">AI</span>
          </div>
          <p className="text-sm text-gray-400 mb-1">Entropy Index</p>
          <p className="text-2xl font-bold text-white">{crowdData.entropyIndex.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-2">Crowd chaos measure</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className={`h-7 w-7 ${panicStatus.color}`} />
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${panicStatus.bg} ${panicStatus.color}`}>
              {panicStatus.level}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-1">Panic Indicator</p>
          <p className="text-2xl font-bold text-white">{Math.round(crowdData.panicIndicator * 100)}%</p>
          <p className="text-xs text-slate-500 mt-2">Behavioral AI analysis</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <Target className="h-7 w-7 text-orange-400" />
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <p className="text-sm text-gray-400 mb-1">Congestion Score</p>
          <p className="text-2xl font-bold text-white">{crowdData.congestionScore}</p>
          <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
              style={{ width: `${crowdData.congestionScore}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <MapPin className="h-7 w-7 text-red-400" />
            <span className="text-xs text-red-400 font-bold">LIVE</span>
          </div>
          <p className="text-sm text-gray-400 mb-1">Pressure Points</p>
          <p className="text-2xl font-bold text-white">{crowdData.pressurePoints}</p>
          <p className="text-xs text-slate-500 mt-2">Detected by CV</p>
        </div>
      </div>

      {/* Behavioral Alerts */}
      {behaviorAlerts.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-6 w-6 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Behavioral Analysis Alerts</h3>
            <span className="ml-auto px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
              {behaviorAlerts.length} Active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {behaviorAlerts.map((alert, idx) => (
              <div key={idx} className="bg-slate-700 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold capitalize">{alert.type}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    alert.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-400">Location: {alert.location}</p>
                <p className="text-sm text-slate-400">Detected: {alert.count} instances</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ML Predictive Bottleneck Analysis */}
      <div className="bg-gray-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">ML Predictive Bottleneck Analysis</h3>
          </div>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
            Neural Network
          </span>
        </div>
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={index} className={`bg-gray-700 rounded-lg p-5 border-2 ${getRiskColor(prediction.risk)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold text-white text-lg">{prediction.location}</span>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getRiskColor(prediction.risk)}`}>
                  {prediction.risk.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-800 rounded p-3">
                  <span className="text-gray-400 text-xs block mb-1">ETA</span>
                  <span className="text-white font-bold text-lg">{prediction.eta}</span>
                </div>
                <div className="bg-slate-800 rounded p-3">
                  <span className="text-gray-400 text-xs block mb-1">Probability</span>
                  <span className="text-white font-bold text-lg">{Math.round(prediction.probability * 100)}%</span>
                </div>
                <div className="bg-slate-800 rounded p-3">
                  <span className="text-gray-400 text-xs block mb-1">ML Confidence</span>
                  <span className="text-cyan-400 font-bold text-lg">{prediction.confidence}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-600 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      prediction.probability > 0.7 ? 'bg-red-500' : 
                      prediction.probability > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${prediction.probability * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Brain className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-cyan-400 font-semibold text-sm mb-1">AI Analysis:</p>
                    <p className="text-slate-300 text-sm">{prediction.aiReasoning}</p>
                  </div>
                </div>
              </div>

              {/* Mitigation Steps */}
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  Recommended Actions:
                </p>
                <ul className="space-y-1">
                  {prediction.mitigationSteps.map((step, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Crowd Density Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Computer Vision Heatmap</h3>
            </div>
            <span className="text-xs text-slate-400">Real-time</span>
          </div>
          <div className="grid grid-cols-12 gap-0.5 mb-4">
            {heatmapData.map((row, i) => 
              row.map((value, j) => (
                <div 
                  key={`${i}-${j}`}
                  className={`aspect-square rounded-sm ${getHeatColor(value)} transition-all duration-500`}
                  style={{ opacity: 0.4 + value * 0.6 }}
                  title={`Density: ${Math.round(value * 100)}%`}
                ></div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              Low
            </span>
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              Safe
            </span>
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              Moderate
            </span>
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              Critical
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            Powered by YOLOv8 + Custom CNN Model
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Waves className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Real-time Flow Patterns</h3>
          </div>
          <div className="space-y-3">
            {[
              { zone: 'Main Stage', flow: 'Inbound Heavy', trend: 'up', value: 89, velocity: 0.8 },
              { zone: 'Food Court', flow: 'Balanced', trend: 'stable', value: 45, velocity: 1.2 },
              { zone: 'Exit Gates', flow: 'Outbound Light', trend: 'down', value: 23, velocity: 2.1 },
              { zone: 'VIP Area', flow: 'Minimal', trend: 'stable', value: 12, velocity: 0.5 },
            ].map((item, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-white font-semibold">{item.zone}</div>
                    <div className="text-sm text-gray-400">{item.flow}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">{item.value}%</div>
                    <div className={`text-xs font-semibold ${
                      item.trend === 'up' ? 'text-red-400' : 
                      item.trend === 'down' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'} {item.velocity} m/s
                    </div>
                  </div>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      item.value > 70 ? 'bg-red-500' : 
                      item.value > 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Status Footer */}
      <div className="flex items-center justify-center gap-3 text-slate-500 text-sm">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        <span>AI models updating every 3 seconds • Neural Network Accuracy: 94.2% • Last trained: 2 hours ago</span>
      </div>
    </div>
  );
};

export default CrowdMonitor;