/*import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin, Users, Phone, CheckCircle, XCircle, Play, Pause } from 'lucide-react';

interface Incident {
  id: string;
  type: 'medical' | 'security' | 'fire' | 'crowd' | 'lost-person';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'responding' | 'resolved';
  location: string;
  description: string;
  timestamp: Date;
  assignedUnits: string[];
  reporter: string;
  eta?: number;
}

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'INC-001',
      type: 'medical',
      severity: 'high',
      status: 'responding',
      location: 'Main Stage - Section A',
      description: 'Person collapsed, possible heat exhaustion',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      assignedUnits: ['MED-01', 'SEC-03'],
      reporter: 'Security Camera AI',
      eta: 3
    },
    {
      id: 'INC-002',
      type: 'crowd',
      severity: 'medium',
      status: 'active',
      location: 'Food Court Bridge',
      description: 'Crowd density exceeding safe limits',
      timestamp: new Date(Date.now() - 120000), // 2 minutes ago
      assignedUnits: ['SEC-01', 'SEC-02'],
      reporter: 'Crowd Monitor AI'
    },
    {
      id: 'INC-003',
      type: 'lost-person',
      severity: 'low',
      status: 'active',
      location: 'West Gate Area',
      description: 'Child separated from parent',
      timestamp: new Date(Date.now() - 600000), // 10 minutes ago
      assignedUnits: ['SEC-04'],
      reporter: 'Mobile App Report'
    },
    {
      id: 'INC-004',
      type: 'security',
      severity: 'critical',
      status: 'resolved',
      location: 'VIP Entrance',
      description: 'Unauthorized access attempt',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      assignedUnits: ['SEC-05', 'SEC-06'],
      reporter: 'Security Personnel'
    }
  ]);

  const [newIncident, setNewIncident] = useState({
    type: 'medical' as const,
    severity: 'medium' as const,
    location: '',
    description: '',
    reporter: 'Manual Entry'
  });

  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setIncidents(prev => prev.map(incident => {
        if (incident.status === 'responding' && incident.eta) {
          const newEta = Math.max(0, incident.eta - 1);
          if (newEta === 0) {
            return { ...incident, status: 'resolved' as const, eta: undefined };
          }
          return { ...incident, eta: newEta };
        }
        return incident;
      }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-900/20 text-red-400';
      case 'responding': return 'bg-yellow-900/20 text-yellow-400';
      case 'resolved': return 'bg-green-900/20 text-green-400';
      default: return 'bg-gray-900/20 text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'security': return '🛡️';
      case 'fire': return '🔥';
      case 'crowd': return '👥';
      case 'lost-person': return '👤';
      default: return '⚠️';
    }
  };

  const handleCreateIncident = () => {
    if (!newIncident.location || !newIncident.description) return;

    const incident: Incident = {
      id: `INC-${String(incidents.length + 1).padStart(3, '0')}`,
      ...newIncident,
      status: 'active',
      timestamp: new Date(),
      assignedUnits: []
    };

    setIncidents(prev => [incident, ...prev]);
    setNewIncident({
      type: 'medical',
      severity: 'medium',
      location: '',
      description: '',
      reporter: 'Manual Entry'
    });
  };

  const handleStatusChange = (id: string, newStatus: Incident['status']) => {
    setIncidents(prev => prev.map(incident => 
      incident.id === id ? { ...incident, status: newStatus } : incident
    ));
  };

  const filteredIncidents = incidents.filter(incident => 
    filterStatus === 'all' || incident.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Statistics Header }
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Incidents</p>
              <p className="text-2xl font-bold text-red-400">
                {incidents.filter(i => i.status === 'active').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Responding</p>
              <p className="text-2xl font-bold text-yellow-400">
                {incidents.filter(i => i.status === 'responding').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Resolved Today</p>
              <p className="text-2xl font-bold text-green-400">
                {incidents.filter(i => i.status === 'resolved').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-white">4.2 min</p>
            </div>
            <Clock className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Create New Incident }
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Incident</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <select 
            className="bg-gray-700 text-white rounded-lg px-3 py-2"
            value={newIncident.type}
            onChange={(e) => setNewIncident(prev => ({ ...prev, type: e.target.value as any }))}
          >
            <option value="medical">Medical</option>
            <option value="security">Security</option>
            <option value="fire">Fire</option>
            <option value="crowd">Crowd</option>
            <option value="lost-person">Lost Person</option>
          </select>

          <select 
            className="bg-gray-700 text-white rounded-lg px-3 py-2"
            value={newIncident.severity}
            onChange={(e) => setNewIncident(prev => ({ ...prev, severity: e.target.value as any }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <input
            type="text"
            placeholder="Location"
            className="bg-gray-700 text-white rounded-lg px-3 py-2"
            value={newIncident.location}
            onChange={(e) => setNewIncident(prev => ({ ...prev, location: e.target.value }))}
          />

          <input
            type="text"
            placeholder="Description"
            className="bg-gray-700 text-white rounded-lg px-3 py-2"
            value={newIncident.description}
            onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>
        <button
          onClick={handleCreateIncident}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Create Incident
        </button>
      </div>

      {/* Incident Filters }
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Incident Log</h3>
          <div className="flex space-x-2">
            {['all', 'active', 'responding', 'resolved'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filterStatus === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Incident List }
        <div className="space-y-4">
          {filteredIncidents.map((incident) => (
            <div key={incident.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTypeIcon(incident.type)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{incident.id}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {incident.timestamp.toLocaleTimeString()} • {incident.reporter}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {incident.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(incident.id, 'responding')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Respond
                    </button>
                  )}
                  {incident.status === 'responding' && (
                    <button
                      onClick={() => handleStatusChange(incident.id, 'resolved')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Location</div>
                  <div className="text-white flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {incident.location}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Assigned Units</div>
                  <div className="text-white">
                    {incident.assignedUnits.length > 0 ? incident.assignedUnits.join(', ') : 'None assigned'}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm text-gray-400 mb-1">Description</div>
                <div className="text-white">{incident.description}</div>
              </div>

              {incident.eta && (
                <div className="bg-yellow-900/20 text-yellow-400 px-3 py-2 rounded-lg text-sm">
                  ETA: {incident.eta} minutes
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IncidentManagement; */