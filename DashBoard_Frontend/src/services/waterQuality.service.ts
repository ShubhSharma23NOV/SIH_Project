/**
 * Water Quality Service
 * Connects to new government-standard water quality assessment API
 */

import apiClient from './api.service';

export interface WaterQualityResponse {
  finalStatus: 'GOOD' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  statusReason: string;
  parameterStatus: {
    pH: string;
    TDS: string;
    Turbidity: string;
    Temperature: string;
  };
  deviceHealth: {
    batteryVoltage: number | null;
    batteryLevel?: number | null;
    batteryStatus: 'NORMAL' | 'LOW' | 'CRITICAL' | 'NOT_REPORTING';
  };
  wqiScore?: number;
  latestReadings?: {
    pH: number | null;
    TDS: number | null;
    Turbidity: number | null;
    Temperature: number | null;
  };
}

export interface LocationHierarchy {
  states: string[];
  districts: string[];
  cities: string[];
  villages: string[];
}

export interface DeviceInfo {
  deviceId: string;
  state: string;
  district: string;
  cityOrTown: string;
  village: string;
  lat: number;
  lon: number;
  waterSourceType: string;
  verified: boolean;
}

/**
 * Calculate battery level from voltage (Li-ion: 3.0V-4.2V)
 */
const calculateBatteryLevel = (voltage: number | null): number | null => {
  if (!voltage || voltage <= 0) return null;
  const minVoltage = 3.0;
  const maxVoltage = 4.2;
  const percentage = ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100;
  return Math.max(0, Math.min(100, percentage));
};

/**
 * Fetch water quality assessment for a device
 */
export const getWaterQuality = async (deviceId: string): Promise<WaterQualityResponse> => {
  try {
    const response = await apiClient.get(`/sensor-data/water-quality/${deviceId}`);
    const data = response.data;
    
    // Calculate battery level from voltage if not provided
    if (data.deviceHealth && !data.deviceHealth.batteryLevel && data.deviceHealth.batteryVoltage) {
      data.deviceHealth.batteryLevel = calculateBatteryLevel(data.deviceHealth.batteryVoltage);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching water quality:', error);
    throw error;
  }
};

/**
 * Fetch all states with registered devices
 */
export const getStates = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get('/locations/states');
    return response.data;
  } catch (error) {
    console.error('Error fetching states:', error);
    return [];
  }
};

/**
 * Fetch districts for a state
 */
export const getDistricts = async (state: string): Promise<string[]> => {
  try {
    const response = await apiClient.get('/locations/districts', {
      params: { state }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
};

/**
 * Fetch cities for a state and district
 */
export const getCities = async (state: string, district: string): Promise<string[]> => {
  try {
    const response = await apiClient.get('/locations/cities', {
      params: { state, district }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

/**
 * Fetch villages for a location hierarchy (city is optional)
 */
export const getVillages = async (state: string, district: string, city?: string): Promise<string[]> => {
  try {
    const params: any = { state, district };
    if (city) params.city = city;

    const response = await apiClient.get('/locations/villages', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching villages:', error);
    return [];
  }
};

/**
 * Fetch devices by location hierarchy (all parameters optional)
 */
export const getDevicesByLocation = async (
  state?: string,
  district?: string,
  city?: string,
  village?: string
): Promise<DeviceInfo[]> => {
  try {
    const params: any = {};
    if (state) params.state = state;
    if (district) params.district = district;
    if (city) params.city = city;
    if (village) params.village = village;

    const response = await apiClient.get('/locations/devices', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
};

/**
 * Get battery status configuration
 */
export const getBatteryConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    NORMAL: {
      label: 'Normal',
      color: '#10b981' // green
    },
    LOW: {
      label: 'Low',
      color: '#f59e0b' // yellow
    },
    CRITICAL: {
      label: 'Critical',
      color: '#ef4444' // red
    },
    NOT_REPORTING: {
      label: 'Not reporting',
      color: '#6b7280' // gray
    }
  };

  return configs[status] || configs.NOT_REPORTING;
};
