// src/components/CheckInManager.tsx
import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Search, Clock, MapPin, Users } from 'lucide-react';
import { attendeeService, Attendee } from '../services/attendeeService';

const CheckInManager: React.FC = () => {
  const [ticketId, setTicketId] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [attendeeData, setAttendeeData] = useState<Attendee | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [zones, setZones] = useState(attendeeService.getZones());
  const [stats, setStats] = useState(attendeeService.getStats());

  useEffect(() => {
    const updateData = () => {
      setAttendees(attendeeService.getAllAttendees());
      setZones(attendeeService.getZones());
      setStats(attendeeService.getStats());
    };

    updateData();
    const unsubscribe = attendeeService.subscribe(updateData);
    return unsubscribe;
  }, []);

  const handleCheckIn = () => {
    if (!ticketId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a ticket ID' });
      return;
    }

    if (!selectedZone) {
      setMessage({ type: 'error', text: 'Please select a zone' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = attendeeService.checkIn(ticketId.trim(), selectedZone);

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setAttendeeData(result.attendee || null);
      setTicketId('');
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setLoading(false);
  };

  const handleCheckOut = () => {
    if (!ticketId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a ticket ID' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = attendeeService.checkOut(ticketId.trim());

    if (result.success) {
      setMessage({
        type: 'success',
        text: `${result.message} - Duration: ${result.duration} minutes`
      });
      setAttendeeData(result.attendee || null);
      setTicketId('');
    } else {
      setMessage({ type: 'error', text: result.message });
    }

    setLoading(false);
  };

  const handleCheckStatus = () => {
    if (!ticketId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a ticket ID' });
      return;
    }

    const attendee = attendeeService.getAttendee(ticketId.trim());

    if (attendee) {
      setAttendeeData(attendee);
      setMessage({ type: 'success', text: 'Attendee status retrieved' });
    } else {
      setMessage({ type: 'error', text: 'Attendee not found' });
      setAttendeeData(null);
    }
  };

  const handleQuickCheckIn = (attendee: Attendee) => {
    if (!selectedZone) {
      setMessage({ type: 'error', text: 'Please select a zone first' });
      return;
    }

    const result = attendeeService.checkIn(attendee.ticketId, selectedZone);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleQuickCheckOut = (attendee: Attendee) => {
    const result = attendeeService.checkOut(attendee.ticketId);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      not_checked_in: 'bg-slate-600 text-slate-300',
      checked_in: 'bg-emerald-500 text-white',
      checked_out: 'bg-cyan-500 text-white'
    };
    return badges[status as keyof typeof badges] || badges.not_checked_in;
  };

  const filteredAttendees = attendees.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400 text-sm">Total Attendees</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalAttendees}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 text-sm">Checked In</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.checkedIn}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <UserX className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-sm">Not Checked In</span>
          </div>
          <div className="text-2xl font-bold text-slate-400">{stats.notCheckedIn}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 text-sm">Total Occupancy</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">{stats.totalOccupancy}</div>
        </div>
      </div>

      {/* Manual Check-In Form */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Manual Check-In</h3>
            <p className="text-slate-400 text-sm">Enter ticket ID and select zone</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ticket ID
              </label>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="Enter ticket ID (e.g., TKT-001)"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Zone
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                disabled={loading}
              >
                <option value="">Select Zone</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.currentOccupancy}/{zone.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <UserCheck className="w-5 h-5" />
            Check In
          </button>

          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <UserX className="w-5 h-5" />
            Check Out
          </button>

          <button
            onClick={handleCheckStatus}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <Search className="w-5 h-5" />
            Status
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {attendeeData && (
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">{attendeeData.name}</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(attendeeData.status)}`}>
                {attendeeData.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Email</p>
                <p className="text-white">{attendeeData.email}</p>
              </div>
              <div>
                <p className="text-slate-400">Phone</p>
                <p className="text-white">{attendeeData.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400">Ticket ID</p>
                <p className="text-white">{attendeeData.ticketId}</p>
              </div>
              {attendeeData.currentZone && (
                <div>
                  <p className="text-slate-400">Current Zone</p>
                  <p className="text-white">{zones.find(z => z.id === attendeeData.currentZone)?.name}</p>
                </div>
              )}
            </div>

            {attendeeData.checkInTime && (
              <div className="mt-4 pt-4 border-t border-slate-600">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Check-in Time</span>
                </div>
                <p className="text-white text-sm">
                  {new Date(attendeeData.checkInTime).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendee List */}
      {attendees.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Attendee List</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Ticket ID</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Zone</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.slice(0, 20).map(attendee => (
                  <tr key={attendee.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="py-3 px-4 text-white">{attendee.name}</td>
                    <td className="py-3 px-4 text-slate-300">{attendee.ticketId}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(attendee.status)}`}>
                        {attendee.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {attendee.currentZone ? zones.find(z => z.id === attendee.currentZone)?.name : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {attendee.isCheckedIn ? (
                        <button
                          onClick={() => handleQuickCheckOut(attendee)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                        >
                          Check Out
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickCheckIn(attendee)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm transition-colors"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAttendees.length > 20 && (
              <div className="mt-4 text-center text-slate-400 text-sm">
                Showing 20 of {filteredAttendees.length} attendees
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInManager;