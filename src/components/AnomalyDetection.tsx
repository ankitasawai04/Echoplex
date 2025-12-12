/*import React, { useState, useEffect } from 'react';
import { Zap, Camera, AlertTriangle, TrendingUp, Eye, Activity, Flame, Wind, Brain, Cpu } from 'lucide-react';

interface Anomaly {
  id: string;
  type: 'crowd-surge' | 'smoke' | 'fire' | 'panic' | 'structural' | 'weather' | 'suspicious-activity';
  confidence: number;
  location: string;
  timestamp: Date;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'confirmed' | 'resolved';
  source: string;
  coordinates?: { x: number; y: number };
  aiModel: string;
  processingTime: number;
}

const AnomalyDetection: React.FC = () => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: 'ANO-001',
      type: 'crowd-surge',
      confidence: 0.89,
      location: 'Main Stage - Front Barrier',
      timestamp: new Date(Date.now() - 180000),
      description: 'Unusual crowd movement pattern detected indicating potential surge',
      severity: 'high',
      status: 'investigating',
      source: 'Vertex AI Vision',
      aiModel: 'Crowd Dynamics CNN v2.1',
      processingTime: 0.3
    },
    {
      id: 'ANO-002',
      type: 'smoke',
      confidence: 0.76,
      location: 'Food Court - Vendor Area',
      timestamp: new Date(Date.now() - 360000),
      description: 'Smoke detected from thermal imaging analysis',
      severity: 'medium',
      status: 'confirmed',
      source: 'Gemini Multimodal',
      aiModel: 'Fire Detection Transformer',
      processingTime: 0.2
    },
    {
      id: 'ANO-003',
      type: 'suspicious-activity',
      confidence: 0.94,
      location: 'VIP Entrance',
      timestamp: new Date(Date.now() - 600000),
      description: 'Unauthorized access pattern detected',
      severity: 'critical',
      status: 'resolved',
      source: 'Vertex AI Agent',
      aiModel: 'Behavioral Analysis BERT',
      processingTime: 0.1
    }
  ]);

  const [detectionMetrics, setDetectionMetrics] = useState({
    totalDetections: 27,
    accuracy: 0.92,
    falsePositives: 0.08,
    avgResponseTime: 1.4,
    modelsActive: 8,
    processingCapacity: 0.73
  });

  const [systemHealth, setSystemHealth] = useState({
    vertexAI: 0.97,
    geminiProcessing: 0.94,
    imagenAnalysis: 0.91,
    modelGarden: 0.89,
    networkLatency: 12,
    gpuUtilization: 0.73
  });

  const [aiModels, setAiModels] = useState([
    {
      name: 'Crowd Dynamics CNN',
      version: 'v2.1',
      status: 'active',
      accuracy: 0.94,
      processingSpeed: '15ms',
      framework: 'Vertex AI'
    },
    {
      name: 'Fire Detection Transformer',
      version: 'v1.8',
      status: 'active',
      accuracy: 0.91,
      processingSpeed: '8ms',
      framework: 'Gemini Vision'
    },
    {
      name: 'Behavioral Analysis BERT',
      version: 'v3.0',
      status: 'active',
      accuracy: 0.96,
      processingSpeed: '12ms',
      framework: 'Vertex AI Agent'
    },
    {
      name: 'Multimodal Fusion Model',
      version: 'v1.5',
      status: 'training',
      accuracy: 0.88,
      processingSpeed: '20ms',
      framework: 'Model Garden'
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new anomaly detection
      if (Math.random() < 0.1) {
        const newAnomaly: Anomaly = {
          id: `ANO-${String(anomalies.length + 1).padStart(3, '0')}`,
          type: ['crowd-surge', 'smoke', 'panic', 'suspicious-activity'][Math.floor(Math.random() * 4)] as any,
          confidence: Math.random() * 0.4 + 0.6,
          location: ['Main Stage', 'Food Court', 'West Gate', 'VIP Area'][Math.floor(Math.random() * 4)],
          timestamp: new Date(),
          description: 'AI-detected anomaly requiring investigation',
          severity: Math.random() > 0.5 ? 'medium' : 'high',
          status: 'detected',
          source: ['Vertex AI Vision', 'Gemini Multimodal', 'Vertex AI Agent'][Math.floor(Math.random() * 3)],
          aiModel: ['Crowd Dynamics CNN', 'Fire Detection Transformer', 'Behavioral Analysis BERT'][Math.floor(Math.random() * 3)],
          processingTime: Math.random() * 0.5 + 0.1
        };
        setAnomalies(prev => [newAnomaly, ...prev.slice(0, 9)]);
      }

      // Update system metrics
      setSystemHealth(prev => ({
        vertexAI: Math.max(0.8, Math.min(1, prev.vertexAI + (Math.random() - 0.5) * 0.05)),
        geminiProcessing: Math.max(0.85, Math.min(1, prev.geminiProcessing + (Math.random() - 0.5) * 0.03)),
        imagenAnalysis: Math.max(0.8, Math.min(1, prev.imagenAnalysis + (Math.random() - 0.5) * 0.04)),
        modelGarden: Math.max(0.75, Math.min(1, prev.modelGarden + (Math.random() - 0.5) * 0.03)),
        networkLatency: Math.max(5, Math.min(50, prev.networkLatency + (Math.random() - 0.5) * 5)),
        gpuUtilization: Math.max(0.3, Math.min(0.9, prev.gpuUtilization + (Math.random() - 0.5) * 0.1))
      }));

      // Update detection metrics
      setDetectionMetrics(prev => ({
        ...prev,
        totalDetections: prev.totalDetections + (Math.random() > 0.8 ? 1 : 0),
        accuracy: Math.max(0.85, Math.min(0.98, prev.accuracy + (Math.random() - 0.5) * 0.01)),
        processingCapacity: Math.max(0.4, Math.min(0.9, prev.processingCapacity + (Math.random() - 0.5) * 0.05))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [anomalies.length]);

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'crowd-surge': return '👥';
      case 'smoke': return '💨';
      case 'fire': return '🔥';
      case 'panic': return '😰';
      case 'structural': return '🏗️';
      case 'weather': return '⛈️';
      case 'suspicious-activity': return '🔍';
      default: return '⚠️';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'bg-cyan-900/20 text-cyan-400';
      case 'investigating': return 'bg-amber-900/20 text-amber-400';
      case 'confirmed': return 'bg-red-900/20 text-red-400';
      case 'resolved': return 'bg-emerald-900/20 text-emerald-400';
      default: return 'bg-slate-900/20 text-slate-400';
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400';
      case 'training': return 'text-amber-400';
      case 'updating': return 'text-cyan-400';
      default: return 'text-slate-400';
    }
  };

  const handleStatusChange = (id: string, newStatus: Anomaly['status']) => {
    setAnomalies(prev => prev.map(anomaly => 
      anomaly.id === id ? { ...anomaly, status: newStatus } : anomaly
    ));
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Detection Metrics with Google AI Stack */
      /*<div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 rounded-xl p-6 border border-cyan-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-300">Total Detections</p>
              <p className="text-2xl font-bold text-white">{detectionMetrics.totalDetections}</p>
            </div>
            <Eye className="h-8 w-8 text-cyan-400" />
          </div>
          <div className="text-sm text-cyan-300">Last 24 hours</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl p-6 border border-emerald-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-300">AI Accuracy</p>
              <p className="text-2xl font-bold text-white">{Math.round(detectionMetrics.accuracy * 100)}%</p>
            </div>
            <Brain className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="text-sm text-emerald-300">Model Performance</div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-xl p-6 border border-amber-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-300">False Positives</p>
              <p className="text-2xl font-bold text-white">{Math.round(detectionMetrics.falsePositives * 100)}%</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          </div>
          <div className="text-sm text-amber-300">Quality Control</div>
        </div>

        <div className="bg-gradient-to-br from-teal-900/50 to-teal-800/30 rounded-xl p-6 border border-teal-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-300">Response Time</p>
              <p className="text-2xl font-bold text-white">{detectionMetrics.avgResponseTime.toFixed(1)}s</p>
            </div>
            <Zap className="h-8 w-8 text-teal-400" />
          </div>
          <div className="text-sm text-teal-300">Average</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl p-6 border border-indigo-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-300">Active Models</p>
              <p className="text-2xl font-bold text-white">{detectionMetrics.modelsActive}</p>
            </div>
            <Cpu className="h-8 w-8 text-indigo-400" />
          </div>
          <div className="text-sm text-indigo-300">Google AI Stack</div>
        </div>

        <div className="bg-gradient-to-br from-violet-900/50 to-violet-800/30 rounded-xl p-6 border border-violet-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-violet-300">Processing Load</p>
              <p className="text-2xl font-bold text-white">{Math.round(detectionMetrics.processingCapacity * 100)}%</p>
            </div>
            <Activity className="h-8 w-8 text-violet-400" />
          </div>
          <div className="text-sm text-violet-300">Capacity Used</div>
        </div>
      </div>

      {/* Google AI Stack Health Monitor}
      /*<div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-cyan-400" />
          Google AI Stack Health Monitor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Vertex AI Processing</span>
              <span className="text-sm font-medium text-white">{Math.round(systemHealth.vertexAI * 100)}%</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-300"
                style={{ width: `${systemHealth.vertexAI * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 mt-1">Vision & Forecasting</div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Gemini Multimodal</span>
              <span className="text-sm font-medium text-white">{Math.round(systemHealth.geminiProcessing * 100)}%</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-300"
                style={{ width: `${systemHealth.geminiProcessing * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 mt-1">Language & Vision</div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Imagen Analysis</span>
              <span className="text-sm font-medium text-white">{Math.round(systemHealth.imagenAnalysis * 100)}%</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                style={{ width: `${systemHealth.imagenAnalysis * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 mt-1">Image Generation</div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Model Garden</span>
              <span className="text-sm font-medium text-white">{Math.round(systemHealth.modelGarden * 100)}%</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${systemHealth.modelGarden * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 mt-1">Custom Models</div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Network Latency</span>
              <span className="text-sm font-medium text-white">{Math.round(systemHealth.networkLatency)}ms</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  systemHealth.networkLatency > 30 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                  systemHealth.networkLatency > 15 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                  'bg-gradient-to-r from-emerald-500 to-emerald-600'
                }`}
                style={{ width: `${Math.min(100, (50 - systemHealth.networkLatency) * 2)}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 mt-1">Cloud Connectivity</div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">GPU Utilization</span>
              <span className="text-sm font-medium text-white">{Math.round(systemHealth.gpuUtilization * 100)}%</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-300"
                style={{ width: `${systemHealth.gpuUtilization * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-400 mt-1">Compute Resources</div>
          </div>
        </div>
      </div>

      {/* AI Model Performance Dashboard */
      /*<div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Cpu className="h-5 w-5 mr-2 text-cyan-400" />
          AI Model Performance Dashboard
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aiModels.map((model, index) => (
            <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium text-white">{model.name}</div>
                  <div className="text-sm text-slate-400">{model.framework} • {model.version}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getModelStatusColor(model.status)}`}>
                  {model.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Accuracy: </span>
                  <span className="text-white font-medium">{Math.round(model.accuracy * 100)}%</span>
                </div>
                <div>
                  <span className="text-slate-400">Speed: </span>
                  <span className="text-white font-medium">{model.processingSpeed}</span>
                </div>
              </div>
              <div className="mt-3 w-full bg-slate-600 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-600 transition-all duration-300"
                  style={{ width: `${model.accuracy * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Anomaly Detection Feed */
      /*<div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-cyan-400" />
          Live Multimodal Anomaly Detection Feed
        </h3>
        <div className="space-y-4">
          {anomalies.map((anomaly) => (
            <div key={anomaly.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getAnomalyIcon(anomaly.type)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{anomaly.id}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(anomaly.status)}`}>
                        {anomaly.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {anomaly.timestamp.toLocaleTimeString()} • {anomaly.source} • {anomaly.processingTime.toFixed(2)}s
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Confidence</div>
                    <div className="text-lg font-bold text-white">{Math.round(anomaly.confidence * 100)}%</div>
                  </div>
                  <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center">
                    <Camera className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Location</div>
                  <div className="text-white">{anomaly.location}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">AI Model</div>
                  <div className="text-white">{anomaly.aiModel}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Type</div>
                  <div className="text-white capitalize">{anomaly.type.replace('-', ' ')}</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-slate-400 mb-1">AI Analysis</div>
                <div className="text-white">{anomaly.description}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="w-full bg-slate-600 rounded-full h-2 mr-4">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      anomaly.confidence > 0.8 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 
                      anomaly.confidence > 0.6 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                      'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${anomaly.confidence * 100}%` }}
                  ></div>
                </div>
                <div className="flex space-x-2">
                  {anomaly.status === 'detected' && (
                    <button
                      onClick={() => handleStatusChange(anomaly.id, 'investigating')}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Investigate
                    </button>
                  )}
                  {anomaly.status === 'investigating' && (
                    <button
                      onClick={() => handleStatusChange(anomaly.id, 'confirmed')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                  {anomaly.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(anomaly.id, 'resolved')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetection; */