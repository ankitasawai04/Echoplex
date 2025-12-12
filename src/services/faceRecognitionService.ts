/**
 * Face Recognition Service
 * Handles communication with Python face recognition backend
 */

export interface FaceUploadResponse {
  success: boolean;
  personId: string;
  embedding_created: boolean;
  photo_path?: string;
  error?: string;
}

export interface FaceMatch {
  personId: string;
  name: string;
  confidence: number;
  face_distance: number;
  location: string;
  timestamp: string;
}

export interface LiveStats {
  totalScans: number;
  facesDetected: number;
  activeMatches: number;
  totalMissingPersons: number;
  searchingCount: number;
}

export interface MissingPersonSearchResult {
  personId: string;
  name: string;
  age: number;
  description: string;
  last_seen?: string;
  reported_by?: string;
  status: string;
  match_score: number;
  photo_path?: string;
}

class FaceRecognitionService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost:8001
    this.baseUrl = import.meta.env.VITE_FACE_RECOGNITION_URL || 'http://localhost:8001';
  }

  /**
   * Check if face recognition service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Face recognition health check failed:', error);
      return false;
    }
  }

  /**
   * Upload missing person photo and extract face embedding
   */
  async uploadMissingPerson(formData: FormData): Promise<FaceUploadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/face/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading missing person:', error);
      throw error;
    }
  }

  /**
   * Search by image (compare camera frame against stored faces)
   */
  async searchByImage(imageFile: File): Promise<FaceMatch[]> {
    try {
      const formData = new FormData();
      formData.append('photo', imageFile);
      formData.append('tolerance', '0.6'); // Default tolerance

      const response = await fetch(`${this.baseUrl}/api/face/match`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching by image:', error);
      throw error;
    }
  }

  /**
   * Search by text description
   */
  async searchByDescription(description: string): Promise<MissingPersonSearchResult[]> {
    try {
      const formData = new FormData();
      formData.append('description', description);

      const response = await fetch(`${this.baseUrl}/api/face/search-by-description`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.potential_matches || [];
    } catch (error) {
      console.error('Error searching by description:', error);
      throw error;
    }
  }

  /**
   * Get live camera feed statistics
   */
  async getLiveMatches(): Promise<LiveStats> {
    try {
      const response = await fetch(`${this.baseUrl}/api/face/cameras/live`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting live matches:', error);
      // Return default stats on error
      return {
        totalScans: 0,
        facesDetected: 0,
        activeMatches: 0,
        totalMissingPersons: 0,
        searchingCount: 0,
      };
    }
  }

  /**
   * Update case status
   */
  async updateCaseStatus(personId: string, status: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('status', status);

      const response = await fetch(`${this.baseUrl}/api/face/case/${personId}/status`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Error updating case status:', error);
      return false;
    }
  }

  /**
   * Get all missing persons
   */
  async getAllPersons(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/face/persons`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.persons || [];
    } catch (error) {
      console.error('Error getting all persons:', error);
      return [];
    }
  }
}

export const faceRecognitionService = new FaceRecognitionService();


