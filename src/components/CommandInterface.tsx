import React, { useState, useEffect } from 'react';
import { Send, Mic, MicOff, Brain, Zap, MessageSquare, Clock, TrendingUp, AlertTriangle, Cpu, Eye } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    actionItems?: string[];
    processingTime?: number;
    aiModel?: string;
  };
}

interface QuickQuery {
  id: string;
  label: string;
  query: string;
  category: 'security' | 'crowd' | 'resources' | 'incidents' | 'prediction';
}

const CommandInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Good evening! I\'m Echoplex AI, your autonomous event safety intelligence system powered by Google\'s advanced AI stack. I continuously learn from real-time data, reason through complex scenarios, and act autonomously to ensure event safety. I can analyze patterns, predict risks, coordinate responses, and provide intelligent insights. How can I assist you today?',
      timestamp: new Date(Date.now() - 300000),
      metadata: {
        confidence: 1.0,
        sources: ['System Initialization', 'Vertex AI Agent Builder'],
        aiModel: 'Gemini Pro + Vertex AI',
        processingTime: 0.2
      }
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({
    responseTime: 0.8,
    accuracy: 0.94,
    dataPoints: 15847,
    activeQueries: 3,
    autonomousActions: 127,
    learningRate: 0.89
  });

  const quickQueries: QuickQuery[] = [
    {
      id: 'q1',
      label: 'Autonomous Risk Analysis',
      query: 'Analyze current risk patterns and recommend autonomous interventions',
      category: 'prediction'
    },
    {
      id: 'q2',
      label: 'Predictive Crowd Surge',
      query: 'Use Vertex AI Forecasting to predict crowd surges in next 20 minutes',
      category: 'crowd'
    },
    {
      id: 'q3',
      label: 'Multi-Zone Intelligence',
      query: 'Provide comprehensive situational awareness across all zones using Gemini',
      category: 'security'
    },
    {
      id: 'q4',
      label: 'Resource Optimization',
      query: 'Autonomously optimize resource allocation based on predictive models',
      category: 'resources'
    },
    {
      id: 'q5',
      label: 'Incident Correlation',
      query: 'Correlate incidents using multimodal AI and suggest preventive measures',
      category: 'incidents'
    },
    {
      id: 'q6',
      label: 'Learning Insights',
      query: 'Show me what the AI has learned from recent event patterns',
      category: 'prediction'
    }
  ];

  const aiResponses = {
    'autonomous risk': 'Autonomous Risk Analysis Complete: My continuous learning algorithms have identified 3 emerging risk patterns. Pattern 1: Crowd density correlation with temperature (87% confidence) - implementing preemptive cooling station activation. Pattern 2: Social media sentiment decline preceding incidents (92% confidence) - monitoring escalated. Pattern 3: Exit flow optimization opportunity detected - autonomously adjusting signage and barriers.',
    'predictive crowd': 'Vertex AI Forecasting Analysis: High probability (89%) of crowd surge at Main Stage in 18 minutes. Predictive model indicates peak density will reach 94% capacity. Autonomous actions initiated: 1) Overflow barriers deploying, 2) Additional security units auto-dispatched, 3) Emergency services pre-positioned. Confidence interval: 85-93%.',
    'multi-zone': 'Gemini Multimodal Zone Analysis: West Zone - STABLE (crowd 67%, no anomalies), East Zone - ELEVATED (crowd 84%, minor bottleneck forming), Main Stage - HIGH ALERT (crowd 91%, surge predicted), VIP Area - SECURE (crowd 45%, all clear), Food Court - MODERATE (crowd 73%, wait times increasing). Cross-zone correlation shows migration pattern toward main stage.',
    'resource optimization': 'Autonomous Resource Optimization Executed: AI has reallocated 3 medical units based on predictive heat map, repositioned 5 security teams using flow analysis, and optimized 12 emergency exit routes. Efficiency improvement: +23%. Response time reduction: -31%. Resource utilization optimized from 67% to 89%.',
    'incident correlation': 'Multimodal Incident Correlation Analysis: Detected pattern linking 4 recent incidents - all occurred in high-density areas with poor ventilation. AI recommendation: Proactive ventilation system activation in similar zones. Preventive measures auto-implemented: Enhanced air circulation, crowd density alerts, medical team pre-positioning.',
    'learning insights': 'AI Learning Summary: In the past 2 hours, I\'ve processed 47,000 data points and identified 12 new behavioral patterns. Key learnings: 1) Crowd movement 15% more predictable during evening hours, 2) Social media sentiment correlates with incident probability (R²=0.84), 3) Weather changes affect crowd density with 8-minute lag. Model accuracy improved by 3.2%.'
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        responseTime: Math.max(0.3, Math.min(3.0, prev.responseTime + (Math.random() - 0.5) * 0.2)),
        accuracy: Math.max(0.85, Math.min(1.0, prev.accuracy + (Math.random() - 0.5) * 0.02)),
        dataPoints: prev.dataPoints + Math.floor(Math.random() * 15),
        activeQueries: Math.max(0, Math.min(10, prev.activeQueries + Math.floor((Math.random() - 0.5) * 3))),
        autonomousActions: prev.autonomousActions + (Math.random() > 0.7 ? 1 : 0),
        learningRate: Math.max(0.7, Math.min(1.0, prev.learningRate + (Math.random() - 0.5) * 0.03))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (query?: string) => {
    const messageContent = query || inputValue.trim();
    if (!messageContent) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Simulate AI processing delay with realistic timing
    const processingTime = 1200 + Math.random() * 800;
    setTimeout(() => {
      // Generate AI response based on query keywords
      let aiResponse = 'I understand your query. Let me analyze the current situation using my autonomous reasoning capabilities and Google\'s AI stack...';
      let confidence = 0.85;
      let sources = ['Live Camera Feeds', 'Vertex AI Vision', 'Gemini Multimodal'];
      let actionItems: string[] = [];
      let aiModel = 'Gemini Pro + Vertex AI';
      let actualProcessingTime = processingTime / 1000;

      const queryLower = messageContent.toLowerCase();
      
      if (queryLower.includes('autonomous') || queryLower.includes('risk analysis')) {
        aiResponse = aiResponses['autonomous risk'];
        confidence = 0.94;
        sources = ['Vertex AI Forecasting', 'Pattern Recognition AI', 'Autonomous Decision Engine'];
        actionItems = ['Activate cooling stations', 'Monitor social sentiment', 'Optimize exit flows'];
        aiModel = 'Vertex AI Agent + Custom Models';
      } else if (queryLower.includes('predictive') || queryLower.includes('crowd surge') || queryLower.includes('forecasting')) {
        aiResponse = aiResponses['predictive crowd'];
        confidence = 0.89;
        sources = ['Vertex AI Forecasting', 'Crowd Dynamics Model', 'Historical Pattern Analysis'];
        actionItems = ['Deploy overflow barriers', 'Dispatch security units', 'Position emergency services'];
        aiModel = 'Vertex AI Forecasting + CNN';
      } else if (queryLower.includes('multi-zone') || queryLower.includes('gemini') || queryLower.includes('situational')) {
        aiResponse = aiResponses['multi-zone'];
        confidence = 0.92;
        sources = ['Gemini Multimodal', 'Camera Network', 'Sensor Array'];
        actionItems = ['Monitor East Zone bottleneck', 'Prepare Main Stage interventions'];
        aiModel = 'Gemini Multimodal Vision';
      } else if (queryLower.includes('resource') || queryLower.includes('optimization') || queryLower.includes('allocation')) {
        aiResponse = aiResponses['resource optimization'];
        confidence = 0.91;
        sources = ['Resource Management AI', 'Predictive Analytics', 'Optimization Engine'];
        actionItems = ['Continue monitoring efficiency gains', 'Validate new positions'];
        aiModel = 'Vertex AI + Custom Optimization';
      } else if (queryLower.includes('incident') || queryLower.includes('correlation') || queryLower.includes('pattern')) {
        aiResponse = aiResponses['incident correlation'];
        confidence = 0.88;
        sources = ['Incident Database', 'Pattern Recognition', 'Multimodal Analysis'];
        actionItems = ['Activate ventilation systems', 'Deploy preventive measures'];
        aiModel = 'Gemini + Pattern Recognition AI';
      } else if (queryLower.includes('learning') || queryLower.includes('insights') || queryLower.includes('patterns')) {
        aiResponse = aiResponses['learning insights'];
        confidence = 0.96;
        sources = ['Learning Engine', 'Behavioral Analytics', 'Model Performance Metrics'];
        actionItems = ['Continue pattern analysis', 'Update prediction models'];
        aiModel = 'Continuous Learning Framework';
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        metadata: {
          confidence,
          sources,
          actionItems,
          processingTime: actualProcessingTime,
          aiModel
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, processingTime);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // In a real implementation, this would start/stop speech recognition
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'border-cyan-500/30 bg-cyan-900/10';
      case 'crowd': return 'border-teal-500/30 bg-teal-900/10';
      case 'resources': return 'border-emerald-500/30 bg-emerald-900/10';
      case 'incidents': return 'border-red-500/30 bg-red-900/10';
      case 'prediction': return 'border-amber-500/30 bg-amber-900/10';
      default: return 'border-slate-500/30 bg-slate-900/10';
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Enhanced AI System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 rounded-xl p-6 border border-cyan-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-300">Response Time</p>
              <p className="text-2xl font-bold text-white">{systemMetrics.responseTime.toFixed(1)}s</p>
            </div>
            <Zap className="h-8 w-8 text-cyan-400" />
          </div>
          <div className="text-sm text-cyan-300">Vertex AI Processing</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl p-6 border border-emerald-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-300">AI Accuracy</p>
              <p className="text-2xl font-bold text-white">{Math.round(systemMetrics.accuracy * 100)}%</p>
            </div>
            <Brain className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="text-sm text-emerald-300">Gemini Performance</div>
        </div>

        <div className="bg-gradient-to-br from-teal-900/50 to-teal-800/30 rounded-xl p-6 border border-teal-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-300">Data Points</p>
              <p className="text-2xl font-bold text-white">{systemMetrics.dataPoints.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-teal-400" />
          </div>
          <div className="text-sm text-teal-300">Real-time analysis</div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 rounded-xl p-6 border border-amber-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-300">Active Queries</p>
              <p className="text-2xl font-bold text-white">{systemMetrics.activeQueries}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-amber-400" />
          </div>
          <div className="text-sm text-amber-300">Currently processing</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl p-6 border border-indigo-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-300">Autonomous Actions</p>
              <p className="text-2xl font-bold text-white">{systemMetrics.autonomousActions}</p>
            </div>
            <Cpu className="h-8 w-8 text-indigo-400" />
          </div>
          <div className="text-sm text-indigo-300">Auto-executed today</div>
        </div>

        <div className="bg-gradient-to-br from-violet-900/50 to-violet-800/30 rounded-xl p-6 border border-violet-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-violet-300">Learning Rate</p>
              <p className="text-2xl font-bold text-white">{Math.round(systemMetrics.learningRate * 100)}%</p>
            </div>
            <Eye className="h-8 w-8 text-violet-400" />
          </div>
          <div className="text-sm text-violet-300">Model adaptation</div>
        </div>
      </div>

      {/* Enhanced Quick Query Buttons */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-cyan-400" />
          Autonomous Intelligence Queries
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickQueries.map((query) => (
            <button
              key={query.id}
              onClick={() => handleSendMessage(query.query)}
              className={`p-4 rounded-lg border text-left transition-all hover:scale-[1.02] ${getCategoryColor(query.category)}`}
            >
              <div className="font-medium text-white mb-1">{query.label}</div>
              <div className="text-sm text-slate-400 line-clamp-2">{query.query}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Chat Interface */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Echoplex AI Command Interface</h3>
                <p className="text-sm text-slate-400">Autonomous reasoning • Continuous learning • Predictive intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-xs text-slate-400">
                <div>Powered by Google AI Stack</div>
                <div>Vertex AI • Gemini • Model Garden</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-emerald-400">Learning Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-96">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-4xl ${message.type === 'user' ? 'bg-cyan-600' : 'bg-slate-700/50'} rounded-xl p-4`}>
                <div className="flex items-start space-x-3">
                  {message.type === 'ai' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white mb-2">{message.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                      {message.metadata?.confidence && (
                        <div>Confidence: {Math.round(message.metadata.confidence * 100)}%</div>
                      )}
                      {message.metadata?.processingTime && (
                        <div>Processing: {message.metadata.processingTime.toFixed(2)}s</div>
                      )}
                      {message.metadata?.aiModel && (
                        <div>Model: {message.metadata.aiModel}</div>
                      )}
                    </div>
                    {message.metadata?.sources && (
                      <div className="mt-2 text-xs text-slate-400">
                        <span className="font-medium">Data Sources:</span> {message.metadata.sources.join(' • ')}
                      </div>
                    )}
                    {message.metadata?.actionItems && message.metadata.actionItems.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-xs text-slate-400 font-medium">Autonomous Actions Initiated:</div>
                        {message.metadata.actionItems.map((item, index) => (
                          <div key={index} className="text-xs bg-cyan-900/20 text-cyan-400 px-2 py-1 rounded flex items-center">
                            <div className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></div>
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-slate-700/50 rounded-xl p-4 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-slate-400 text-sm">Analyzing with Google AI...</span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Input Area */}
        <div className="p-6 border-t border-slate-700/50">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Ask about autonomous risk analysis, predictive forecasting, resource optimization, or any event safety concern..."
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all pr-12"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isProcessing}
              />
              <button
                onClick={toggleListening}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors ${
                  isListening ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isProcessing}
              className="bg-gradient-to-r from-cyan-600 to-teal-700 hover:from-cyan-700 hover:to-teal-800 disabled:from-slate-600 disabled:to-slate-700 text-white p-3 rounded-lg transition-all duration-200 transform hover:scale-[1.05] disabled:hover:scale-100"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Powered by Vertex AI Agent Builder • Gemini Pro • Continuous Learning • Real-time analysis of 50+ data sources
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandInterface;