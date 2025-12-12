import React, { useState } from 'react';
import { QrCode, Download, Printer, Eye, MapPin } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';
import { zoneService, Zone } from '../services/zoneService';

const ZoneQRManager: React.FC = () => {
  const [zones] = useState<Zone[]>(zoneService.getZones());
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const handleDownloadQR = (zone: Zone) => {
    // Create a canvas to generate the QR code
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // This would generate and download the QR code
    // For demo purposes, we'll just show an alert
    alert(`QR Code for ${zone.name} would be downloaded`);
  };

  const handlePrintQR = (zone: Zone) => {
    // This would open a print dialog with the QR code
    alert(`Print dialog for ${zone.name} QR code would open`);
  };

  const openQRModal = (zone: Zone) => {
    setSelectedZone(zone);
    setShowQRModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-xl font-semibold mb-2 flex items-center">
          <QrCode className="h-6 w-6 mr-3 text-cyan-400" />
          Zone QR Code Management
        </h3>
        <p className="text-slate-400">
          Generate and manage QR codes for zone check-in/check-out functionality. 
          Place these QR codes at zone entrances and exits for real-time occupancy tracking.
        </p>
      </div>

      {/* QR Code Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <div key={zone.id} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-white">{zone.name}</h4>
                <div className="flex items-center text-sm text-slate-400 mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {zone.location}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                zone.riskLevel === 'HIGH' ? 'bg-red-900/40 text-red-400' :
                zone.riskLevel === 'MEDIUM' ? 'bg-amber-900/40 text-amber-400' :
                'bg-emerald-900/40 text-emerald-400'
              }`}>
                {zone.riskLevel}
              </div>
            </div>

            {/* Mini QR Code Preview */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-2 rounded-lg">
                <QRCodeGenerator 
                  value={zone.qrCode} 
                  size={120}
                />
              </div>
            </div>

            {/* Zone Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <div className="text-slate-400">Capacity</div>
                <div className="text-white font-medium">{zone.capacity.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400">Current</div>
                <div className="text-white font-medium">{zone.currentAttendees.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400">Occupancy</div>
                <div className="text-white font-medium">{zone.percentFull}%</div>
              </div>
              <div>
                <div className="text-slate-400">Entrances</div>
                <div className="text-white font-medium">{zone.entrances.length}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => openQRModal(zone)}
                className="flex-1 bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </button>
              <button
                onClick={() => handleDownloadQR(zone)}
                className="flex-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
              <button
                onClick={() => handlePrintQR(zone)}
                className="flex-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedZone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl p-8 max-w-md w-full border border-slate-700">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">{selectedZone.name}</h3>
              <p className="text-slate-400 mb-6">Zone Check-In/Check-Out QR Code</p>
              
              <div className="bg-white p-4 rounded-xl mb-6 inline-block">
                <QRCodeGenerator 
                  value={selectedZone.qrCode} 
                  size={250}
                />
              </div>

              <div className="space-y-3 mb-6">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-sm text-slate-400">Location</div>
                  <div className="text-white">{selectedZone.location}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-sm text-slate-400">Entrances</div>
                  <div className="text-white">{selectedZone.entrances.join(', ')}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-sm text-slate-400">Current Occupancy</div>
                  <div className="text-white">{selectedZone.currentAttendees.toLocaleString()} / {selectedZone.capacity.toLocaleString()} ({selectedZone.percentFull}%)</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleDownloadQR(selectedZone)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => handlePrintQR(selectedZone)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h4 className="text-lg font-semibold text-white mb-3">Implementation Instructions</h4>
        <div className="space-y-3 text-slate-300">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">1</div>
            <div>
              <div className="font-medium">Print and Place QR Codes</div>
              <div className="text-sm text-slate-400">Download and print QR codes for each zone. Place them at all entrances and exits.</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">2</div>
            <div>
              <div className="font-medium">User App Integration</div>
              <div className="text-sm text-slate-400">Users scan QR codes with the Echoplex mobile app to check in/out of zones.</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">3</div>
            <div>
              <div className="font-medium">Real-Time Monitoring</div>
              <div className="text-sm text-slate-400">Dashboard automatically updates with live occupancy data and risk assessments.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneQRManager;