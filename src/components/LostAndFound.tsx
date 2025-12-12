import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Camera, MapPin, Clock, User, AlertCircle, CheckCircle, Upload, Eye, Zap, Video, VideoOff, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { lostAndFoundService, MissingPersonProfile as ServiceMissingPersonProfile, MatchResult } from '../services/lostAndFoundService';
import { faceRecognitionService, FaceMatch } from '../services/faceRecognitionService';

interface MissingPerson {
  id: string;
  name: string;
  age: number;
  description: string;
  lastSeen: string;
  reportedTime: Date;
  status: 'searching' | 'found' | 'potential-match';
  reportedBy: string;
  photoUrl?: string;
  aiMatchConfidence?: number;
  currentLocation?: string;
  cameraMatches?: CameraMatch[];
}

interface CameraMatch {
  cameraId: string;
  location: string;
  confidence: number;
  timestamp: Date;
  imageUrl?: string;
}

const LostAndFound: React.FC = () => {
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([
    {
      id: 'MP-001',
      name: 'Emma Thompson',
      age: 8,
      description: 'Wearing pink t-shirt and blue jeans, brown hair in ponytails',
      lastSeen: 'Food Court Area',
      reportedTime: new Date(Date.now() - 1800000), // 30 minutes ago
      status: 'potential-match',
      reportedBy: 'Sarah Thompson (Mother)',
      photoUrl: 'https://images.pexels.com/photos/1734015/pexels-photo-1734015.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      aiMatchConfidence: 0.87,
      currentLocation: 'Main Stage - Section B',
      cameraMatches: [
        {
          cameraId: 'CAM-12',
          location: 'Main Stage - Section B',
          confidence: 0.87,
          timestamp: new Date(Date.now() - 300000)
        },
        {
          cameraId: 'CAM-08',
          location: 'Food Court Exit',
          confidence: 0.73,
          timestamp: new Date(Date.now() - 1200000)
        }
      ]
    },
    {
      id: 'MP-002',
      name: 'Michael Chen',
      age: 65,
      description: 'Elderly man with gray beard, wearing blue jacket and khaki pants',
      lastSeen: 'West Gate Entrance',
      reportedTime: new Date(Date.now() - 900000), // 15 minutes ago
      status: 'searching',
      reportedBy: 'Lisa Chen (Daughter)',
      photoUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
    },
    {
      id: 'MP-003',
      name: 'Jake Rodriguez',
      age: 16,
      description: 'Teen with red baseball cap, black hoodie, skateboard',
      lastSeen: 'Parking Lot C',
      reportedTime: new Date(Date.now() - 2700000), // 45 minutes ago
      status: 'found',
      reportedBy: 'Maria Rodriguez (Mother)',
      currentLocation: 'Security Station 2'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [newReport, setNewReport] = useState({
    name: '',
    age: '',
    description: '',
    lastSeen: '',
    reportedBy: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiScanResults, setAiScanResults] = useState({
    totalScans: 0,
    facesDetected: 0,
    matchAttempts: 0,
    successRate: 0.0
  });
  
  // Video processing state
  const [isVideoStreaming, setIsVideoStreaming] = useState(false);
  const [isServiceConnected, setIsServiceConnected] = useState(false);
  const [isFaceServiceConnected, setIsFaceServiceConnected] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingIntervalRef = useRef<number | null>(null);
  const [recentMatches, setRecentMatches] = useState<MatchResult[]>([]);
  
  // Face recognition state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Define stopVideoStream before useEffects that reference it
  const stopVideoStream = useCallback(() => {
    // Stop frame processing
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }

    // Stop WebSocket
    lostAndFoundService.stopVideoStream();

    // Stop camera stream
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsVideoStreaming(false);
  }, [videoStream]);

  // Check service health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const videoHealthy = await lostAndFoundService.checkHealth();
      setIsServiceConnected(videoHealthy);
      
      const faceHealthy = await faceRecognitionService.checkHealth();
      setIsFaceServiceConnected(faceHealthy);
    };
    checkHealth();
    
    // Check health periodically
    const healthInterval = setInterval(checkHealth, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(healthInterval);
      stopVideoStream();
    };
  }, [stopVideoStream]);

  // Load initial missing persons from API (with fallback to mock data)
  useEffect(() => {
    const loadPersons = async () => {
      try {
        const persons = await faceRecognitionService.getAllPersons();
        if (persons.length > 0) {
          // Convert API format to component format
          const convertedPersons: MissingPerson[] = persons.map((p: any) => ({
            id: p.personId,
            name: p.name,
            age: p.age,
            description: p.description,
            lastSeen: p.last_seen || 'Unknown',
            reportedTime: new Date(p.timestamp),
            status: p.status === 'found' ? 'found' : p.status === 'potential-match' ? 'potential-match' : 'searching',
            reportedBy: p.reported_by || 'Unknown',
            photoUrl: p.photo_path ? `http://localhost:8001/${p.photo_path}` : undefined
          }));
          setMissingPersons(convertedPersons);
        }
      } catch (error) {
        console.error('Error loading persons from API, using mock data:', error);
        // Keep mock data as fallback
      }
    };
    
    loadPersons();
  }, []);

  // Real-time polling for live matches
  useEffect(() => {
    if (!isFaceServiceConnected) return;

    const pollLiveMatches = async () => {
      try {
        const stats = await faceRecognitionService.getLiveMatches();
        setAiScanResults({
          totalScans: stats.totalScans,
          facesDetected: stats.facesDetected,
          matchAttempts: stats.activeMatches,
          successRate: stats.totalMissingPersons > 0 
            ? stats.searchingCount / stats.totalMissingPersons 
            : 0
        });
      } catch (error) {
        console.error('Error polling live matches:', error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollLiveMatches, 3000);
    pollLiveMatches(); // Initial call

    return () => clearInterval(interval);
  }, [isFaceServiceConnected]);

  // Update missing persons in video stream when list changes
  useEffect(() => {
    if (isVideoStreaming && isServiceConnected) {
      const activeProfiles = missingPersons
        .filter(p => p.status !== 'found')
        .map(p => ({
          id: p.id,
          name: p.name,
          age: p.age,
          description: p.description,
          photoUrl: p.photoUrl,
          ...lostAndFoundService.extractColorsFromDescription(p.description)
        }));
      
      lostAndFoundService.updateMissingPersons(activeProfiles);
    }
  }, [missingPersons, isVideoStreaming, isServiceConnected]);

  useEffect(() => {
    // Simulate real-time AI matching updates (for demo stats)
    const interval = setInterval(() => {
      setAiScanResults(prev => ({
        totalScans: prev.totalScans + (isVideoStreaming ? Math.floor(Math.random() * 5) : 0),
        facesDetected: prev.facesDetected + (isVideoStreaming ? Math.floor(Math.random() * 20) : 0),
        matchAttempts: prev.matchAttempts + (recentMatches.length > 0 ? 1 : 0),
        successRate: Math.max(0.5, Math.min(1, prev.successRate + (Math.random() - 0.5) * 0.02))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isVideoStreaming, recentMatches]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found': return 'bg-green-900/20 text-green-400';
      case 'potential-match': return 'bg-yellow-900/20 text-yellow-400';
      default: return 'bg-red-900/20 text-red-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'found': return CheckCircle;
      case 'potential-match': return AlertCircle;
      default: return Search;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!newReport.name || !newReport.age || !newReport.description) return;
    
    // Validate photo is selected
    if (!selectedFile) {
      setUploadError('Please upload a photo of the missing person');
      return;
    }

    setIsUploadingPhoto(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Create FormData for API upload
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('name', newReport.name);
      formData.append('age', newReport.age);
      formData.append('description', newReport.description);
      if (newReport.lastSeen) formData.append('last_seen', newReport.lastSeen);
      if (newReport.reportedBy) formData.append('reported_by', newReport.reportedBy);

      // Upload to face recognition API
      const response = await faceRecognitionService.uploadMissingPerson(formData);

      if (!response.success || !response.embedding_created) {
        throw new Error(response.error || 'Failed to extract facial features. Please ensure the photo contains a clear face.');
      }

      // Create report object
      const report: MissingPerson = {
        id: response.personId,
        name: newReport.name,
        age: parseInt(newReport.age),
        description: newReport.description,
        lastSeen: newReport.lastSeen,
        reportedTime: new Date(),
        status: 'searching',
        reportedBy: newReport.reportedBy,
        photoUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined
      };

      setMissingPersons(prev => [report, ...prev]);
      setNewReport({ name: '', age: '', description: '', lastSeen: '', reportedBy: '' });
      setSelectedFile(null);
      setUploadSuccess(true);
      
      // Auto-start video stream if not already running
      if (!isVideoStreaming && isServiceConnected) {
        startVideoStream();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload missing person report');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const startVideoStream = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      });
      
      setVideoStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Prepare missing person profiles
      const activeProfiles: ServiceMissingPersonProfile[] = missingPersons
        .filter(p => p.status !== 'found')
        .map(p => ({
          id: p.id,
          name: p.name,
          age: p.age,
          description: p.description,
          photoUrl: p.photoUrl,
          ...lostAndFoundService.extractColorsFromDescription(p.description)
        }));

      // Start WebSocket connection
      lostAndFoundService.startVideoStream(
        {
          streamId: `stream-${Date.now()}`,
          missingPersons: activeProfiles
        },
        (match) => {
          // Handle match
          setRecentMatches(prev => [match, ...prev].slice(0, 10)); // Keep last 10
          
          // Update missing person status
          setMissingPersons(prev => prev.map(person => {
            if (person.id === match.missingPersonId) {
              return {
                ...person,
                status: 'potential-match' as const,
                aiMatchConfidence: match.confidence,
                currentLocation: match.location || person.lastSeen,
                cameraMatches: [
                  ...(person.cameraMatches || []),
                  {
                    cameraId: match.personId,
                    location: match.location || 'Unknown',
                    confidence: match.confidence,
                    timestamp: new Date(match.timestamp),
                    imageUrl: match.imageUrl
                  }
                ].slice(-5) // Keep last 5 matches
              };
            }
            return person;
          }));

          // Update stats
          setAiScanResults(prev => ({
            ...prev,
            matchAttempts: prev.matchAttempts + 1
          }));
        },
        (error) => {
          console.error('Video stream error:', error);
          setIsServiceConnected(false);
        },
        () => {
          setIsServiceConnected(true);
        },
        () => {
          setIsServiceConnected(false);
        }
      );

      // Start frame processing loop with face recognition
      processingIntervalRef.current = window.setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4 && isFaceServiceConnected) {
          try {
            // Capture frame as blob for face recognition API
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 1280;
            canvas.height = videoRef.current.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0);
              canvas.toBlob(async (blob) => {
                if (blob) {
                  try {
                    // Send to face recognition API
                    const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
                    const matches = await faceRecognitionService.searchByImage(file);
                    
                    // Process matches (confidence > 80%)
                    matches.forEach((match: FaceMatch) => {
                      if (match.confidence > 80) {
                        setMissingPersons(prev => prev.map(person => {
                          if (person.id === match.personId) {
                            return {
                              ...person,
                              status: 'potential-match' as const,
                              aiMatchConfidence: match.confidence / 100,
                              currentLocation: match.location || person.lastSeen,
                              cameraMatches: [
                                ...(person.cameraMatches || []),
                                {
                                  cameraId: 'CAM-LIVE',
                                  location: match.location,
                                  confidence: match.confidence / 100,
                                  timestamp: new Date(match.timestamp)
                                }
                              ].slice(-5)
                            };
                          }
                          return person;
                        }));
                      }
                    });
                  } catch (error) {
                    console.error('Error matching face:', error);
                  }
                }
              }, 'image/jpeg', 0.8);
            }
            
            // Also send to video processing service (for color matching)
            const frameData = await lostAndFoundService.captureFrame(videoRef.current);
            lostAndFoundService.sendFrame(frameData);
          } catch (error) {
            console.error('Error capturing frame:', error);
          }
        }
      }, 1000 / 5); // 5 FPS for face recognition (slower to reduce API calls)

      setIsVideoStreaming(true);
    } catch (error) {
      console.error('Error starting video stream:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const handleStatusUpdate = (id: string, newStatus: MissingPerson['status']) => {
    setMissingPersons(prev => prev.map(person => 
      person.id === id ? { ...person, status: newStatus } : person
    ));
  };

  const filteredPersons = missingPersons.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* AI Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300">AI Face Scans</p>
              <p className="text-2xl font-bold text-white">{aiScanResults.totalScans.toLocaleString()}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-400" />
          </div>
          <div className="text-sm text-blue-300">Real-time processing</div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-300">Faces Detected</p>
              <p className="text-2xl font-bold text-white">{aiScanResults.facesDetected.toLocaleString()}</p>
            </div>
            <Camera className="h-8 w-8 text-purple-400" />
          </div>
          <div className="text-sm text-purple-300">Across all cameras</div>
        </div>

        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300">Success Rate</p>
              <p className="text-2xl font-bold text-white">{Math.round(aiScanResults.successRate * 100)}%</p>
            </div>
            <Zap className="h-8 w-8 text-green-400" />
          </div>
          <div className="text-sm text-green-300">AI Accuracy</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-xl p-6 border border-yellow-700/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-300">Active Cases</p>
              <p className="text-2xl font-bold text-white">
                {missingPersons.filter(p => p.status !== 'found').length}
              </p>
            </div>
            <Search className="h-8 w-8 text-yellow-400" />
          </div>
          <div className="text-sm text-yellow-300">Currently searching</div>
        </div>
      </div>

      {/* Video Processing Controls */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Camera className="h-5 w-5 mr-2 text-blue-400" />
            Real-Time Video Processing
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isServiceConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">Disconnected</span>
                </>
              )}
            </div>
            {isVideoStreaming ? (
              <button
                onClick={stopVideoStream}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <VideoOff className="h-4 w-4" />
                <span>Stop Processing</span>
              </button>
            ) : (
              <button
                onClick={startVideoStream}
                disabled={!isServiceConnected}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Video className="h-4 w-4" />
                <span>Start Processing</span>
              </button>
            )}
          </div>
        </div>
        
        {isVideoStreaming && (
          <div className="mt-4">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
                style={{ transform: 'scaleX(-1)' }} // Mirror for better UX
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Processing at ~10 FPS • Active cases: {missingPersons.filter(p => p.status !== 'found').length}
            </div>
          </div>
        )}
        
        {!isServiceConnected && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              Video processing service is not connected. Please ensure the Python service is running on port 8000.
            </p>
          </div>
        )}
        
        {!isFaceServiceConnected && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              Face recognition service is not connected. Please ensure the Python face recognition service is running on port 8001.
            </p>
          </div>
        )}
      </div>

      {/* Search and Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Interface */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-400" />
            Search Missing Persons
          </h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or description..."
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-400">
            {filteredPersons.length} of {missingPersons.length} cases shown
          </div>
        </div>

        {/* New Report Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-400" />
            Report Missing Person
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Full Name"
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newReport.name}
                onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Age"
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newReport.age}
                onChange={(e) => setNewReport(prev => ({ ...prev, age: e.target.value }))}
              />
            </div>
            <input
              type="text"
              placeholder="Description (clothing, distinguishing features)"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={newReport.description}
              onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Last Seen Location"
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newReport.lastSeen}
                onChange={(e) => setNewReport(prev => ({ ...prev, lastSeen: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Reported By"
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newReport.reportedBy}
                onChange={(e) => setNewReport(prev => ({ ...prev, reportedBy: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-3">
              <label className={`flex items-center space-x-2 cursor-pointer bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 hover:bg-gray-600/50 transition-colors ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-300">Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploadingPhoto}
                />
              </label>
              {selectedFile && (
                <span className="text-sm text-green-400">Photo selected: {selectedFile.name}</span>
              )}
            </div>
            
            {/* Error Message */}
            {uploadError && (
              <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                <p className="text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {uploadError}
                </p>
              </div>
            )}
            
            {/* Success Message */}
            {uploadSuccess && (
              <div className="p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <p className="text-green-400 text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Facial features extracted successfully! AI search started.
                </p>
              </div>
            )}
            
            {/* Face Service Connection Status */}
            {!isFaceServiceConnected && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                <p className="text-yellow-400 text-sm flex items-center">
                  <WifiOff className="h-4 w-4 mr-2" />
                  Face recognition service not connected. Please ensure the Python service is running on port 8001.
                </p>
              </div>
            )}
            
            <button
              onClick={handleSubmitReport}
              disabled={isUploadingPhoto || !isFaceServiceConnected || !selectedFile}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isUploadingPhoto ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting Facial Features...</span>
                </>
              ) : (
                <span>Submit Report & Start AI Search</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Missing Persons List */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-blue-400" />
            Active Missing Persons Cases
          </h3>
          <div className="text-sm text-gray-400">
            AI facial recognition active on {missingPersons.filter(p => p.status !== 'found').length} cases
          </div>
        </div>

        <div className="space-y-4">
          {filteredPersons.map((person) => {
            const StatusIcon = getStatusIcon(person.status);
            return (
              <div key={person.id} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                      {person.photoUrl ? (
                        <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-white">{person.name}</h4>
                        <span className="text-sm text-gray-400">Age {person.age}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(person.status)}`}>
                          {person.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-2">{person.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          Last seen: {person.lastSeen}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {person.reportedTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <StatusIcon className="h-6 w-6 text-blue-400" />
                </div>

                {person.aiMatchConfidence && (
                  <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-yellow-400 font-medium">AI Match Detected</span>
                      <span className="text-yellow-400 font-bold">{Math.round(person.aiMatchConfidence * 100)}% Confidence</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-yellow-500 transition-all duration-300"
                        style={{ width: `${person.aiMatchConfidence * 100}%` }}
                      ></div>
                    </div>
                    {person.currentLocation && (
                      <div className="mt-2 text-sm text-yellow-300">
                        Current location: {person.currentLocation}
                      </div>
                    )}
                  </div>
                )}

                {person.cameraMatches && person.cameraMatches.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Camera Matches</h5>
                    <div className="space-y-2">
                      {person.cameraMatches.map((match, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-600/30 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <Camera className="h-4 w-4 text-blue-400" />
                            <div>
                              <div className="text-sm text-white">{match.location}</div>
                              <div className="text-xs text-gray-400">{match.cameraId} • {match.timestamp.toLocaleTimeString()}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">{Math.round(match.confidence * 100)}%</div>
                            <div className="text-xs text-gray-400">confidence</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Reported by: {person.reportedBy}
                  </div>
                  <div className="flex space-x-2">
                    {person.status === 'potential-match' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(person.id, 'found')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Confirm Found
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(person.id, 'searching')}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          False Match
                        </button>
                      </>
                    )}
                    {person.status === 'searching' && (
                      <button
                        onClick={() => handleStatusUpdate(person.id, 'found')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Mark as Found
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LostAndFound;