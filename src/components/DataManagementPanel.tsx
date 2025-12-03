// src/components/DataManagementPanel.tsx
// Add this to your CheckInSection or Dashboard for data management

import React, { useState, useEffect } from 'react';
import { Database, Trash2, Download, Upload, Info } from 'lucide-react';
import { attendeeService } from '../services/attendeeService';

const DataManagementPanel: React.FC = () => {
  const [stats, setStats] = useState(attendeeService.getStats());

  useEffect(() => {
    const updateStats = () => {
      setStats(attendeeService.getStats());
    };

    updateStats();
    const unsubscribe = attendeeService.subscribe(updateStats);
    return unsubscribe;
  }, []);

  const handleExportData = () => {
    const attendees = attendeeService.getAllAttendees();
    const zones = attendeeService.getZones();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      attendees,
      zones,
      stats
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echoplex-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    attendeeService.clear();
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Data Management</h3>
          <p className="text-slate-400 text-sm">Manage stored check-in data</p>
        </div>
      </div>

      {/* Storage Status */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-medium">Storage Status</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Attendees:</span>
            <span className="text-white font-semibold">{stats.totalAttendees}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Currently Checked In:</span>
            <span className="text-emerald-400 font-semibold">{stats.checkedIn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Data Persistence:</span>
            <span className="text-cyan-400 font-semibold">✓ Browser Storage</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-cyan-300">
            <p className="font-medium mb-1">✅ Data is now persistent!</p>
            <p className="text-cyan-400/80">
              All check-ins are automatically saved to your browser. Data will remain even after closing the tab or restarting your computer.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExportData}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Download className="w-5 h-5" />
          Export Backup
        </button>

        <button
          onClick={handleClearData}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          Clear All Data
        </button>
      </div>

      <p className="text-slate-500 text-xs mt-4 text-center">
        Export creates a backup file. Clear removes all data permanently.
      </p>
    </div>
  );
};

export default DataManagementPanel;