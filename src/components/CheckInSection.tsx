import React from 'react';
import { UserCheck, QrCode, Upload, BarChart3 } from 'lucide-react';
import CheckInManager from './CheckInManager';
import QRCodeGenerator from './QRCodeGenerator';
import BulkImport from './BulkImport';
import ZoneDashboard from './ZoneDashboard';

const CheckInSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Check-In Manager
              </h1>
              <p className="text-purple-200 text-sm">
                Comprehensive attendee management and QR code-based check-in system
              </p>
            </div>
          </div>
          
          {/* Feature Icons */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30">
              <QrCode className="w-5 h-5 text-purple-300" />
              <span className="text-purple-200 text-sm font-medium">QR Codes</span>
            </div>
            <div className="flex items-center gap-2 bg-pink-500/20 px-4 py-2 rounded-lg border border-pink-500/30">
              <Upload className="w-5 h-5 text-pink-300" />
              <span className="text-pink-200 text-sm font-medium">Bulk Import</span>
            </div>
            <div className="flex items-center gap-2 bg-cyan-500/20 px-4 py-2 rounded-lg border border-cyan-500/30">
              <BarChart3 className="w-5 h-5 text-cyan-300" />
              <span className="text-cyan-200 text-sm font-medium">Live Analytics</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Manual Check-In</p>
                <p className="text-white font-semibold">Available</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">QR Code System</p>
                <p className="text-white font-semibold">4 Zones Active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Bulk Import</p>
                <p className="text-white font-semibold">CSV Ready</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Live Updates</p>
                <p className="text-white font-semibold">Real-Time</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-section Headers and Components */}
      
      {/* 1. Manual Check-In */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-white">Manual Check-In / Check-Out</h2>
        </div>
        <CheckInManager />
      </div>

      {/* 2. Zone Occupancy Dashboard */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-white">Zone Occupancy Dashboard</h2>
        </div>
        <ZoneDashboard />
      </div>

      {/* 3. QR Code Management */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-white">QR Code Generation</h2>
        </div>
        <QRCodeGenerator />
      </div>

      {/* 4. Bulk Import */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-cyan-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-white">Bulk Attendee Import</h2>
        </div>
        <BulkImport />
      </div>
    </div>
  );
};

export default CheckInSection;