// src/components/BulkImport.tsx
import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, FileText } from 'lucide-react';
import { attendeeService } from '../services/attendeeService';

const BulkImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const uploadResult = attendeeService.loadAttendeesFromCSV(text);

      if (uploadResult.success) {
        setResult({
          success: true,
          message: `Successfully imported ${uploadResult.count} attendees`,
          count: uploadResult.count
        });
        setFile(null);
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setResult({
          success: false,
          message: uploadResult.error || 'Failed to import attendees'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to process CSV file'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csv = `name,email,phone,ticketId
John Doe,john@example.com,1234567890,TKT-001
Jane Smith,jane@example.com,0987654321,TKT-002
Mike Johnson,mike@example.com,5551234567,TKT-003`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-attendees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Bulk Import Attendees</h2>
          <p className="text-slate-400 text-sm">Upload CSV file to register multiple attendees at once</p>
        </div>
      </div>

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

      {result && (
        <div
          className={`p-4 rounded-lg border mb-6 ${
            result.success
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400" />
            )}
            <p className={`font-medium ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.message}
            </p>
          </div>
        </div>
      )}

      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          CSV Format Requirements
        </h4>
        <div className="space-y-2 text-sm text-slate-300 mb-4">
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
        </div>
        <button
          onClick={downloadSampleCSV}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition-colors"
        >
          <FileText className="w-4 h-4" />
          Download Sample CSV
        </button>
      </div>
    </div>
  );
};

export default BulkImport;