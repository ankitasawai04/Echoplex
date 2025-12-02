import React, { useState } from 'react';
import { Upload, Download, Users, CheckCircle, XCircle, FileText } from 'lucide-react';

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    imported: number;
    failed: number;
    failedRecords: any[];
  };
}

const BulkImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [eventId] = useState('EVT-2024-001');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate required headers
    if (!headers.includes('name') || !headers.includes('email') || !headers.includes('ticketid')) {
      throw new Error('CSV must have columns: name, email, ticketId');
    }

    const attendees = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const attendee: any = {};
      
      headers.forEach((header, index) => {
        if (header === 'ticketid') {
          attendee['ticketId'] = values[index];
        } else {
          attendee[header] = values[index];
        }
      });
      
      attendees.push(attendee);
    }
    
    return attendees;
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const attendeeList = parseCSV(text);

      const response = await fetch(`${API_BASE_URL}/attendees/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendeeList,
          eventId
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to process CSV file'
      });
    } finally {
      setLoading(false);
    }
  };

 /*const downloadSampleCSV = () => {
    const csv = `name,email,phone,ticketId
Anbreen Shabir,anbreen@example.com,+919234563265,TKT-001
Ankita Sawai,ankita@example.com,+919390631629,TKT-002
Chaitrali Kore,chaitrali@example.com,+917869872312,TKT-003
Anjali Sharma,anjali@example.com,+918345678934,TKT-004
Sneha Chavan,sneha@example.com,+918361678954,TKT-005`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-attendees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }; */

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Bulk Import Attendees</h2>
          <p className="text-slate-400 text-sm">Upload CSV file to register multiple attendees at once</p>
        </div>
      </div>

     

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Upload Attendee List (CSV File)
        </label>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600 file:cursor-pointer"
          />
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Import Attendees
              </>
            )}
          </button>
        </div>
        {file && !loading && (
          <p className="text-slate-400 text-sm mt-2">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div
          className={`p-4 rounded-lg border ${
            result.success
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <p className={`font-medium ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.message}
            </p>
          </div>
          
          {result.data && (
            <>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-slate-400 text-sm">Successfully Imported</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-400">{result.data.imported}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-slate-400 text-sm">Failed</span>
                  </div>
                  <p className="text-3xl font-bold text-red-400">{result.data.failed}</p>
                </div>
              </div>

              {/* Show failed records if any */}
              {result.data.failedRecords && result.data.failedRecords.length > 0 && (
                <div className="mt-4 bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Failed Records:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {result.data.failedRecords.map((record, index) => (
                      <div key={index} className="text-sm bg-slate-800 rounded p-2">
                        <p className="text-red-400">{record.reason}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          {JSON.stringify(record.attendee)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          CSV Format Requirements
        </h4>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span><strong>Required columns:</strong> name, email, ticketId</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span><strong>Optional column:</strong> phone</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>First row must contain column headers</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>Each ticket ID must be unique</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>Use comma (,) as separator</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>Save file as .csv format</span>
          </div>
        </div>


      </div>
    </div>
  );
};

export default BulkImport;