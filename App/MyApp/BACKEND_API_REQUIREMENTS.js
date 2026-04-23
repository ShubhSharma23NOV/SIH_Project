/**
 * BACKEND API REQUIREMENTS FOR ENHANCED EMERGENCY SCREEN
 * 
 * Base URL: Configure in EnhancedEmergencyService.js
 * const API_BASE_URL = 'https://your-backend-url.com';
 */

// ============================================
// 1. RISK DETECTION API
// ============================================
/*
POST /api/emergency/detect-risk

Request Body:
{
  latitude: number,
  longitude: number
}

Response:
{
  riskLevel: 'safe' | 'caution' | 'contaminated',
  riskScore: number (0-100),
  suggestedActions: string[]
}

Purpose: Analyzes water safety based on location, sensor data, lab reports, and previous alerts
*/

// ============================================
// 2. NEAREST PHC LOOKUP API
// ============================================
/*
GET /api/emergency/nearest-phc?lat={latitude}&lon={longitude}

Response:
{
  name: string,
  distance: string (e.g., "2.3 km"),
  bedsAvailable: number,
  doctorsOnDuty: number,
  emergencyCapacity: number (percentage),
  phone: string
}

Purpose: Returns nearest Primary Health Center with real-time availability data
*/

// ============================================
// 3. SEND EMERGENCY ALERT API
// ============================================
/*
POST /api/emergency/send-alert

Request Body:
{
  userId: string,
  userPhone: string,
  type: 'sos' | 'emergency',
  latitude: number,
  longitude: number,
  riskLevel: string,
  contacts: string[], // Array of phone numbers
  timestamp: number
}

Response:
{
  alertId: string,
  success: boolean,
  message?: string
}

Purpose: Sends emergency alert to ASHA worker, Supervisor, and District Health Office
*/

// ============================================
// 4. GET EMERGENCY CONTACTS API
// ============================================
/*
GET /api/emergency/contacts?userId={userId}

Response:
{
  contacts: [
    {
      name: string,
      phone: string,
      role: 'Primary' | 'Secondary' | 'Tertiary',
      priority: number
    }
  ]
}

Purpose: Returns emergency contacts for the user (ASHA worker, Supervisor, etc.)
*/

// ============================================
// 5. SUBMIT SYMPTOM REPORT API
// ============================================
/*
POST /api/symptoms/report

Request Body:
{
  userId: string,
  symptoms: string[], // ['vomiting', 'diarrhea', 'fever', etc.]
  severity: number (1-3),
  timestamp: number,
  location: {
    lat: number,
    lng: number
  }
}

Response:
{
  reportId: string,
  outbreakAlert: boolean,
  message: string
}

Purpose: Submits symptom report for outbreak detection and health monitoring
*/

// ============================================
// 6. UPLOAD PHOTO EVIDENCE API
// ============================================
/*
POST /api/evidence/upload
Content-Type: multipart/form-data

FormData Fields:
- images: File[] (multiple image files)
- description: string
- lat: number
- lng: number
- userId: string

Response:
{
  evidenceId: string,
  assignedTo: string,
  routingPath: string[] // ['ASHA Worker', 'Supervisor', 'City Officer']
}

Purpose: Uploads photos of water quality issues with automatic routing to officials
*/

// ============================================
// 7. GET HEALTH ADVISORIES API
// ============================================
/*
GET /api/emergency/advisories

Response:
{
  advisories: [
    {
      title: string,
      message: string,
      date: string (ISO format),
      author: string
    }
  ]
}

Purpose: Returns health advisories from District Health Office
*/

// ============================================
// 8. GET WATER DISTRIBUTION UPDATES API
// ============================================
/*
GET /api/emergency/water-updates

Response:
{
  updates: [
    {
      type: 'tanker' | 'repair' | 'chlorination',
      message: string,
      eta: string | null,
      timestamp: string (ISO format)
    }
  ]
}

Purpose: Returns real-time water distribution updates (tankers, repairs, chlorination)
*/

// ============================================
// 9. ACKNOWLEDGE ALERT API (Optional)
// ============================================
/*
POST /api/alerts/acknowledge

Request Body:
{
  alertId: string,
  acknowledgedBy: string
}

Response:
{
  success: boolean
}

Purpose: Marks emergency alert as acknowledged by responder
*/

// ============================================
// 10. ESCALATE ALERT API (Optional)
// ============================================
/*
POST /api/alerts/escalate

Request Body:
{
  alertId: string,
  escalateTo: string // 'Supervisor' | 'District Health Office'
}

Response:
{
  success: boolean,
  escalatedTo: string
}

Purpose: Manually escalates alert to higher authority
*/

// ============================================
// DEPENDENCIES TO INSTALL
// ============================================
/*
npm install @react-native-community/geolocation
npm install @react-native-community/netinfo
npm install react-native-image-picker
npm install react-native-sqlite-storage (for offline storage)
*/

// ============================================
// FIRESTORE COLLECTIONS (Optional for sync)
// ============================================
/*
Collection: emergency_logs
{
  ashaWorkerId: string,
  ashaPhone: string,
  actionType: string,
  alertType: string,
  symptoms: array,
  geoLocation: GeoPoint,
  riskLevel: string,
  escalated: boolean,
  escalatedTo: string,
  resolved: boolean,
  responseTime: number,
  createdAt: Timestamp,
  syncedAt: Timestamp
}

Collection: symptom_reports
{
  userId: string,
  symptoms: array,
  severity: number,
  location: GeoPoint,
  timestamp: Timestamp,
  outbreakAlert: boolean
}
*/
