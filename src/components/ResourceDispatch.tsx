/*import React, { useState, useEffect } from 'react';
import { Radio, MapPin, Battery, Clock, Users, Truck, Heart, Shield } from 'lucide-react';

interface Resource {
  id: string;
  type: 'medical' | 'security' | 'fire' | 'maintenance';
  name: string;
  location: string;
  status: 'available' | 'dispatched' | 'busy' | 'offline';
  battery?: number;
  lastUpdate: Date;
  assignedIncident?: string;
  eta?: number;
}

const ResourceDispatch: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([
    {
      id: 'MED-01',
      type: 'medical',
      name: 'Ambulance Alpha',
      location: 'Medical Station 1',
      status: 'dispatched',
      lastUpdate: new Date(),
      assignedIncident: 'INC-001',
      eta: 3
    },
    {
      id: 'MED-02',
      type: 'medical',
      name: 'Paramedic Team Beta',
      location: 'Food Court',
      status: 'available',
      lastUpdate: new Date(Date.now() - 120000)
    },
    {
      id: 'SEC-01',
      type: 'security',
      name: 'Security Team Alpha',
      location: 'Main Gate',
      status: 'dispatched',
      lastUpdate: new Date(),
      assignedIncident: 'INC-002',
      eta: 5
    },
    {
      id: 'SEC-02',
      type: 'security',
      name: 'Security Team Beta',
      location: 'VIP Area',
      status: 'available',
      lastUpdate: new Date(Date.now() - 300000)
    },
    {
      id: 'SEC-03',
      type: 'security',
      name: 'K-9 Unit',
      location: 'West Gate',
      status: 'busy',
      lastUpdate: new Date(Date.now() - 60000),
      assignedIncident: 'INC-003'
    },
    {
      id: 'FIRE-01',
      type: 'fire',
      name: 'Fire Suppression Unit',
      location: 'Equipment Storage',
      status: 'available',
      lastUpdate: new Date(Date.now() - 180000)
    },
    {
      id: 'MAINT-01',
      type: 'maintenance',
      name: 'Technical Support',
      location: 'Stage Area',
      status: 'busy',
      lastUpdate: new Date(Date.now() - 240000)
    }
  ]);

  const [dispatchHistory, setDispatchHistory] = useState([
    {
      id: 'DISPATCH-001',
      resourceId: 'MED-01',
      incidentId: 'INC-001',
      location: 'Main Stage - Section A',
      timestamp: new Date(Date.now() - 300000),
      status: 'en-route'
    },
    {
      id: 'DISPATCH-002',
      resourceId: 'SEC-01',
      incidentId: 'INC-002',
      location: 'Food Court Bridge',
      timestamp: new Date(Date.now() - 120000),
      status: 'en-route'
    }
  ]);

  const [selectedResource, setSelectedResource] = useState<string>('');
  const [dispatchLocation, setDispatchLocation] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      setResources(prev => prev.map(resource => {
        if (resource.status === 'dispatched' && resource.eta) {
          const newEta = Math.max(0, resource.eta - 1);
          if (newEta === 0) {
            return { ...resource, status: 'busy' as const, eta: undefined };
          }
          return { ...resource, eta: newEta };
        }
        return resource;
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-900/20 text-green-400';
      case 'dispatched': return 'bg-yellow-900/20 text-yellow-400';
      case 'busy': return 'bg-red-900/20 text-red-400';
      case 'offline': return 'bg-gray-900/20 text-gray-400';
      default: return 'bg-gray-900/20 text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return Heart;
      case 'security': return Shield;
      case 'fire': return '🔥';
      case 'maintenance': return Truck;
      default: return Radio;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'text-red-400';
      case 'security': return 'text-blue-400';
      case 'fire': return 'text-orange-400';
      case 'maintenance': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const handleDispatch = () => {
    if (!selectedResource || !dispatchLocation) return;

    const resource = resources.find(r => r.id === selectedResource);
    if (!resource || resource.status !== 'available') return;

    setResources(prev => prev.map(r => 
      r.id === selectedResource 
        ? { ...r, status: 'dispatched', eta: Math.floor(Math.random() * 10) + 2 }
        : r
    ));

    setDispatchHistory(prev => [...prev, {
      id: `DISPATCH-${String(prev.length + 1).padStart(3, '0')}`,
      resourceId: selectedResource,
      incidentId: 'Manual',
      location: dispatchLocation,
      timestamp: new Date(),
      status: 'en-route'
    }]);

    setSelectedResource('');
    setDispatchLocation('');
  };

  const availableResources = resources.filter(r => r.status === 'available');
  const dispatchedResources = resources.filter(r => r.status === 'dispatched');

  return (
    <div className="space-y-6">
      {/* Resource Summary }
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Available Units</p>
              <p className="text-2xl font-bold text-green-400">
                {availableResources.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Dispatched</p>
              <p className="text-2xl font-bold text-yellow-400">
                {dispatchedResources.length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Busy</p>
              <p className="text-2xl font-bold text-red-400">
                {resources.filter(r => r.status === 'busy').length}
              </p>
            </div>
            <Radio className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Offline</p>
              <p className="text-2xl font-bold text-gray-400">
                {resources.filter(r => r.status === 'offline').length}
              </p>
            </div>
            <Battery className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Manual Dispatch }
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Manual Dispatch</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="bg-gray-700 text-white rounded-lg px-3 py-2"
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
          >
            <option value="">Select Resource</option>
            {availableResources.map(resource => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({resource.id})
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Dispatch Location"
            className="bg-gray-700 text-white rounded-lg px-3 py-2"
            value={dispatchLocation}
            onChange={(e) => setDispatchLocation(e.target.value)}
          />
          <button
            onClick={handleDispatch}
            disabled={!selectedResource || !dispatchLocation}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Dispatch
          </button>
        </div>
      </div>

      {/* Resource Grid }
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Resources }
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Active Resources</h3>
          <div className="space-y-3">
            {resources.filter(r => r.status !== 'offline').map((resource) => {
              const Icon = getTypeIcon(resource.type);
              return (
                <div key={resource.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {typeof Icon === 'string' ? (
                        <span className="text-2xl">{Icon}</span>
                      ) : (
                        <Icon className={`h-6 w-6 ${getTypeColor(resource.type)}`} />
                      )}
                      <div>
                        <div className="font-medium text-white">{resource.name}</div>
                        <div className="text-sm text-gray-400">{resource.id}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(resource.status)}`}>
                      {resource.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Location: </span>
                      <span className="text-white">{resource.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Last Update: </span>
                      <span className="text-white">{resource.lastUpdate.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  {resource.assignedIncident && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-400">Assigned: </span>
                      <span className="text-blue-400">{resource.assignedIncident}</span>
                    </div>
                  )}
                  {resource.eta && (
                    <div className="mt-2 bg-yellow-900/20 text-yellow-400 px-2 py-1 rounded text-sm">
                      ETA: {resource.eta} minutes
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dispatch History }
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Dispatches</h3>
          <div className="space-y-3">
            {dispatchHistory.slice(-10).reverse().map((dispatch) => (
              <div key={dispatch.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-white">{dispatch.resourceId}</div>
                  <div className="text-sm text-gray-400">
                    {dispatch.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-400">Incident: </span>
                    <span className="text-white">{dispatch.incidentId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Location: </span>
                    <span className="text-white">{dispatch.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status: </span>
                    <span className={`${
                      dispatch.status === 'en-route' ? 'text-yellow-400' :
                      dispatch.status === 'arrived' ? 'text-green-400' :
                      'text-blue-400'
                    }`}>
                      {dispatch.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Map View }
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-400" />
          Resource Location Map
        </h3>
        <div className="bg-gray-700 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">Interactive map showing real-time resource locations</p>
            <p className="text-sm text-gray-500 mt-1">Integration with Google Maps API</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDispatch; */