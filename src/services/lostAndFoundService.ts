/**
 * Lost and Found Service
 * Handles communication with video processing backend
 */

export interface MissingPersonProfile {
  id: string;
  name: string;
  age: number;
  description: string;
  photoUrl?: string;
  topColor?: string;
  bottomColor?: string;
  accessories?: string[];
}

export interface MatchResult {
  personId: string;
  missingPersonId: string;
  confidence: number;
  attributes: {
    topColor?: string;
    bottomColor?: string;
    accessories?: string[];
  };
  timestamp: string;
  imageUrl?: string;
  location?: string;
}

export interface VideoStreamConfig {
  streamId: string;
  missingPersons: MissingPersonProfile[];
}

class LostAndFoundService {
  private baseUrl: string;
  private wsUrl: string;
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    // Use environment variable or default to localhost
    this.baseUrl = import.meta.env.VITE_VIDEO_PROCESSING_URL || 'http://localhost:8000';
    this.wsUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  }

  /**
   * Check if video processing service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Process a single frame (base64 encoded image)
   */
  async processFrame(
    imageData: string,
    missingPersons: MissingPersonProfile[]
  ): Promise<MatchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/process-frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          missingPersons: missingPersons,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.matches || [];
    } catch (error) {
      console.error('Error processing frame:', error);
      throw error;
    }
  }

  /**
   * Start WebSocket connection for real-time video stream
   */
  startVideoStream(
    config: VideoStreamConfig,
    onMatch: (match: MatchResult) => void,
    onError?: (error: Error) => void,
    onConnect?: () => void,
    onDisconnect?: () => void
  ): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    try {
      this.wsConnection = new WebSocket(`${this.wsUrl}/ws/video-stream`);

      this.wsConnection.onopen = () => {
        console.log('Video stream WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Send configuration
        this.wsConnection?.send(JSON.stringify({
          streamId: config.streamId,
          missingPersons: config.missingPersons,
        }));

        onConnect?.();
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const match: MatchResult = JSON.parse(event.data);
          onMatch(match);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(new Error('WebSocket connection error'));
      };

      this.wsConnection.onclose = () => {
        console.log('Video stream WebSocket disconnected');
        onDisconnect?.();

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
          console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            this.startVideoStream(config, onMatch, onError, onConnect, onDisconnect);
          }, delay);
        }
      };
    } catch (error) {
      console.error('Error starting video stream:', error);
      onError?.(error as Error);
    }
  }

  /**
   * Send frame to WebSocket stream
   */
  sendFrame(imageData: string): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'frame',
        image: imageData,
      }));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  /**
   * Update missing persons list in active stream
   */
  updateMissingPersons(missingPersons: MissingPersonProfile[]): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'update_profiles',
        missingPersons: missingPersons,
      }));
    }
  }

  /**
   * Stop video stream
   */
  stopVideoStream(): void {
    if (this.wsConnection) {
      if (this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({ type: 'stop' }));
      }
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  /**
   * Convert canvas or video element to base64
   */
  async captureFrame(source: HTMLVideoElement | HTMLCanvasElement): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        let canvas: HTMLCanvasElement;
        let ctx: CanvasRenderingContext2D | null;

        if (source instanceof HTMLVideoElement) {
          canvas = document.createElement('canvas');
          canvas.width = source.videoWidth || source.clientWidth;
          canvas.height = source.videoHeight || source.clientHeight;
          ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        } else {
          canvas = source;
        }

        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extract color from description text (simple heuristic)
   */
  extractColorsFromDescription(description: string): { topColor?: string; bottomColor?: string } {
    const colors = [
      'red', 'pink', 'blue', 'green', 'yellow', 'orange', 'purple',
      'black', 'white', 'gray', 'grey', 'brown', 'khaki', 'navy'
    ];

    const lowerDesc = description.toLowerCase();
    const result: { topColor?: string; bottomColor?: string } = {};

    // Look for top clothing patterns
    const topPatterns = ['shirt', 't-shirt', 'top', 'blouse', 'jacket', 'hoodie', 'sweater'];
    for (const color of colors) {
      for (const pattern of topPatterns) {
        if (lowerDesc.includes(`${color} ${pattern}`) || lowerDesc.includes(`${pattern} ${color}`)) {
          result.topColor = color.charAt(0).toUpperCase() + color.slice(1);
          break;
        }
      }
    }

    // Look for bottom clothing patterns
    const bottomPatterns = ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'bottom'];
    for (const color of colors) {
      for (const pattern of bottomPatterns) {
        if (lowerDesc.includes(`${color} ${pattern}`) || lowerDesc.includes(`${pattern} ${color}`)) {
          result.bottomColor = color.charAt(0).toUpperCase() + color.slice(1);
          break;
        }
      }
    }

    return result;
  }
}

export const lostAndFoundService = new LostAndFoundService();


