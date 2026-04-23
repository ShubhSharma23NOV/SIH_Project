import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot,
  where
} from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase.config';

// Initialize Firebase
let firebaseApp;
let firestoreDb;

try {
  firebaseApp = initializeApp(firebaseConfig);
  firestoreDb = getFirestore(firebaseApp);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Test Firebase connection
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Try to get a document count from the sensor_readings collection
    const q = query(collection(db, 'sensor_readings'), limit(1));
    const snapshot = await getDocs(q);
    console.log('✅ Firebase connection successful!');
    console.log(`📊 Found ${snapshot.size} documents in sensor_readings collection`);

    // Log sample data structure if available
    if (!snapshot.empty) {
      const sampleDoc = snapshot.docs[0];
      console.log('📋 Sample document structure:', JSON.stringify(sampleDoc.data(), null, 2));
    }

    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};

// Use the initialized Firestore instance
const db = firestoreDb;

// Type for sensor reading document
export interface SensorReadingDocument extends DocumentData {
  id: string;
  sensorId: string;
  timestamp: Timestamp;
  location: string;  // Stored as "lat,lng" string
  ph: number;
  turbidity: number;
  totalDissolvedSolids: number;
  dissolvedOxygen: number;
  temperature: number;
  batteryVoltage: number;
  notes?: string;
  // Additional fields from your data
  chlorine?: number;
  conductivity?: number;
  flowRate?: number;
  hardness?: number;
  waterLevel?: number;
  qualityStatus?: string;
}

// Convert Firestore document to SensorReadingDocument
const convertToSensorReading = (doc: QueryDocumentSnapshot): SensorReadingDocument => {
  const data = doc.data();
  console.log('Document data in convertToSensorReading:', JSON.stringify(data, null, 2));

  // Parse location
  let location = '0,0';
  if (data.location) {
    if (typeof data.location === 'string') {
      location = data.location;
    } else if (data.location.lat && data.location.lon) {
      location = `${data.location.lat},${data.location.lon}`;
    } else if (data.location.latitude && data.location.longitude) {
      location = `${data.location.latitude},${data.location.longitude}`;
    }
  }

  // Parse sensor data from nested structure
  const sensors = data.sensors || {};

  // Debug log the data structure
  console.log('Data structure:', JSON.stringify(data, null, 2));

  // Parse battery voltage from notes
  let batteryVoltage = 0;
  if (data.notes) {
    // Try different patterns to extract battery voltage
    const voltageMatch = data.notes.match(/Battery Voltage:?\s*(\d+(?:\.\d+)?)\s*V?/i);
    if (voltageMatch && voltageMatch[1]) {
      batteryVoltage = parseFloat(voltageMatch[1]);
      console.log('Extracted battery voltage from notes:', batteryVoltage);
    }
  }

  // First, try to get batteryVoltage directly from the document
  if (typeof data.batteryVoltage === 'number' && data.batteryVoltage > 0) {
    batteryVoltage = data.batteryVoltage;
    console.log('Using direct batteryVoltage:', batteryVoltage);
  }
  // If not available, try to parse from notes as fallback
  else if (data.notes) {
    // Try different formats that might be in the notes
    const voltageMatch = data.notes.match(/Battery Voltage:?\s*([\d.]+)/i) ||
      data.notes.match(/Battery:?\s*([\d.]+)V?/i);

    if (voltageMatch && voltageMatch[1]) {
      const parsedVoltage = parseFloat(voltageMatch[1]);
      // Only use if we got a valid number
      if (!isNaN(parsedVoltage) && parsedVoltage > 0) {
        batteryVoltage = parsedVoltage;
      }
    }
  }

  return {
    id: doc.id,
    sensorId: data.sensorId || data.deviceId || 'unknown',
    timestamp: data.timestamp || Timestamp.now(),
    location: location, // Use the parsed location
    // Try nested sensors first, then flat structure
    ph: typeof sensors.pH === 'number' ? sensors.pH :
      (typeof data.ph === 'number' ? data.ph : 0),
    turbidity: typeof sensors.turbidity_NTU === 'number' ? sensors.turbidity_NTU :
      (typeof data.turbidity === 'number' ? data.turbidity : 0),
    totalDissolvedSolids: typeof sensors.TDS_ppm === 'number' ? sensors.TDS_ppm :
      (typeof data.totalDissolvedSolids === 'number' ? data.totalDissolvedSolids : 0),
    dissolvedOxygen: typeof sensors.DO_mgL === 'number' ? sensors.DO_mgL :
      (typeof data.dissolvedOxygen === 'number' ? data.dissolvedOxygen : 0),
    temperature: typeof sensors.temperature_C === 'number' ? sensors.temperature_C :
      (typeof data.temperature === 'number' ? data.temperature : 0),
    batteryVoltage: batteryVoltage,
    notes: data.notes || '',
    // Additional fields
    chlorine: data.chlorine || 0,
    conductivity: data.conductivity || 0,
    flowRate: data.flowRate || 0,
    hardness: data.hardness || 0,
    waterLevel: data.waterLevel || 0,
    qualityStatus: data.qualityStatus || 'UNKNOWN'
  };
};

