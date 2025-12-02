import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, CheckCircle, XCircle, Loader } from 'lucide-react';

const QRCheckInPage: React.FC = () => {
  const [searchParams] = useSearchParams();
const [ticketId, setTicketId] = useState('');
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [phone, setPhone] = useState('');
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
const [showRegisterForm, setShowRegisterForm] = useState(false);

  const eventId = searchParams.get('eventId') || '';
  const zoneId = searchParams.get('zoneId') || '';
  const zoneName = searchParams.get('zoneName') || '';

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (!eventId || !zoneId) {
      setMessage({ type: 'error', text: 'Invalid QR code. Missing event or zone information.' });
    }
  }, [eventId, zoneId]);

  const handleCheckIn = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!ticketId.trim()) {
    setMessage({ type: 'error', text: 'Please enter your ticket ID' });
    return;
  }

  setLoading(true);
  setMessage(null);

  try {
    // Try to check in with existing ticket ID
    let response = await fetch(`${API_BASE_URL}/attendees/check-in/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticketId: ticketId.trim(),
        eventId,
        zoneId,
        zoneName
      }),
    });

    let data = await response.json();

    // If attendee not found, show registration form
    if (!data.success && data.message.includes('not found')) {
      setShowRegisterForm(true);
      setMessage({ 
        type: 'error', 
        text: 'Ticket ID not found. Please register below.' 
      });
      setLoading(false);
      return;
    }

    if (data.success) {
      setMessage({ type: 'success', text: data.message });
      setTicketId('');
      setShowRegisterForm(false);
    } else {
      setMessage({ type: 'error', text: data.message });
    }
  } catch (error) {
    setMessage({ type: 'error', text: 'Failed to connect. Please try again.' });
    console.error('Check-in error:', error);
  } finally {
    setLoading(false);
  }
};

const handleRegisterAndCheckIn = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!ticketId.trim() || !name.trim() || !email.trim()) {
    setMessage({ type: 'error', text: 'Please fill in all required fields' });
    return;
  }

  setLoading(true);
  setMessage(null);

  try {
    // Step 1: Register the attendee
    const registerResponse = await fetch(`${API_BASE_URL}/attendees/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        ticketId: ticketId.trim(),
        eventId
      }),
    });

    

    const registerData = await registerResponse.json();

    if (!registerData.success) {
      setMessage({ type: 'error', text: registerData.message });
      setLoading(false);
      return;
    }

    

    // Step 2: Check them in immediately
    const checkInResponse = await fetch(`${API_BASE_URL}/attendees/check-in/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticketId: ticketId.trim(),
        eventId,
        zoneId,
        zoneName
      }),
    });

    const checkInData = await checkInResponse.json();

    if (checkInData.success) {
      setMessage({ 
        type: 'success', 
        text: '✅ Registration successful! You are now checked in.' 
      });
      // Clear form
      setTicketId('');
      setName('');
      setEmail('');
      setPhone('');
      setShowRegisterForm(false);
    } else {
      setMessage({ type: 'error', text: checkInData.message });
    } 
  } catch (error) {
    setMessage({ type: 'error', text: 'Failed to register. Please try again.' });
    console.error('Registration error:', error);
  } finally {
    setLoading(false);
  }
};

      /*const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setTicketId('');
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect. Please try again.' });
      console.error('Check-in error:', error);
    } finally {
      setLoading(false);
    }
  };*/

  

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Echoplex</h1>
          <p className="text-slate-400">Check in to the event</p>
        </div>

        {/* Zone Info */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{zoneName}</h2>
              <p className="text-sm text-slate-400">{zoneId}</p>
            </div>
          </div>
        </div>
        {/* Success/Error Message */}
{message && (
  <div className={`mb-6 p-4 rounded-lg border ${
    message.type === 'success' 
      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
      : 'bg-red-500/10 border-red-500/20 text-red-400'
  }`}>
    <p className="flex items-center gap-2">
      {message.type === 'success' ? '✓' : '✕'}
      {message.text}
    </p>
  </div>
)}
        {/* Check-In Form */}
<form onSubmit={showRegisterForm ? handleRegisterAndCheckIn : handleCheckIn} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
  {/* Ticket ID - Always shown */}
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-300 mb-2">
      Ticket ID {!showRegisterForm && <span className="text-red-400">*</span>}
    </label>
    <input
      type="text"
      value={ticketId}
      onChange={(e) => setTicketId(e.target.value)}
      placeholder="e.g., TKT-12345"
      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
      disabled={loading}
    />
  </div>

  {/* Registration Fields - Show only if ticket not found */}
  {showRegisterForm && (
    <>
      <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <p className="text-amber-400 text-sm flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          Ticket ID not found in system. Please register below to continue.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Full Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={loading}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Email Address <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={loading}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1234567890"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={loading}
        />
      </div>
    </>
  )}

  <button
    type="submit"
    disabled={loading || !eventId || !zoneId}
    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-lg transition-all"
  >
    {loading ? (
      <>
        <Loader className="w-5 h-5 animate-spin" />
        {showRegisterForm ? 'Registering...' : 'Checking In...'}
      </>
    ) : (
      <>
        <CheckCircle className="w-5 h-5" />
        {showRegisterForm ? 'Register & Check In' : 'Check In'}
      </>
    )}
  </button>

  {showRegisterForm && (
    <button
      type="button"
      onClick={() => {
        setShowRegisterForm(false);
        setMessage(null);
        setName('');
        setEmail('');
        setPhone('');
      }}
      className="w-full mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
    >
      Cancel Registration
    </button>
  )}
</form>

        
          

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Powered by Echoplex Event Safety Intelligence
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCheckInPage;