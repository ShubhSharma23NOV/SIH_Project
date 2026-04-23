import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8080') + '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DataPoint {
  timestamp: string;
  value: number;
}

export interface TrendsResponse {
  trends: {
    [key: string]: DataPoint[];
  };
  latestValues: {
    [key: string]: number;
  };
  timeRange: string;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  timestamp: string | { seconds: number; nanos: number };
  location?: string;
  ph: number | null;
  temperature: number | null;
  turbidity: number | null;
  dissolvedOxygen: number | null;
  totalDissolvedSolids: number | null;
  conductivity?: number | null;
  chlorine?: number | null;
  hardness?: number | null;
  waterLevel?: number | null;
  flowRate?: number | null;
  qualityStatus?: string;
  notes?: string;
}

export interface DashboardOverview {
  overallStatus: string;
  totalSensors: number;
  activeSensors: number;
  inactiveSensors: number;
  latestReadings: SensorReading[];
  qualityAlerts: number;
  totalSymptomReports: number;
  pendingReports: number;
  resolvedReports: number;
  recentSymptoms: string[];
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  qualityTrends: {
    [key: string]: DataPoint[];
  };
  qualityStatus: {
    [key: string]: string;
  };
}

export interface SensorData {
  deviceId: string;
  timestamp: string;
  location?: {
    lat: number;
    lon: number;
  };
  sensors?: {
    pH?: number;
    temperature_C?: number;
    turbidity_NTU?: number;
    DO_mgL?: number;
    TDS_ppm?: number;
  };
  battery?: {
    voltage?: number;
  };
}

// Dashboard endpoints
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  try {
    const response = await apiClient.get('/dashboard/overview');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
};

// Get water quality trends
export const getWaterQualityTrends = async (hours: number = 24): Promise<TrendsResponse> => {
  try {
    const response = await apiClient.get(`/dashboard/water-quality/trends`, {
      params: { hours }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching water quality trends:', error);
    throw error;
  }
};

// Sensor data endpoints
export const getLatestSensorData = async (): Promise<SensorData> => {
  try {
    const response = await apiClient.get('/sensor-data/latest');
    return response.data;
  } catch (error) {
    console.error('Error fetching latest sensor data:', error);
    throw error;
  }
};

export const getSensorDataByDeviceId = async (deviceId: string): Promise<SensorData> => {
  try {
    const response = await apiClient.get(`/sensor-data/device/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor data for device:', error);
    throw error;
  }
};

export const getAllSensorReadings = async (): Promise<SensorReading[]> => {
  try {
    const response = await apiClient.get('/sensor-data/all-readings');
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    throw error;
  }
};

export const getReadingsBySensorId = async (sensorId: string): Promise<SensorReading[]> => {
  try {
    const response = await apiClient.get(`/sensor-data/readings/sensor/${sensorId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching readings for sensor:', error);
    throw error;
  }
};

export const getLatestReadingBySensorId = async (sensorId: string): Promise<SensorReading> => {
  try {
    const response = await apiClient.get(`/sensor-data/readings/sensor/${sensorId}/latest`);
    return response.data;
  } catch (error) {
    console.error('Error fetching latest reading for sensor:', error);
    throw error;
  }
};

export const getRecentReadings = async (limit: number = 10): Promise<SensorData[]> => {
  try {
    const response = await apiClient.get('/sensor-data/readings', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent readings:', error);
    throw error;
  }
};

// Get all device IDs
export const getDeviceIds = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/sensor-data/device-ids');
    return response.data.deviceIds || [];
  } catch (error) {
    console.error('Error fetching device IDs:', error);
    throw error;
  }
};

// Get sensor statistics
export const getSensorStatistics = async () => {
  try {
    const response = await apiClient.get('/sensor-data/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor statistics:', error);
    throw error;
  }
};

// Alert endpoints
export interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  location?: string;
  sensorId?: string;
  parameter?: string;
  thresholdValue?: number;
  actualValue?: number;
  sensorReadingId?: string;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  status: string;
  notificationMethod?: string;
  relatedSymptomReportIds?: string[];
  notifiedUsers?: string[];
  affectedUsers?: string[];
  resolutionNotes?: string;
  resolvedBy?: string;
  actionTaken?: string;
  notes?: string;
}

export const getAllAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await apiClient.get('/alerts');
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};

export const getAlertById = async (id: string): Promise<Alert> => {
  try {
    const response = await apiClient.get(`/alerts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching alert:', error);
    throw error;
  }
};

export const getAlertsByStatus = async (status: string): Promise<Alert[]> => {
  try {
    const response = await apiClient.get(`/alerts/status/${status}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts by status:', error);
    throw error;
  }
};

export const getAlertsBySeverity = async (severity: string): Promise<Alert[]> => {
  try {
    const response = await apiClient.get(`/alerts/severity/${severity}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts by severity:', error);
    throw error;
  }
};

export const getActiveAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await apiClient.get('/alerts/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    throw error;
  }
};

export const getCriticalAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await apiClient.get('/alerts/critical');
    return response.data;
  } catch (error) {
    console.error('Error fetching critical alerts:', error);
    throw error;
  }
};

export const acknowledgeAlert = async (id: string, userId: string = 'system'): Promise<Alert> => {
  try {
    const response = await apiClient.post(`/alerts/${id}/acknowledge`, { userId });
    return response.data;
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
};

export const resolveAlert = async (
  id: string,
  resolvedBy: string = 'system',
  resolutionNotes: string = ''
): Promise<Alert> => {
  try {
    const response = await apiClient.post(`/alerts/${id}/resolve`, { resolvedBy, resolutionNotes });
    return response.data;
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
};

export const getAlertStatistics = async () => {
  try {
    const response = await apiClient.get('/alerts/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    throw error;
  }
};

export const createAlert = async (alert: Partial<Alert>): Promise<Alert> => {
  try {
    const response = await apiClient.post('/alerts', alert);
    return response.data;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};

export default apiClient;
