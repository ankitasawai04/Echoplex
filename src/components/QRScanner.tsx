import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [scanResult, setScanResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          setScanResult(result.data);
          setIsScanning(false);
          onScan(result.data);
          
          // Auto close after successful scan
          setTimeout(() => {
            onClose();
          }, 1500);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      );

      qrScanner.start().then(() => {
        setIsScanning(true);
        setScanner(qrScanner);
      }).catch((error) => {
        console.error('Camera access denied:', error);
        setHasCamera(false);
      });

      return () => {
        qrScanner.stop();
        qrScanner.destroy();
      };
    }
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Camera className="h-5 w-5 mr-2 text-cyan-400" />
            Scan Zone QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {!hasCamera ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Camera access denied</p>
            <p className="text-slate-400 text-sm">Please allow camera access to scan QR codes</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                playsInline
                muted
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-cyan-400 rounded-lg animate-pulse"></div>
                </div>
              )}
            </div>

            {scanResult && (
              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 flex items-center">
                <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                <span className="text-emerald-400 text-sm">QR Code scanned successfully!</span>
              </div>
            )}

            <div className="text-center">
              <p className="text-slate-400 text-sm">
                Position the QR code within the frame to scan
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;