// Get latest sensor reading for a device
export const getLatestReading = async (sensorId: string): Promise<SensorReadingDocument | null> => {
  try {
    // Query the most recent document
    const q = query(
      collection(db, 'sensor_readings'),
      where('sensorId', '==', sensorId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log('No readings found for sensor:', sensorId);
      return null;
    }

    // Get the first document from the query
    const doc = querySnapshot.docs[0];
    if (!doc.exists()) {
      console.log('Document does not exist');
      return null;
    }

    // Convert the document to our sensor reading format
    return {
      id: doc.id,
      sensorId: doc.get('sensorId') || '',
      timestamp: doc.get('timestamp'),
      location: doc.get('location') || '0,0',
      ph: doc.get('ph') || 0,
      turbidity: doc.get('turbidity') || 0,
      totalDissolvedSolids: doc.get('totalDissolvedSolids') || 0,
      dissolvedOxygen: doc.get('dissolvedOxygen') || 0,
      temperature: doc.get('temperature') || 0,
      batteryVoltage: doc.get('batteryVoltage') || 0,
      notes: doc.get('notes'),
      chlorine: doc.get('chlorine'),
      conductivity: doc.get('conductivity'),
      flowRate: doc.get('flowRate'),
      hardness: doc.get('hardness'),
      waterLevel: doc.get('waterLevel'),
      qualityStatus: doc.get('qualityStatus')
    } as SensorReadingDocument;
  } catch (error) {
    console.error('Error getting latest reading:', error);
    throw error;
  }
};

// Subscribe to real-time updates for a device
export const subscribeToDeviceUpdates = (
  sensorId: string,
  onUpdate: (reading: SensorReadingDocument | null) => void
): (() => void) => {
  try {
    const q = query(
      collection(db, 'sensor_readings'),
      where('sensorId', '==', sensorId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        console.log('Received real-time update for sensor:', sensorId);
        console.log('Query snapshot:', querySnapshot);

        if (querySnapshot.empty) {
          console.log('No readings found for sensor:', sensorId);
          onUpdate(null);
          return;
        }
        try {
          const doc = querySnapshot.docs[0];
          console.log('Document data:', doc.data());

          if (!doc.exists()) {
            console.log('Document does not exist');
            onUpdate(null);
            return;
          }

          const reading: SensorReadingDocument = {
            id: doc.id,
            sensorId: doc.get('sensorId') || '',
            timestamp: doc.get('timestamp'),
            location: doc.get('location') || '0,0',
            ph: doc.get('ph') || 0,
            turbidity: doc.get('turbidity') || 0,
            totalDissolvedSolids: doc.get('totalDissolvedSolids') || 0,
            dissolvedOxygen: doc.get('dissolvedOxygen') || 0,
            temperature: doc.get('temperature') || 0,
            batteryVoltage: doc.get('batteryVoltage') || 0,
            notes: doc.get('notes'),
            chlorine: doc.get('chlorine'),
            conductivity: doc.get('conductivity'),
            flowRate: doc.get('flowRate'),
            hardness: doc.get('hardness'),
            waterLevel: doc.get('waterLevel'),
            qualityStatus: doc.get('qualityStatus')
          };

          console.log('Received update for sensor:', sensorId, reading);
          onUpdate(reading);
        } catch (error) {
          console.error('Error processing document:', error);
          onUpdate(null);
        }
      },
      (error) => {
        console.error('Error in subscription for sensor', sensorId, ':', error);
        onUpdate(null);
      }
    );

    return () => {
      console.log('Unsubscribing from updates for sensor:', sensorId);
      unsubscribe();
    };
  } catch (error) {
    console.error('Error setting up subscription:', error);
    return () => { }; // Return empty cleanup function
  }
};

// Get historical readings for a device
export const getHistoricalReadings = async (
  sensorId: string,
  limitCount: number = 100
): Promise<SensorReadingDocument[]> => {
  try {
    const q = query(
      collection(db, 'sensor_readings'),
      where('sensorId', '==', sensorId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const readings = querySnapshot.docs.map(doc => convertToSensorReading(doc));
    console.log(`Retrieved ${readings.length} historical readings for sensor:`, sensorId);
    return readings;
  } catch (error) {
    console.error('Error getting historical readings:', error);
    throw error;
  }
};
